// AI内容分析服务
// AI Analyzer Service  
// 使用Claude API分析内容并匹配频段系统

const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../config/database');
const { withTimeout, withRetry, TIMEOUTS, RETRY_CONFIGS } = require('../utils/api-utils');
const { safeParseAiJson } = require('../utils/safe-json-parse');

// Claude API配置 - 优先使用环境变量，fallback到配置文件（开发环境）
const getApiKey = (key) => {
    if (process.env[key]) return process.env[key];
    // 开发环境 fallback
    if (process.env.NODE_ENV !== 'production') {
        try {
            const config = require('../config/api-keys.json');
            if (config[key]) {
                console.warn(`⚠️ 使用本地配置文件中的 ${key}（仅限开发环境）`);
                return config[key];
            }
        } catch (e) {
            // 配置文件不存在，忽略
        }
    }
    console.warn(`⚠️ API Key ${key} 未在环境变量中配置`);
    return null;
};
const CLAUDE_API_KEY = getApiKey('CLAUDE_API_KEY');

const anthropic = new Anthropic({
    apiKey: CLAUDE_API_KEY
});

// 频段定义系统 v2.0
// 核心问题统一为"是否"格式，答案为"是/否"二元选择，支持统计汇总
const BAND_DEFINITIONS = {
    T1: {
        question: "AI是否正在加剧社会分层?",
        yesLabel: "是，正在加剧",
        noLabel: "否，趋向普惠",
        yesDescription: "技术红利集中于精英阶层",
        noDescription: "技术正在降低门槛、普惠大众"
    },
    T2: {
        question: "技术是否正在绕开制度约束?",
        yesLabel: "是，正在绕开",
        noLabel: "否，可被规制",
        yesDescription: "技术发展天然抵抗制度管控",
        noDescription: "技术可以被现有制度吸收和规范"
    },
    T3: {
        question: "技术发展是否已脱离人类掌控?",
        yesLabel: "是，正在失控",
        noLabel: "否，仍可引导",
        yesDescription: "技术自主演化，人类被动适应",
        noDescription: "人类仍能主导技术发展方向"
    },
    P1: {
        question: "民主制度是否正在失效?",
        yesLabel: "是，正在失效",
        noLabel: "否，仍然有效",
        yesDescription: "民主无法应对高复杂度社会挑战",
        noDescription: "民主仍是最不坏的治理方式"
    },
    P2: {
        question: "权力是否正在脱离公众视野?",
        yesLabel: "是，正在隐蔽化",
        noLabel: "否，仍可监督",
        yesDescription: "真正的权力运作越来越不透明",
        noDescription: "公众仍能有效监督权力运行"
    },
    Φ1: {
        question: "自由与安全是否必须二选一?",
        yesLabel: "是，必须取舍",
        noLabel: "否，可以兼得",
        yesDescription: "更多安全必然牺牲部分自由",
        noDescription: "良好设计可以同时保障两者"
    },
    Φ3: {
        question: "算法优化是否正在侵蚀自由意志?",
        yesLabel: "是，正在侵蚀",
        noLabel: "否，只是工具",
        yesDescription: "算法推荐正在替代人类自主选择",
        noDescription: "人类仍保有最终决定权"
    },
    H1: {
        question: "当前文明是否正在走向衰退?",
        yesLabel: "是，正在衰退",
        noLabel: "否，只是调整",
        yesDescription: "文明正在经历系统性倒退",
        noDescription: "这只是历史周期性调整"
    },
    H2: {
        question: "历史是否正在重复衰落模式?",
        yesLabel: "是，正在重复",
        noLabel: "否，时代不同",
        yesDescription: "当前征兆与历史崩溃前夕相似",
        noDescription: "现代社会具备自我修复能力"
    },
    R2: {
        question: "科技是否正在成为新宗教?",
        yesLabel: "是，正在替代",
        noLabel: "否，只是工具",
        yesDescription: "科技正在承担传统信仰的功能",
        noDescription: "科技只是解决问题的手段"
    },
    F2: {
        question: "金融是否正在加剧社会撕裂?",
        yesLabel: "是，正在加剧",
        noLabel: "否，可以修复",
        yesDescription: "金融化正在侵蚀社会基础",
        noDescription: "金融系统具备自我修正能力"
    }
};

/**
 * 构建分析提示词
 * @param {string} transcript - 转录文本
 * @param {Object} metadata - 视频元数据
 * @returns {string} 完整提示词
 */
const buildAnalysisPrompt = (transcript, metadata) => {
    // 构建频段列表，包含核心问题和是/否立场
    const bandList = Object.entries(BAND_DEFINITIONS)
        .map(([id, def]) => `${id}: 核心问题「${def.question}」\n     是=${def.yesDescription} / 否=${def.noDescription}`)
        .join('\n');

    return `你是「思想雷达」(Thoughts Radar)的内容分析师。请分析以下访谈/演讲转录，提取符合我们频段系统的观点。

**频段系统（11个时代级核心问题）**
${bandList}

**转录内容**
${transcript.substring(0, 8000)}

**视频元数据**
- 标题: ${metadata.title || '未知'}
- 频道: ${metadata.channelTitle || '未知'}
- 发布日期: ${metadata.publishedAt ? new Date(metadata.publishedAt).toLocaleDateString('zh-CN') : '未知'}
${metadata.description ? `- 描述: ${metadata.description.substring(0, 200)}` : ''}

**输出要求**

请输出JSON数组，每个元素代表一个识别到的观点，格式如下：

\`\`\`json
[
  {
    "freq": "T1",
    "stance": "yes",
    "title": "简明标题（20字内，鲜明表达立场）",
    "author_name": "发言者姓名",
    "author_bio": "身份简介（如\\"MIT经济学教授\\"）",
    "source": "准确的来源信息（格式：YYYY年M月D日 · 平台/出版物 · 具体栏目或视频标题）",
    "content": "500字以上的论述，必须包含：\\n1. 核心观点陈述\\n2. 主要论据（引用原文）\\n3. 社会影响分析\\n分段论证，引用具体例子",
    "tension_q": "贴合本文内容的个性化问题（必须是该频段核心问题在本文中的具体体现，以'是否'开头）",
    "keywords": ["关键词1", "关键词2", "关键词3"]
  }
]
\`\`\`

**🎯 张力问题设计要求（重要）**

1. **tension_q 必须个性化**：不要直接复制频段核心问题，而是根据文章具体内容，生成一个贴合本文的"是否..."问题
   - 例如 T1 核心问题是「AI是否正在加剧社会分层?」
   - 如果文章讨论 Intel 衰落，tension_q 可以是：「Intel的衰落是否意味着芯片创新正在精英化？」
   - 问题必须自然贴合文章内容，不能突兀

2. **stance 必须是 "yes" 或 "no"**：
   - "yes" = 作者倾向于肯定该问题（如认为正在加剧、正在失效等）
   - "no" = 作者倾向于否定该问题（如认为趋向普惠、仍然有效等）

3. **所有同一频段的投票会汇总**：用户对不同文章的投票会统计到该频段的趋势

**⚠️ 内容真实性要求（强制执行）**
1. source字段必须准确反映视频的真实发布日期和频道名称
2. 只能提取视频中实际表达的观点，禁止编造或推测
3. 引用必须是发言者真正说过的话，使用引号标注
4. 事件时间线必须准确（如乌克兰战争始于2022年2月）
5. 如果内容不适合或无法确认真实性，返回空数组 []

**注意事项**
1. 如果访谈内容不涉及任何频段问题，返回空数组 []
2. content字段必须≥500字，充分论证观点
3. 引用原文时使用引号标注
4. stance必须明确为 "yes" 或 "no"（小写）
5. 每个观点对应一个频段，不要重复
6. 关键词3-5个，反映核心概念

请直接返回JSON，不要包含其他解释性文本。`;
};

/**
 * 构建元数据分析提示词（无字幕时的 fallback）
 * @param {Object} metadata - 视频元数据
 * @returns {string} 完整提示词
 */
const buildMetadataPrompt = (metadata) => {
    // 构建频段列表，包含核心问题和是/否立场
    const bandList = Object.entries(BAND_DEFINITIONS)
        .map(([id, def]) => `${id}: 核心问题「${def.question}」\n     是=${def.yesDescription} / 否=${def.noDescription}`)
        .join('\n');

    return `你是「思想雷达」(Thoughts Radar)的内容分析师。这个视频没有可用字幕，但我们有详细的元数据。请基于以下信息提取符合频段系统的观点。

**频段系统（11个时代级核心问题）**
${bandList}

**视频信息**
- 标题: ${metadata.title || '未知'}
- 频道: ${metadata.channelTitle || '未知'}
- 发布日期: ${metadata.publishedAt ? new Date(metadata.publishedAt).toLocaleDateString('zh-CN') : '未知'}
- 描述: ${metadata.description || '无描述'}
${metadata.tags ? `- 标签: ${metadata.tags.slice(0, 10).join(', ')}` : ''}

**输出要求**

请基于视频标题、描述和频道信息，输出JSON数组。每个元素代表一个可能的观点，格式如下：

\`\`\`json
[
  {
    "freq": "T1",
    "stance": "yes",
    "title": "简明标题（20字内，鲜明表达立场）",
    "author_name": "发言者姓名（从标题或描述中提取）",
    "author_bio": "身份简介",
    "source": "源信息（格式：YYYY年M月D日 · 平台 · 视频标题）",
    "content": "400字以上的论述，基于视频标题和描述合理推断内容要点",
    "tension_q": "贴合本视频的个性化问题（必须是该频段核心问题在本视频中的具体体现，以'是否'开头）",
    "keywords": ["关键词1", "关键词2", "关键词3"]
  }
]
\`\`\`

**🎯 张力问题设计要求**
1. tension_q 必须个性化，贴合视频内容，不要直接复制频段核心问题
2. stance 必须是 "yes" 或 "no"（小写）

**❗ 内容真实性要求（强制执行）**
1. source字段必须准确反映视频的真实发布日期和频道名称
2. author_name必须从标题或描述中明确提取，禁止编造
3. 内容必须基于视频标题和描述的真实信息推断，不能凭空编造
4. 如果无法从元数据确定主题与频段系统的关联，返回空数组 []
5. 每个观点必须明确标注「基于元数据推断」

**注意事项**
1. 由于没有字幕，内容应基于合理推断，而非具体引用
2. 如果视频主题与频段系统无关，返回空数组 []
3. content字段必须≥400字
4. stance必须明确为 "yes" 或 "no"（小写）

请直接返回JSON，不要包含其他解释性文本。`;
};

/**
 * 使用Claude分析转录内容
 * @param {string} transcript - 转录文本
 * @param {Object} metadata - 视频元数据
 * @returns {Promise<Object>} 分析结果 {items: [], analyzed: boolean}
 */
const analyzeTranscript = async (transcript, metadata = {}) => {
    try {
        if (!CLAUDE_API_KEY) {
            throw new Error('Claude API key未配置');
        }

        if (!transcript || transcript.length < 100) {
            throw new Error('转录内容太短，无法分析');
        }

        const prompt = buildAnalysisPrompt(transcript, metadata);

        console.log('调用Claude API进行分析...');

        const message = await withRetry(
            () => withTimeout(
                anthropic.messages.create({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4096,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                }),
                TIMEOUTS.CLAUDE_API,
                'Claude API 请求超时'
            ),
            RETRY_CONFIGS.CLAUDE_API
        );

        const responseText = message.content[0].text;

        // 解析JSON响应（增强版：带错误恢复）
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn('Claude响应中未找到JSON数组');
            return { items: [], analyzed: true, rawResponse: responseText };
        }

        let items;
        try {
            items = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            // 尝试修复常见JSON问题
            console.warn('JSON解析失败，尝试修复...');
            console.warn('解析错误位置:', parseError.message);

            let fixedJson = jsonMatch[0]
                // 修复尾随逗号
                .replace(/,\s*]/g, ']')
                .replace(/,\s*}/g, '}')
                // 修复未转义的换行符在字符串中
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                // 修复未转义的引号
                .replace(/(?<!\\)"/g, (match, offset, string) => {
                    // 跳过已经是JSON结构的引号
                    const before = string.substring(Math.max(0, offset - 1), offset);
                    const after = string.substring(offset + 1, offset + 2);
                    if (before === ':' || before === '[' || before === '{' || before === ',' ||
                        after === ':' || after === ']' || after === '}' || after === ',') {
                        return match;
                    }
                    return '\\"';
                });

            try {
                items = JSON.parse(fixedJson);
                console.log('JSON修复成功（方法1：转义修复）');
            } catch (secondError) {
                console.warn('方法1失败，尝试方法2...');

                // 方法2：提取JSON块
                try {
                    // 找到第一个 [ 和最后一个 ]
                    const startIdx = jsonMatch[0].indexOf('[');
                    const endIdx = jsonMatch[0].lastIndexOf(']');
                    if (startIdx !== -1 && endIdx !== -1) {
                        const cleanJson = jsonMatch[0].substring(startIdx, endIdx + 1)
                            .replace(/[\x00-\x1F\x7F]/g, ' '); // 移除控制字符
                        items = JSON.parse(cleanJson);
                        console.log('JSON修复成功（方法2：清理控制字符）');
                    } else {
                        throw secondError;
                    }
                } catch (thirdError) {
                    console.warn('方法2失败，尝试方法3...');

                    // 方法3：提取单个对象
                    const objectMatches = responseText.match(/\{\s*"freq"\s*:\s*"[^"]+"\s*,[\s\S]*?"content"\s*:\s*"[\s\S]*?"\s*\}/g);
                    if (objectMatches && objectMatches.length > 0) {
                        items = [];
                        for (const objStr of objectMatches) {
                            try {
                                const obj = JSON.parse(objStr.replace(/\n/g, '\\n'));
                                items.push(obj);
                            } catch (e) {
                                // 跳过解析失败的对象
                            }
                        }
                        if (items.length > 0) {
                            console.log(`JSON修复成功（方法3：提取 ${items.length} 个单独对象）`);
                        } else {
                            throw parseError;
                        }
                    } else {
                        console.error('所有JSON修复方法均失败');
                        return { items: [], analyzed: true, parseError: parseError.message };
                    }
                }
            }
        }


        // 验证每个item的结构 - 生成标准：700字符
        const validItems = items.filter(item => {
            return item.freq && item.stance && item.title &&
                item.author_name && item.content &&
                item.content.length >= 700;  // 生成时要求700字符，留缓冲给300验证标准
        });

        console.log(`分析完成: 识别到 ${validItems.length} 个有效观点`);

        return {
            items: validItems,
            analyzed: true,
            rawItemCount: items.length,
            validItemCount: validItems.length
        };
    } catch (error) {
        console.error('AI分析失败:', error.message);
        throw error;
    }
};

/**
 * 使用Claude分析元数据（无字幕时的fallback）
 * @param {Object} metadata - 视频元数据
 * @returns {Promise<Object>} 分析结果 {items: [], analyzed: boolean}
 */
const analyzeMetadata = async (metadata = {}) => {
    try {
        if (!CLAUDE_API_KEY) {
            throw new Error('Claude API key未配置');
        }

        if (!metadata.title || !metadata.description) {
            throw new Error('元数据不完整，无法分析');
        }

        const prompt = buildMetadataPrompt(metadata);

        console.log('调用Claude API进行元数据分析...');

        const message = await withRetry(
            () => withTimeout(
                anthropic.messages.create({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 4096,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                }),
                TIMEOUTS.CLAUDE_API,
                'Claude API 元数据分析请求超时'
            ),
            RETRY_CONFIGS.CLAUDE_API
        );

        const responseText = message.content[0].text;

        // 解析JSON响应（增强版：带错误恢复，与 analyzeTranscript 一致）
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn('Claude响应中未找到JSON数组');
            return { items: [], analyzed: true, rawResponse: responseText };
        }

        let items;
        try {
            items = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
            // 尝试修复常见JSON问题（三层修复协议）
            console.warn('元数据JSON解析失败，尝试修复...');
            console.warn('解析错误位置:', parseError.message);

            let fixedJson = jsonMatch[0]
                // 修复尾随逗号
                .replace(/,\s*]/g, ']')
                .replace(/,\s*}/g, '}')
                // 修复未转义的换行符在字符串中
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t');

            try {
                items = JSON.parse(fixedJson);
                console.log('元数据JSON修复成功（方法1：转义修复）');
            } catch (secondError) {
                console.warn('方法1失败，尝试方法2...');

                // 方法2：清理控制字符
                try {
                    const startIdx = jsonMatch[0].indexOf('[');
                    const endIdx = jsonMatch[0].lastIndexOf(']');
                    if (startIdx !== -1 && endIdx !== -1) {
                        const cleanJson = jsonMatch[0].substring(startIdx, endIdx + 1)
                            .replace(/[\x00-\x1F\x7F]/g, ' '); // 移除控制字符
                        items = JSON.parse(cleanJson);
                        console.log('元数据JSON修复成功（方法2：清理控制字符）');
                    } else {
                        throw secondError;
                    }
                } catch (thirdError) {
                    console.warn('方法2失败，尝试方法3...');

                    // 方法3：提取单个对象
                    const objectMatches = responseText.match(/\{\s*"freq"\s*:\s*"[^"]+"\s*,[\s\S]*?"content"\s*:\s*"[\s\S]*?"\s*\}/g);
                    if (objectMatches && objectMatches.length > 0) {
                        items = [];
                        for (const objStr of objectMatches) {
                            try {
                                const obj = JSON.parse(objStr.replace(/\n/g, '\\n'));
                                items.push(obj);
                            } catch (e) {
                                // 跳过解析失败的对象
                            }
                        }
                        if (items.length > 0) {
                            console.log(`元数据JSON修复成功（方法3：提取 ${items.length} 个单独对象）`);
                        } else {
                            console.error('所有JSON修复方法均失败');
                            return { items: [], analyzed: true, parseError: parseError.message };
                        }
                    } else {
                        console.error('所有JSON修复方法均失败');
                        return { items: [], analyzed: true, parseError: parseError.message };
                    }
                }
            }
        }

        // 验证每个item的结构 - 元数据模式要求较低：400字符
        const validItems = items.filter(item => {
            return item.freq && item.stance && item.title &&
                item.author_name && item.content &&
                item.content.length >= 400;  // 元数据模式400字符
        });

        console.log(`元数据分析完成: 识别到 ${validItems.length} 个有效观点`);

        return {
            items: validItems,
            analyzed: true,
            metadataMode: true,  // 标记这是元数据分析
            rawItemCount: items.length,
            validItemCount: validItems.length
        };
    } catch (error) {
        console.error('元数据AI分析失败:', error.message);
        throw error;
    }
};

/**
 * 生成符合radar_items结构的对象
 * @param {Object} viewpoint - Claude生成的观点
 * @param {Object} metadata - 原始元数据
 * @returns {Object} 雷达条目对象
 */
const generateRadarItem = (viewpoint, metadata = {}) => {
    const bandDef = BAND_DEFINITIONS[viewpoint.freq] || {};

    // 兼容新旧立场格式：yes/no 或 A/B
    let stance = viewpoint.stance;
    if (stance === 'A') stance = 'no';  // 旧格式 A 对应乐观/否定
    if (stance === 'B') stance = 'yes'; // 旧格式 B 对应悲观/肯定

    return {
        date: new Date().toISOString().split('T')[0],  // 今天的日期
        freq: viewpoint.freq,
        stance: stance,  // "yes" 或 "no"
        title: viewpoint.title,
        author_name: viewpoint.author_name,
        author_avatar: generateAvatar(viewpoint.author_name),
        author_bio: viewpoint.author_bio || '',
        source: viewpoint.source,
        content: viewpoint.content,
        // tension_q 使用 AI 生成的个性化问题，fallback 到频段核心问题
        tension_q: viewpoint.tension_q || bandDef.question || '',
        // tension_a/b 使用固定的是/否标签，便于统计汇总
        tension_a: bandDef.yesLabel || '是',
        tension_b: bandDef.noLabel || '否',
        keywords: viewpoint.keywords || []
    };
};

/**
 * 生成作者头像缩写
 * @param {string} name - 姓名
 * @returns {string} 2字符缩写
 */
const generateAvatar = (name) => {
    if (!name) return '??';

    // 中文名：取前两个字
    if (/[\u4e00-\u9fa5]/.test(name)) {
        return name.substring(0, 2);
    }

    // 英文名：取首字母
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
};

/**
 * 从视频创建草稿的完整流程
 * @param {string} videoId - YouTube视频ID
 * @param {number} sourceId - 内容源ID
 * @returns {Promise<Object>} 创建的草稿
 */
const createDraftFromVideo = async (videoId, sourceId) => {
    try {
        console.log(`开始处理视频 ${videoId}...`);

        // 1. 获取元数据
        const collector = require('./content-collector');
        const metadata = await collector.getVideoMetadata(videoId);

        console.log(`获取到视频: ${metadata.title}`);

        // 2. 尝试提取字幕（如果失败，使用元数据分析）
        let transcript = null;
        let useMetadataFallback = false;

        console.log('提取字幕...');
        try {
            transcript = await collector.getVideoTranscript(videoId);
            if (!transcript || transcript.length < 300) {
                console.log(`字幕内容太少 (${transcript ? transcript.length : 0} 字符)，切换到元数据分析`);
                useMetadataFallback = true;
            }
        } catch (transcriptError) {
            console.log(`字幕获取失败: ${transcriptError.message}，切换到元数据分析`);
            useMetadataFallback = true;
        }

        // 3. AI分析
        console.log('开始AI分析...');
        let analysis;

        if (useMetadataFallback) {
            // 使用元数据分析
            console.log('使用元数据分析模式（无字幕 fallback）');
            analysis = await analyzeMetadata(metadata);
        } else {
            console.log(`字幕长度: ${transcript.length} 字符`);
            analysis = await analyzeTranscript(transcript, metadata);
        }

        if (analysis.items.length === 0) {
            console.log('未识别到符合频段的观点');
        }

        // 4. 创建草稿记录
        const draftQuery = `
      INSERT INTO drafts (
        source_id, source_url, source_title, source_type,
        transcript, generated_items, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
      RETURNING *
    `;

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const generatedItems = analysis.items.map(item => generateRadarItem(item, metadata));

        const draftResult = await pool.query(draftQuery, [
            sourceId,
            videoUrl,
            metadata.title,
            'youtube',
            transcript,
            JSON.stringify(generatedItems)
        ]);

        const draft = draftResult.rows[0];

        // 5. 更新collection_log
        await pool.query(
            `UPDATE collection_log SET analyzed = true, draft_id = $1 WHERE video_id = $2`,
            [draft.id, videoId]
        );

        console.log(`✓ 草稿创建成功 (ID: ${draft.id}), 包含 ${generatedItems.length} 个观点`);

        return draft;
    } catch (error) {
        console.error('创建草稿失败:', error.message);
        throw error;
    }
};

/**
 * 分析 RSS 文章内容
 * @param {Object} article - 文章对象
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeRSSArticle(article) {
    const { title, content, source, url, targetFreq = 'T1' } = article;

    try {
        const response = await withRetry(
            async () => {
                return await withTimeout(
                    anthropic.messages.create({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 2000,
                        messages: [{
                            role: 'user',
                            content: `你是"思想雷达"的内容分析师。分析以下文章，生成符合要求的中文内容条目。

**文章标题**: ${title}
**来源**: ${source}
**原文URL**: ${url}
**目标频段**: ${targetFreq}

**文章内容**:
${content?.substring(0, 8000) || '(无正文)'}

**输出要求** (JSON格式):
{
    "title": "中文标题 (20-40字，体现核心张力)",
    "content": "中文正文 (500-800字，深度分析，避免泛泛而谈)",
    "tension_question": "核心张力问题 (一句话)",
    "tension_a": "立场A (3-5字)",
    "tension_b": "立场B (3-5字)",
    "tti": 思想张力指数(50-100),
    "freq": "${targetFreq}",
    "author_name": "文章作者/发言者真实姓名 (从正文或标题中提取，禁止使用来源名称如Google News)",
    "source": "发布场合信息 (格式：YYYY年M月D日 · 媒体名称/会议名称)"
}

**注意**:
1. author_name 必须是真实人名，不能是机构名或来源名
2. source 必须包含准确的日期和发布场合
3. 内容必须深度分析，不要简单总结
4. 张力问题必须是开放性辩论话题
5. 只输出JSON，不要其他文字`
                        }]
                    }),
                    TIMEOUTS.AI_ANALYSIS
                );
            },
            RETRY_CONFIGS.API_CALL
        );

        const text = response.content[0]?.text || '';
        const result = safeParseAiJson(text, { isArray: false });
        return result;
    } catch (error) {
        console.error('   ❌ RSS 分析失败:', error.message);
        return null;
    }
}

/**
 * 分析新闻文章 (Google News 热点)
 * @param {Object} article - 新闻对象
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeNewsArticle(article) {
    const { title, content, source, url, leader, targetFreq = 'T1' } = article;

    try {
        const response = await withRetry(
            async () => {
                return await withTimeout(
                    anthropic.messages.create({
                        model: 'claude-sonnet-4-20250514',
                        max_tokens: 2000,
                        messages: [{
                            role: 'user',
                            content: `你是"思想雷达"的热点分析师。分析以下关于 **${leader}** 的新闻热点。

**新闻标题**: ${title}
**来源**: ${source}
**关注人物**: ${leader}
**目标频段**: ${targetFreq}

**新闻摘要**:
${content?.substring(0, 4000) || title}

**输出要求** (JSON格式):
{
    "title": "中文标题 (包含${leader}的核心观点/行动)",
    "content": "中文正文 (400-600字，分析此热点的思想意义)",
    "tension_question": "此热点引发的核心辩论问题",
    "tension_a": "立场A (3-5字)",
    "tension_b": "立场B (3-5字)",
    "tti": 思想张力指数(60-100),
    "freq": "${targetFreq}",
    "author_name": "${leader}",
    "source": "发布场合信息 (格式：YYYY年M月D日 · 媒体名称/会议名称)"
}

**注意**:
1. author_name 优先使用 ${leader}，如有更具体人物则使用真实姓名
2. source 必须包含准确的日期和发布场合
3. 突出新闻的思想性意义
4. 只输出JSON`
                        }]
                    }),
                    TIMEOUTS.AI_ANALYSIS
                );
            },
            RETRY_CONFIGS.API_CALL
        );

        const text = response.content[0]?.text || '';
        return safeParseAiJson(text, { isArray: false });
    } catch (error) {
        console.error('   ❌ 热点分析失败:', error.message);
        return null;
    }
}

module.exports = {
    analyzeTranscript,
    analyzeMetadata,
    analyzeRSSArticle,
    analyzeNewsArticle,
    generateRadarItem,
    generateAvatar,
    createDraftFromVideo,
    BAND_DEFINITIONS
};
