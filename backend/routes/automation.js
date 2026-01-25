/**
 * 自动内容生成路由
 * Auto Content Generation Routes
 * 
 * 用于每日定时任务自动筛选、分析和发布内容
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const automationConfig = require('../config/automation');
const aiAnalyzer = require('../services/ai-analyzer');
const contentCollector = require('../services/content-collector');
const contentValidator = require('../services/content-validator');
const { getRulesForDate } = require('../config/day-rules');

/**
 * 解析 ISO 8601 时长字符串为分钟数
 * @param {string} duration - 如 "PT1H23M45S"
 * @returns {number} 分钟数
 */
function parseDuration(duration) {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    const seconds = parseInt(match[3] || 0);
    return hours * 60 + minutes + (seconds >= 30 ? 1 : 0);
}

/**
 * 检查视频是否符合筛选规则
 * @param {Object} video - 视频信息
 * @param {Object} dayRules - 当日规则（从day-config.json加载）
 * @returns {Object} { eligible: boolean, reason: string }
 */
function checkVideoEligibility(video, dayRules = null) {
    const { videoFilters, targetChannels, targetSpeakers, topicKeywords } = automationConfig;
    const textToCheck = `${video.title || ''} ${video.description || ''} ${video.channelTitle || ''}`.toLowerCase();

    // 1. 检查时长 - 从配置中读取minDuration（主题日/普通日各自有配置）
    const minDuration = dayRules?.rules?.minDuration || videoFilters.minDuration;
    const isThemeDay = dayRules?.isThemeDay || false;
    const durationMinutes = parseDuration(video.duration);
    if (durationMinutes < minDuration) {
        return { eligible: false, reason: `时长 ${durationMinutes}分钟 < ${minDuration}分钟${isThemeDay ? '(主题日)' : ''}` };
    }

    // 2. 检查发布时间
    if (video.publishedAt) {
        const publishDate = new Date(video.publishedAt);
        const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublish > videoFilters.maxAgeInDays) {
            return { eligible: false, reason: `发布于 ${Math.floor(daysSincePublish)} 天前，超过 ${videoFilters.maxAgeInDays} 天` };
        }
    }

    // 主题日：只检查时长，跳过频道/关键词匹配（主题日通常是特定活动如达沃斯）
    if (isThemeDay) {
        return { eligible: true, reason: '主题日：通过时长筛选即符合条件' };
    }

    // 3. 强制要求：必须匹配目标频道或目标访谈人
    if (videoFilters.requireTargetMatch) {
        const matchesChannel = targetChannels.some(c =>
            textToCheck.includes(c.name.toLowerCase()) ||
            (video.channelTitle && video.channelTitle.toLowerCase().includes(c.name.toLowerCase()))
        );

        const matchesSpeaker = targetSpeakers.some(s =>
            textToCheck.includes(s.name.toLowerCase())
        );

        if (!matchesChannel && !matchesSpeaker) {
            return { eligible: false, reason: '不在目标频道或访谈人范围内' };
        }
    }

    // 4. 检查议题关键词（标题或描述至少包含一个）
    const allKeywords = Object.values(topicKeywords).flat();
    const hasRelevantTopic = allKeywords.some(keyword =>
        textToCheck.includes(keyword.toLowerCase())
    );

    if (!hasRelevantTopic) {
        return { eligible: false, reason: '标题和描述中未发现相关议题关键词' };
    }

    return { eligible: true, reason: '符合所有筛选条件' };
}

/**
 * 计算视频优先级分数
 * @param {Object} video - 视频信息
 * @returns {number} 优先级分数 (越高越优先)
 */
function calculatePriority(video) {
    let score = 0;
    const { targetChannels, targetSpeakers, topicKeywords } = automationConfig;
    const textToCheck = `${video.title || ''} ${video.description || ''}`.toLowerCase();

    // 频道匹配加分
    const channel = targetChannels.find(c =>
        textToCheck.includes(c.name.toLowerCase()) ||
        (video.channelTitle && video.channelTitle.toLowerCase().includes(c.name.toLowerCase()))
    );
    if (channel) {
        score += channel.priority * 10;
    }

    // 访谈人匹配加分
    targetSpeakers.forEach(speaker => {
        if (textToCheck.includes(speaker.name.toLowerCase())) {
            score += speaker.priority * 5;
        }
    });

    // 时长加分（更长的访谈通常更深入）
    const duration = parseDuration(video.duration);
    if (duration >= 120) score += 20;
    else if (duration >= 90) score += 15;
    else if (duration >= 60) score += 10;

    return score;
}

/**
 * POST /api/automation/add-video
 * 手动添加视频到采集队列
 */
router.post('/add-video', async (req, res) => {
    try {
        const { videoId, title, channelTitle, duration, publishedAt } = req.body;

        if (!videoId) {
            return res.status(400).json({ success: false, error: 'videoId is required' });
        }

        // 检查是否已存在
        const existing = await pool.query(
            'SELECT id, analyzed FROM collection_log WHERE video_id = $1',
            [videoId]
        );

        if (existing.rows.length > 0) {
            // 重置分析状态
            await pool.query(
                'UPDATE collection_log SET analyzed = false WHERE video_id = $1',
                [videoId]
            );
            return res.json({ success: true, action: 'reset', message: '视频已重置为待分析状态' });
        }

        // 插入新记录
        await pool.query(`
            INSERT INTO collection_log (source_id, video_id, video_title, duration, published_at, analyzed)
            VALUES (1, $1, $2, $3, $4, false)
        `, [videoId, title || 'Unknown', duration || 'PT0S', publishedAt || new Date().toISOString()]);

        res.json({ success: true, action: 'added', message: '视频已添加到采集队列' });
    } catch (error) {
        console.error('Add video error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/automation/reset-all
 * 重置所有视频为待分析状态
 */
router.post('/reset-all', async (req, res) => {
    try {
        const result = await pool.query('UPDATE collection_log SET analyzed = false');
        res.json({ success: true, message: `已重置 ${result.rowCount} 个视频为待分析状态` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/automation/generate-daily
 * 自动生成每日内容
 * 
 * 流程：
 * 1. 从 collection_log 获取未分析的视频
 * 2. 根据规则筛选符合条件的视频
 * 3. 按优先级排序，选取前N个
 * 4. 调用 AI 分析生成内容
 * 5. 直接发布到 radar_items (或进入草稿审核)
 */
router.post('/generate-daily', async (req, res) => {
    const startTime = Date.now();
    const results = {
        scanned: 0,
        eligible: 0,
        analyzed: 0,
        published: 0,
        errors: [],
        items: []
    };

    try {
        console.log('🚀 开始每日自动内容生成...');

        // 获取今日日期和规则配置
        const beijingDate = new Date().toLocaleDateString('en-CA', {
            timeZone: 'Asia/Shanghai'
        });
        const dayRules = getRulesForDate(beijingDate);

        if (dayRules.isThemeDay) {
            console.log(`📅 主题日: ${dayRules.event} (时长要求: ≥${dayRules.rules.minDuration}分钟)`);
        }

        // 1. 获取未分析的视频
        const { rows: pendingVideos } = await pool.query(`
            SELECT cl.*, cs.name as source_name, cs.default_domain
            FROM collection_log cl
            LEFT JOIN content_sources cs ON cl.source_id = cs.id
            WHERE cl.analyzed = false
            ORDER BY cl.checked_at DESC
            LIMIT 50
        `);

        results.scanned = pendingVideos.length;
        console.log(`📥 找到 ${pendingVideos.length} 个待处理视频`);

        if (pendingVideos.length === 0) {
            return res.json({
                success: true,
                message: '没有待处理的视频',
                results
            });
        }

        // 2. 筛选符合条件的视频（从dayRules读取时长要求）
        const eligibleVideos = [];
        for (const video of pendingVideos) {
            const check = checkVideoEligibility(video, dayRules);
            if (check.eligible) {
                eligibleVideos.push({
                    ...video,
                    priority: calculatePriority(video)
                });
            } else {
                console.log(`⏭️ 跳过视频 "${video.title?.substring(0, 30)}...": ${check.reason}`);
                // 标记为已处理但不符合条件
                await pool.query(
                    `UPDATE collection_log SET analyzed = true WHERE video_id = $1`,
                    [video.video_id]
                );
            }
        }

        results.eligible = eligibleVideos.length;
        console.log(`✅ ${eligibleVideos.length} 个视频符合筛选条件`);

        if (eligibleVideos.length === 0) {
            return res.json({
                success: true,
                message: '没有符合条件的视频',
                results
            });
        }

        // 3. 按优先级排序，限制分析数量（成本控制：最多5个视频）
        const { dailyQuota, aiAnalysis } = automationConfig;
        eligibleVideos.sort((a, b) => b.priority - a.priority);
        const maxToAnalyze = dailyQuota.maxVideosToAnalyze || 5;
        const toAnalyze = eligibleVideos.slice(0, maxToAnalyze);

        console.log(`📊 将分析前 ${toAnalyze.length} 个视频（成本控制上限: ${maxToAnalyze}）`);

        // 4. 分析并生成内容
        for (const video of toAnalyze) {
            try {
                console.log(`🔍 分析: "${video.title?.substring(0, 40)}..."`);

                // 创建草稿（调用 AI 分析）
                const draft = await aiAnalyzer.createDraftFromVideo(
                    video.video_id,
                    video.source_id
                );

                results.analyzed++;

                // 解析生成的内容
                const generatedItems = typeof draft.generated_items === 'string'
                    ? JSON.parse(draft.generated_items)
                    : draft.generated_items;

                if (!generatedItems || generatedItems.length === 0) {
                    console.log('⚠️ 未生成有效内容');
                    continue;
                }

                // 5. 自动发布（如果配置允许）
                if (aiAnalysis.autoPublish && !aiAnalysis.requireReview) {
                    // 获取北京时间今天日期
                    const beijingDate = new Date().toLocaleDateString('en-CA', {
                        timeZone: 'Asia/Shanghai'
                    });

                    for (const item of generatedItems.slice(0, 1)) { // 每个视频最多发布1条
                        try {
                            const insertResult = await pool.query(`
                                INSERT INTO radar_items (
                                    date, freq, stance, title, 
                                    author_name, author_avatar, author_bio,
                                    source, content, 
                                    tension_q, tension_a, tension_b, keywords
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                                ON CONFLICT (date, freq) DO UPDATE SET
                                    stance = EXCLUDED.stance,
                                    title = EXCLUDED.title,
                                    author_name = EXCLUDED.author_name,
                                    author_avatar = EXCLUDED.author_avatar,
                                    author_bio = EXCLUDED.author_bio,
                                    source = EXCLUDED.source,
                                    content = EXCLUDED.content,
                                    tension_q = EXCLUDED.tension_q,
                                    tension_a = EXCLUDED.tension_a,
                                    tension_b = EXCLUDED.tension_b,
                                    keywords = EXCLUDED.keywords
                                RETURNING *
                            `, [
                                beijingDate,
                                item.freq,
                                item.stance,
                                item.title,
                                item.author_name,
                                item.author_avatar || item.author_name?.substring(0, 2) || '??',
                                item.author_bio || '',
                                item.source,
                                item.content,
                                item.tension_q || '',
                                item.tension_a || '',
                                item.tension_b || '',
                                item.keywords || []
                            ]);

                            results.published++;
                            results.items.push({
                                id: insertResult.rows[0].id,
                                freq: item.freq,
                                title: item.title
                            });

                            console.log(`✅ 已发布: [${item.freq}] ${item.title?.substring(0, 30)}...`);
                        } catch (insertError) {
                            results.errors.push(`发布失败 [${item.freq}]: ${insertError.message}`);
                        }
                    }

                    // 更新草稿状态
                    await pool.query(
                        `UPDATE drafts SET status = 'approved' WHERE id = $1`,
                        [draft.id]
                    );
                }

            } catch (analyzeError) {
                console.error(`❌ 分析失败: ${analyzeError.message}`);
                results.errors.push(`分析失败 "${video.title?.substring(0, 20)}": ${analyzeError.message}`);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n🏁 完成! 扫描:${results.scanned} 符合:${results.eligible} 分析:${results.analyzed} 发布:${results.published} (${duration}s)`);

        res.json({
            success: true,
            message: `自动生成完成: 发布 ${results.published} 条内容`,
            duration: `${duration}s`,
            results
        });

    } catch (error) {
        console.error('❌ 自动生成失败:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            results
        });
    }
});

/**
 * GET /api/automation/config
 * 获取当前自动化配置
 */
router.get('/config', (req, res) => {
    res.json({
        success: true,
        config: automationConfig
    });
});

/**
 * GET /api/automation/status
 * 获取今日自动化状态
 */
router.get('/status', async (req, res) => {
    try {
        const beijingDate = new Date().toLocaleDateString('en-CA', {
            timeZone: 'Asia/Shanghai'
        });

        // 今日发布数量
        const { rows: todayItems } = await pool.query(
            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
            [beijingDate]
        );

        // 待处理视频
        const { rows: pendingVideos } = await pool.query(
            `SELECT COUNT(*) as count FROM collection_log WHERE analyzed = false`
        );

        // 今日草稿
        const { rows: todayDrafts } = await pool.query(
            `SELECT COUNT(*) as count FROM drafts WHERE DATE(created_at) = $1`,
            [beijingDate]
        );

        res.json({
            success: true,
            date: beijingDate,
            status: {
                todayItemCount: parseInt(todayItems[0].count),
                pendingVideos: parseInt(pendingVideos[0].count),
                todayDrafts: parseInt(todayDrafts[0].count),
                quota: automationConfig.dailyQuota
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/automation/batch-publish
 * 批量发布已批准但未实际发布的草稿
 * Emergency endpoint to publish approved drafts that may have been missed
 */
router.post('/batch-publish', async (req, res) => {
    const { sourceFilter, limit = 20 } = req.body;
    const results = {
        processed: 0,
        published: 0,
        skipped: 0,
        errors: []
    };

    try {
        const beijingDate = new Date().toLocaleDateString('en-CA', {
            timeZone: 'Asia/Shanghai'
        });

        console.log(`🚀 批量发布草稿内容 (日期: ${beijingDate})`);

        // 获取现有频段
        const { rows: existingFreqs } = await pool.query(
            `SELECT freq FROM radar_items WHERE date = $1`,
            [beijingDate]
        );
        const usedFreqs = new Set(existingFreqs.map(r => r.freq));
        console.log(`📊 已存在频段: ${[...usedFreqs].join(', ') || '无'}`);

        // maxItems 检查 - 避免超过每日配额
        const { rows: currentCount } = await pool.query(
            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
            [beijingDate]
        );
        const todayCount = parseInt(currentCount[0].count);
        const dayRulesForToday = getRulesForDate(beijingDate);
        const maxItems = dayRulesForToday.rules?.maxItems || 8;

        if (todayCount >= maxItems) {
            return res.json({
                success: true,
                date: beijingDate,
                message: `已达到当日配额 (${todayCount}/${maxItems} 条)，无需批量发布`,
                totalToday: todayCount,
                results
            });
        }
        console.log(`📊 当前${todayCount}条，配额${maxItems}条，可发布${maxItems - todayCount}条`);

        // 获取已批准但未实际发布的草稿
        let query = `
            SELECT d.*, cs.name as source_name
            FROM drafts d
            LEFT JOIN content_sources cs ON d.source_id = cs.id
            WHERE d.status = 'approved'
            AND d.generated_items IS NOT NULL
            AND jsonb_array_length(d.generated_items) > 0
        `;
        const params = [];

        if (sourceFilter) {
            query += ` AND cs.name ILIKE $1`;
            params.push(`%${sourceFilter}%`);
        }

        query += ` ORDER BY d.created_at DESC LIMIT ${parseInt(limit)}`;

        const { rows: drafts } = await pool.query(query, params);
        console.log(`📝 找到 ${drafts.length} 个待发布草稿`);

        for (const draft of drafts) {
            results.processed++;
            let items = draft.generated_items;
            if (typeof items === 'string') {
                items = JSON.parse(items);
            }

            if (!items || items.length === 0) continue;

            for (const item of items) {
                // 质量验证 - 发布前必须通过
                const validation = contentValidator.validateItem(item);
                if (validation.blocked) {
                    console.log(`❌ 质量验证失败 [${item.freq}] ${item.title?.substring(0, 20)}...`);
                    validation.errors.forEach(e => console.log(`   - ${e.description}: ${e.message}`));
                    results.skipped++;
                    continue;
                }

                // 防止重复: 检查同日期+标题是否已存在
                const itemDate = item.date || beijingDate;
                const { rows: existingItem } = await pool.query(
                    `SELECT id FROM radar_items WHERE date = $1 AND title = $2`,
                    [itemDate, item.title]
                );
                if (existingItem.length > 0) {
                    console.log(`⏭️ 跳过重复: [${item.freq}] ${item.title?.substring(0, 25)}...`);
                    results.skipped++;
                    continue;
                }

                // maxPerFreq 检查 (普通日每频段限1条)
                const dayRules = getRulesForDate(itemDate);
                if (!dayRules.isThemeDay) {
                    const maxPerFreq = dayRules.rules?.maxPerFreq || 1;
                    const { rows: freqCount } = await pool.query(
                        `SELECT COUNT(*) as count FROM radar_items WHERE date = $1 AND freq = $2`,
                        [itemDate, item.freq]
                    );
                    if (parseInt(freqCount[0].count) >= maxPerFreq) {
                        console.log(`⏭️ 跳过频段已满: [${item.freq}] 已有${freqCount[0].count}条`);
                        results.skipped++;
                        continue;
                    }
                }

                try {
                    const insertResult = await pool.query(`
                        INSERT INTO radar_items (
                            date, freq, stance, title, 
                            author_name, author_avatar, author_bio,
                            source, content, 
                            tension_q, tension_a, tension_b, keywords
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        RETURNING id, freq, title
                    `, [
                        item.date || beijingDate,
                        item.freq,
                        item.stance || 'A',
                        item.title,
                        item.author_name,
                        item.author_avatar || item.author_name?.substring(0, 2) || 'XX',
                        item.author_bio || '',
                        item.source || '',
                        item.content,
                        item.tension_q || '',
                        item.tension_a || '',
                        item.tension_b || '',
                        item.keywords || []
                    ]);

                    if (insertResult.rows.length > 0) {
                        const inserted = insertResult.rows[0];
                        console.log(`✅ 发布: [${inserted.freq}] ${inserted.title?.substring(0, 30)}...`);
                        usedFreqs.add(item.freq);
                        results.published++;
                    }
                } catch (insertError) {
                    results.errors.push(`[${item.freq}]: ${insertError.message}`);
                }
            }

            // 更新草稿的reviewed_at
            await pool.query(
                `UPDATE drafts SET reviewed_at = CURRENT_TIMESTAMP, reviewed_by = 'batch_publish' WHERE id = $1`,
                [draft.id]
            );
        }

        // 获取最终统计
        const { rows: finalCount } = await pool.query(
            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
            [beijingDate]
        );

        console.log(`\n🏁 完成! 处理:${results.processed} 发布:${results.published} 跳过:${results.skipped}`);

        res.json({
            success: true,
            date: beijingDate,
            message: `批量发布完成: 新增 ${results.published} 条内容`,
            totalToday: parseInt(finalCount[0].count),
            results
        });

    } catch (error) {
        console.error('❌ 批量发布失败:', error);
        res.status(500).json({ success: false, error: error.message, results });
    }
});

/**
 * POST /api/automation/smart-generate
 * 智能内容生成（成本优化版）
 * 
 * 策略：
 * 1. 计算当日缺口
 * 2. 预筛选视频队列
 * 3. 按需逐条分析（每次只调1次Claude）
 * 4. 质量验证循环（失败则尝试下一个）
 */
router.post('/smart-generate', async (req, res) => {
    const { maxRetries = 5, dryRun = false } = req.body;
    const startTime = Date.now();

    const results = {
        targetGap: 0,
        preFiltered: 0,
        apiCalls: 0,
        published: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        items: []
    };

    try {
        // 获取今日日期和规则
        const beijingDate = new Date().toLocaleDateString('en-CA', {
            timeZone: 'Asia/Shanghai'
        });
        const dayRules = getRulesForDate(beijingDate);

        console.log('🧠 智能内容生成启动...');
        console.log(`📅 日期: ${beijingDate} | 主题日: ${dayRules.isThemeDay ? '是' : '否'}`);

        // 1. 计算当日缺口
        const { rows: todayCount } = await pool.query(
            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
            [beijingDate]
        );
        const currentCount = parseInt(todayCount[0].count);
        const minItems = dayRules.rules?.minItems || automationConfig.dailyQuota.minTotal;
        const targetGap = Math.max(0, minItems - currentCount);
        results.targetGap = targetGap;

        console.log(`📊 当前: ${currentCount} 条 | 目标: ${minItems} 条 | 缺口: ${targetGap} 条`);

        if (targetGap === 0) {
            return res.json({
                success: true,
                message: '已达到当日配额，无需生成',
                date: beijingDate,
                currentCount,
                results
            });
        }

        // 2. 获取已占用的频段
        const { rows: existingFreqs } = await pool.query(
            `SELECT freq FROM radar_items WHERE date = $1`,
            [beijingDate]
        );
        const usedFreqs = new Set(existingFreqs.map(r => r.freq));

        // 3. 预筛选视频队列（未分析 + 时长符合）
        const minDuration = dayRules.rules?.minDuration || 40;
        const { rows: candidateVideos } = await pool.query(`
            SELECT cl.*, cs.name as source_name, cs.default_domain
            FROM collection_log cl
            LEFT JOIN content_sources cs ON cl.source_id = cs.id
            WHERE cl.analyzed = false
            ORDER BY cl.checked_at DESC
            LIMIT 100
        `);

        // 应用预筛选规则
        const preFilteredVideos = candidateVideos.filter(video => {
            const durationMinutes = parseDuration(video.duration);
            if (durationMinutes < minDuration) {
                console.log(`⏭️ 预筛选跳过 "${video.video_title?.substring(0, 25)}...": 时长${durationMinutes}m < ${minDuration}m`);
                return false;
            }
            return true;
        });

        results.preFiltered = preFilteredVideos.length;
        console.log(`🔍 预筛选通过: ${preFilteredVideos.length}/${candidateVideos.length} 个视频`);

        if (preFilteredVideos.length === 0) {
            return res.json({
                success: true,
                message: '预筛选后无符合条件的视频',
                date: beijingDate,
                results
            });
        }

        // 4. 按优先级排序
        preFilteredVideos.sort((a, b) => calculatePriority(b) - calculatePriority(a));

        // 5. 按需逐条分析（智能循环）
        let publishedThisRun = 0;
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = maxRetries;
        const maxApiCalls = automationConfig.dailyQuota.maxVideosToAnalyze || 30;

        for (const video of preFilteredVideos) {
            // 检查是否达到目标或超过API限制
            if (publishedThisRun >= targetGap) {
                console.log(`✅ 已达到目标缺口 (${publishedThisRun}/${targetGap})`);
                break;
            }

            if (results.apiCalls >= maxApiCalls) {
                console.log(`⚠️ 达到API调用上限 (${maxApiCalls})`);
                break;
            }

            if (consecutiveFailures >= maxConsecutiveFailures) {
                console.log(`⚠️ 连续失败 ${consecutiveFailures} 次，暂停分析`);
                results.errors.push(`连续失败${consecutiveFailures}次，自动暂停`);
                break;
            }

            // Dry run模式：只记录不执行
            if (dryRun) {
                console.log(`[DRY RUN] 将分析: "${video.video_title?.substring(0, 40)}..."`);
                results.skipped++;
                continue;
            }

            try {
                console.log(`\n🔍 分析 [${results.apiCalls + 1}]: "${video.video_title?.substring(0, 40)}..."`);
                results.apiCalls++;

                // 调用AI分析
                const draft = await aiAnalyzer.createDraftFromVideo(
                    video.video_id,
                    video.source_id
                );

                // 解析生成的内容
                const generatedItems = typeof draft.generated_items === 'string'
                    ? JSON.parse(draft.generated_items)
                    : draft.generated_items;

                if (!generatedItems || generatedItems.length === 0) {
                    console.log('⚠️ 未生成有效内容');
                    consecutiveFailures++;
                    results.failed++;
                    continue;
                }

                // 质量验证 + 频段冲突检查
                let publishedFromThisVideo = 0;
                for (const item of generatedItems) {
                    // 质量检查：内容长度
                    if (!item.content || item.content.length < 300) {
                        console.log(`❌ 质量不达标 [${item.freq}]: 内容仅${item.content?.length || 0}字符`);
                        continue;
                    }

                    // 防止重复: 检查同日期+标题是否已存在
                    const itemDate = item.date || beijingDate;
                    const { rows: existingItem } = await pool.query(
                        `SELECT id FROM radar_items WHERE date = $1 AND title = $2`,
                        [itemDate, item.title]
                    );
                    if (existingItem.length > 0) {
                        console.log(`⏭️ 跳过重复标题: [${item.freq}] ${item.title?.substring(0, 25)}...`);
                        continue;
                    }

                    // maxPerFreq 检查 (普通日每频段限1条)
                    if (!dayRules.isThemeDay) {
                        const maxPerFreq = dayRules.rules?.maxPerFreq || 1;
                        const { rows: freqCount } = await pool.query(
                            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1 AND freq = $2`,
                            [itemDate, item.freq]
                        );
                        if (parseInt(freqCount[0].count) >= maxPerFreq) {
                            console.log(`⏭️ 跳过频段已满: [${item.freq}] 已有${freqCount[0].count}条 (限${maxPerFreq}条)`);
                            continue;
                        }
                    }

                    // 发布到 radar_items
                    try {
                        const insertResult = await pool.query(`
                            INSERT INTO radar_items (
                                date, freq, stance, title, 
                                author_name, author_avatar, author_bio,
                                source, content, 
                                tension_q, tension_a, tension_b, keywords
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                            RETURNING id, freq, title
                        `, [
                            item.date || beijingDate,
                            item.freq,
                            item.stance || 'A',
                            item.title,
                            item.author_name,
                            item.author_avatar || item.author_name?.substring(0, 2) || 'XX',
                            item.author_bio || '',
                            item.source || '',
                            item.content,
                            item.tension_q || '',
                            item.tension_a || '',
                            item.tension_b || '',
                            item.keywords || []
                        ]);

                        if (insertResult.rows.length > 0) {
                            const inserted = insertResult.rows[0];
                            console.log(`✅ 发布成功: [${inserted.freq}] ${inserted.title?.substring(0, 30)}...`);
                            usedFreqs.add(item.freq);
                            publishedFromThisVideo++;
                            publishedThisRun++;
                            results.published++;
                            results.items.push({
                                id: inserted.id,
                                freq: inserted.freq,
                                title: inserted.title
                            });

                            // 每个视频最多发布1条（避免单视频垄断）
                            if (publishedFromThisVideo >= 1) break;
                        }
                    } catch (insertError) {
                        results.errors.push(`发布失败 [${item.freq}]: ${insertError.message}`);
                    }
                }

                // 更新草稿状态
                await pool.query(
                    `UPDATE drafts SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = 'smart_generate' WHERE id = $1`,
                    [draft.id]
                );

                // 重置连续失败计数
                if (publishedFromThisVideo > 0) {
                    consecutiveFailures = 0;
                } else {
                    consecutiveFailures++;
                    results.failed++;
                }

            } catch (analyzeError) {
                console.error(`❌ 分析失败: ${analyzeError.message}`);
                results.errors.push(`分析失败 "${video.video_title?.substring(0, 20)}": ${analyzeError.message}`);
                consecutiveFailures++;
                results.failed++;

                // 标记视频为已分析（避免重复尝试）
                await pool.query(
                    `UPDATE collection_log SET analyzed = true WHERE video_id = $1`,
                    [video.video_id]
                );
            }
        }

        // 获取最终统计
        const { rows: finalCount } = await pool.query(
            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
            [beijingDate]
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n🏁 智能生成完成!`);
        console.log(`   API调用: ${results.apiCalls} | 发布: ${results.published} | 失败: ${results.failed}`);
        console.log(`   总耗时: ${duration}s`);

        res.json({
            success: true,
            date: beijingDate,
            message: `智能生成完成: 新增 ${results.published} 条内容`,
            totalToday: parseInt(finalCount[0].count),
            duration: `${duration}s`,
            costEfficiency: results.apiCalls > 0 ? `${((results.published / results.apiCalls) * 100).toFixed(0)}%` : 'N/A',
            results
        });

    } catch (error) {
        console.error('❌ 智能生成失败:', error);
        res.status(500).json({ success: false, error: error.message, results });
    }
});

/**
 * POST /api/automation/validate-draft/:id
 * 验证单个草稿内容是否符合质量规则
 */
router.post('/validate-draft/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { rows } = await pool.query(
            `SELECT * FROM drafts WHERE id = $1`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: '草稿不存在' });
        }

        const draft = rows[0];
        let items = draft.generated_items;
        if (typeof items === 'string') {
            items = JSON.parse(items);
        }

        if (!items || items.length === 0) {
            return res.json({
                success: true,
                draftId: id,
                validation: {
                    passed: false,
                    reason: '草稿无生成内容'
                }
            });
        }

        const batchResult = contentValidator.validateBatch(items);

        res.json({
            success: true,
            draftId: id,
            validation: batchResult
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/automation/validate-batch
 * 批量验证草稿
 */
router.post('/validate-batch', async (req, res) => {
    const { status = 'approved', limit = 50 } = req.body;

    try {
        const { rows: drafts } = await pool.query(`
            SELECT d.*, cs.name as source_name
            FROM drafts d
            LEFT JOIN content_sources cs ON d.source_id = cs.id
            WHERE d.status = $1
            AND d.generated_items IS NOT NULL
            AND jsonb_array_length(d.generated_items) > 0
            ORDER BY d.created_at DESC
            LIMIT $2
        `, [status, limit]);

        const results = {
            total: drafts.length,
            passed: 0,
            blocked: 0,
            warned: 0,
            drafts: []
        };

        for (const draft of drafts) {
            let items = draft.generated_items;
            if (typeof items === 'string') {
                items = JSON.parse(items);
            }

            const validation = contentValidator.validateBatch(items);

            results.drafts.push({
                id: draft.id,
                source: draft.source_name,
                itemCount: items.length,
                validation: {
                    passed: validation.passed,
                    blocked: validation.blocked,
                    warned: validation.warned
                }
            });

            if (validation.blocked > 0) {
                results.blocked++;
            } else if (validation.warned > 0) {
                results.warned++;
            } else {
                results.passed++;
            }
        }

        res.json({ success: true, results });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/automation/validation-report
 * 获取今日内容验证报告
 */
router.get('/validation-report', async (req, res) => {
    try {
        const beijingDate = new Date().toLocaleDateString('en-CA', {
            timeZone: 'Asia/Shanghai'
        });

        const { rows: items } = await pool.query(`
            SELECT * FROM radar_items WHERE date = $1
        `, [beijingDate]);

        // 验证所有已发布内容
        const validation = contentValidator.validateBatch(items);

        // 统计违规模式
        const violationStats = {};
        for (const item of validation.items) {
            for (const err of item.errors) {
                const key = err.check;
                violationStats[key] = (violationStats[key] || 0) + 1;
            }
        }

        res.json({
            success: true,
            date: beijingDate,
            totalItems: items.length,
            validation: {
                passed: validation.passed,
                blocked: validation.blocked,
                warned: validation.warned
            },
            violationStats,
            details: validation.items.filter(i => !i.passed).slice(0, 10)
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/automation/backfill-date
 * 补充历史日期内容
 * Backfill content for a specific historical date from approved drafts
 */
router.post('/backfill-date', async (req, res) => {
    const { targetDate, limit = 10 } = req.body;

    if (!targetDate) {
        return res.status(400).json({ success: false, error: 'targetDate is required (format: YYYY-MM-DD)' });
    }

    const results = {
        processed: 0,
        published: 0,
        skipped: 0,
        errors: []
    };

    try {
        console.log(`🚀 补充历史日期内容: ${targetDate}`);

        // 获取该日期已存在的频段
        const { rows: existingFreqs } = await pool.query(
            `SELECT freq FROM radar_items WHERE date = $1`,
            [targetDate]
        );
        const usedFreqs = new Set(existingFreqs.map(r => r.freq));
        console.log(`📊 ${targetDate} 已存在频段: ${[...usedFreqs].join(', ') || '无'}`);

        // 获取已批准的草稿内容
        const { rows: drafts } = await pool.query(`
            SELECT d.*, cs.name as source_name
            FROM drafts d
            LEFT JOIN content_sources cs ON d.source_id = cs.id
            WHERE d.status = 'approved'
            AND d.generated_items IS NOT NULL
            AND jsonb_array_length(d.generated_items) > 0
            ORDER BY d.created_at DESC
            LIMIT $1
        `, [parseInt(limit) * 3]);

        console.log(`📝 找到 ${drafts.length} 个已批准草稿`);

        for (const draft of drafts) {
            if (results.published >= parseInt(limit)) break;

            results.processed++;
            let items = draft.generated_items;
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    continue;
                }
            }

            if (!items || items.length === 0) continue;

            for (const item of items) {
                if (results.published >= parseInt(limit)) break;

                // 跳过已使用的频段
                if (usedFreqs.has(item.freq)) continue;

                // 质量检查
                if (!item.content || item.content.length < 300) {
                    results.skipped++;
                    continue;
                }

                // 防止重复: 检查同日期+标题是否已存在
                const { rows: existingItem } = await pool.query(
                    `SELECT id FROM radar_items WHERE date = $1 AND title = $2`,
                    [targetDate, item.title]
                );
                if (existingItem.length > 0) {
                    console.log(`⏭️ 跳过重复: [${item.freq}] ${item.title?.substring(0, 25)}...`);
                    results.skipped++;
                    continue;
                }

                // maxPerFreq 检查 (普通日每频段限1条)
                const dayRules = getRulesForDate(targetDate);
                if (!dayRules.isThemeDay) {
                    const maxPerFreq = dayRules.rules?.maxPerFreq || 1;
                    const { rows: freqCount } = await pool.query(
                        `SELECT COUNT(*) as count FROM radar_items WHERE date = $1 AND freq = $2`,
                        [targetDate, item.freq]
                    );
                    if (parseInt(freqCount[0].count) >= maxPerFreq) {
                        console.log(`⏭️ 跳过频段已满: [${item.freq}] 已有${freqCount[0].count}条`);
                        results.skipped++;
                        continue;
                    }
                }

                try {
                    const insertResult = await pool.query(`
                        INSERT INTO radar_items (
                            date, freq, stance, title, 
                            author_name, author_avatar, author_bio,
                            source, content, 
                            tension_q, tension_a, tension_b, keywords
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        RETURNING id, freq, title
                    `, [
                        targetDate,
                        item.freq,
                        item.stance || 'A',
                        item.title,
                        item.author_name,
                        item.author_avatar || item.author_name?.substring(0, 2) || 'XX',
                        item.author_bio || '',
                        item.source || '',
                        item.content,
                        item.tension_q || '',
                        item.tension_a || '',
                        item.tension_b || '',
                        item.keywords || []
                    ]);

                    if (insertResult.rows.length > 0) {
                        const inserted = insertResult.rows[0];
                        console.log(`✅ [${inserted.freq}] ${inserted.title?.substring(0, 30)}...`);
                        usedFreqs.add(item.freq);
                        results.published++;
                    }
                } catch (insertError) {
                    if (!insertError.message.includes('duplicate')) {
                        results.errors.push(`[${item.freq}]: ${insertError.message}`);
                    }
                }
            }
        }

        // 获取最终统计
        const { rows: finalCount } = await pool.query(
            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
            [targetDate]
        );

        console.log(`\n🏁 完成! 处理:${results.processed} 发布:${results.published} 跳过:${results.skipped}`);

        res.json({
            success: true,
            date: targetDate,
            message: `历史日期补充完成: 新增 ${results.published} 条内容`,
            totalForDate: parseInt(finalCount[0].count),
            results
        });

    } catch (error) {
        console.error('❌ 历史日期补充失败:', error);
        res.status(500).json({ success: false, error: error.message, results });
    }
});

module.exports = router;

