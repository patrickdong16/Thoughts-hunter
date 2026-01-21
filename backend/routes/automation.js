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
 * @returns {Object} { eligible: boolean, reason: string }
 */
function checkVideoEligibility(video) {
    const { videoFilters, targetChannels, targetSpeakers, topicKeywords } = automationConfig;
    const textToCheck = `${video.title || ''} ${video.description || ''} ${video.channelTitle || ''}`.toLowerCase();

    // 1. 检查时长
    const durationMinutes = parseDuration(video.duration);
    if (durationMinutes < videoFilters.minDuration) {
        return { eligible: false, reason: `时长 ${durationMinutes}分钟 < ${videoFilters.minDuration}分钟` };
    }

    // 2. 检查发布时间
    if (video.publishedAt) {
        const publishDate = new Date(video.publishedAt);
        const daysSincePublish = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublish > videoFilters.maxAgeInDays) {
            return { eligible: false, reason: `发布于 ${Math.floor(daysSincePublish)} 天前，超过 ${videoFilters.maxAgeInDays} 天` };
        }
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

        // 2. 筛选符合条件的视频
        const eligibleVideos = [];
        for (const video of pendingVideos) {
            const check = checkVideoEligibility(video);
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

module.exports = router;
