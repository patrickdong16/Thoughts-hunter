// AI内容分析服务
// AI Analyzer Service  
// 使用Claude API分析内容并匹配频段系统

const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../config/database');

// Claude API配置 - 优先使用环境变量，fallback到配置文件
const getApiKey = (key) => {
    if (process.env[key]) return process.env[key];
    try {
        const config = require('../config/api-keys.json');
        return config[key];
    } catch (e) {
        return null;
    }
};
const CLAUDE_API_KEY = getApiKey('CLAUDE_API_KEY');

const anthropic = new Anthropic({
    apiKey: CLAUDE_API_KEY
});

// 频段定义系统
const BAND_DEFINITIONS = {
    T1: { question: "AI是否正在重写社会分层结构?", stanceA: "普惠化", stanceB: "精英化" },
    T2: { question: "技术是在嵌入制度还是绕开制度?", stanceA: "可被吸收", stanceB: "天然反制度" },
    T3: { question: "技术是否已脱离人类集体意志?", stanceA: "可被引导", stanceB: "竞争宿命" },
    P1: { question: "民主是否已不适应高复杂度社会?", stanceA: "不可替代", stanceB: "技术官僚更现实" },
    P2: { question: "权力是否正在脱离公共可见性?", stanceA: "可拉回", stanceB: "后政治治理" },
    Φ1: { question: "自由与秩序是否天然冲突?", stanceA: "秩序优先", stanceB: "自由不可牺牲" },
    Φ3: { question: "自由是否正在被系统性理性替代?", stanceA: "仍是自由", stanceB: "优化即控制" },
    H1: { question: "文明是否正在进入倒退阶段?", stanceA: "周期回撤", stanceB: "长期退化" },
    H2: { question: "社会崩溃前的共性征兆是什么?", stanceA: "可识别", stanceB: "只能事后理解" },
    R2: { question: "技术是否正在形成伪宗教?", stanceA: "只是工具", stanceB: "承担信仰功能" },
    F2: { question: "金融是否正在放大社会撕裂?", stanceA: "可自我修正", stanceB: "侵蚀社会基础" }
};

/**
 * 构建分析提示词
 * @param {string} transcript - 转录文本
 * @param {Object} metadata - 视频元数据
 * @returns {string} 完整提示词
 */
const buildAnalysisPrompt = (transcript, metadata) => {
    const bandList = Object.entries(BAND_DEFINITIONS)
        .map(([id, def]) => `${id}: ${def.question} (A:${def.stanceA} vs B:${def.stanceB})`)
        .join('\n');

    return `你是「思想雷达」(Thoughts Radar)的内容分析师。请分析以下访谈/演讲转录，提取符合我们频段系统的观点。

**频段系统**
${bandList}

**转录内容**
${transcript.substring(0, 8000)}  // 限制长度避免超token

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
    "stance": "A",
    "title": "简明标题（20字内，鲜明表达立场）",
    "author_name": "发言者姓名",
    "author_bio": "身份简介（如\"MIT经济学教授\"）",
    "source": "准确的来源信息（格式：YYYY年M月D日 · 平台/出版物 · 具体栏目或视频标题）",
    "content": "500字以上的论述，必须包含：\n1. 核心观点陈述\n2. 主要论据（引用原文）\n3. 社会影响分析\n分段论证，引用具体例子",
    "tension_q": "${metadata.title}中讨论的核心问题",
    "tension_a": "A极立场描述",
    "tension_b": "B极立场描述",
    "keywords": ["关键词1", "关键词2", "关键词3"]
  }
]
\`\`\`

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
4. stance必须明确为A或B
5. 每个观点对应一个频段，不要重复
6. 关键词3-5个，反映核心概念

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

        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const responseText = message.content[0].text;

        // 解析JSON响应
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            console.warn('Claude响应中未找到JSON数组');
            return { items: [], analyzed: true, rawResponse: responseText };
        }

        const items = JSON.parse(jsonMatch[0]);

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
 * 生成符合radar_items结构的对象
 * @param {Object} viewpoint - Claude生成的观点
 * @param {Object} metadata - 原始元数据
 * @returns {Object} 雷达条目对象
 */
const generateRadarItem = (viewpoint, metadata = {}) => {
    return {
        date: new Date().toISOString().split('T')[0],  // 今天的日期
        freq: viewpoint.freq,
        stance: viewpoint.stance,
        title: viewpoint.title,
        author_name: viewpoint.author_name,
        author_avatar: generateAvatar(viewpoint.author_name),
        author_bio: viewpoint.author_bio || '',
        source: viewpoint.source,
        content: viewpoint.content,
        tension_q: viewpoint.tension_q || BAND_DEFINITIONS[viewpoint.freq]?.question || '',
        tension_a: viewpoint.tension_a || BAND_DEFINITIONS[viewpoint.freq]?.stanceA || '',
        tension_b: viewpoint.tension_b || BAND_DEFINITIONS[viewpoint.freq]?.stanceB || '',
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

        // 2. 提取字幕
        console.log('提取字幕...');
        const transcript = await collector.getVideoTranscript(videoId);

        if (!transcript || transcript.length < 300) {
            throw new Error('字幕内容太少或无字幕');
        }

        console.log(`字幕长度: ${transcript.length} 字符`);

        // 3. AI分析
        console.log('开始AI分析...');
        const analysis = await analyzeTranscript(transcript, metadata);

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

module.exports = {
    analyzeTranscript,
    generateRadarItem,
    createDraftFromVideo,
    BAND_DEFINITIONS
};
