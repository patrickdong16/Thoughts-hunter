/**
 * YouTube 智能发现服务 (Smart Discovery Service)
 * 
 * 三层初筛架构：
 * 1. Hot Discovery - 热榜发现
 * 2. Quality Scoring - 质量评分
 * 3. Claude Analysis - 深度分析（仅高质量视频）
 * 
 * 设计目标：
 * - 不错过高质量热点内容
 * - 控制 Claude API 成本（只分析 Score ≥ 60 的视频）
 */

const { google } = require('googleapis');
const pool = require('../config/database');
const automationConfig = require('../config/automation');
const { withTimeout, withRetry, TIMEOUTS, RETRY_CONFIGS } = require('../utils/api-utils');

const youtube = google.youtube('v3');

// API Key 获取（与 content-collector 一致）
const getApiKey = (key) => {
    if (process.env[key]) return process.env[key];
    if (process.env.NODE_ENV !== 'production') {
        try {
            const config = require('../config/api-keys.json');
            if (config[key]) {
                console.warn(`⚠️ 使用本地配置文件中的 ${key}（仅限开发环境）`);
                return config[key];
            }
        } catch (e) { }
    }
    return null;
};
const YOUTUBE_API_KEY = getApiKey('YOUTUBE_API_KEY');

// ============================================================
// 配置
// ============================================================

const DISCOVERY_CONFIG = {
    // 质量评分阈值（0-100），高于此值才进入 Claude 分析
    qualityThreshold: 60,

    // 热榜发现：每个关键词最多返回视频数
    maxResultsPerKeyword: 15,

    // 最低观看量要求
    minViewCount: 5000,

    // 最低时长（分钟）
    minDuration: 20,

    // 热门视频关键词（从 automation.js 频段提取）
    hotKeywords: [
        'AI superintelligence interview',
        'artificial intelligence future',
        'democracy crisis',
        'geopolitics China America',
        'philosophy consciousness',
        'economic collapse prediction',
        'civilization decline'
    ]
};

// ============================================================
// 1. 热榜发现 (Hot Discovery)
// ============================================================

/**
 * 按关键词搜索热门视频
 * @param {string} keyword - 搜索关键词
 * @param {Object} options - 选项
 * @returns {Promise<Array>} 视频列表
 */
const searchHotVideos = async (keyword, options = {}) => {
    const {
        maxResults = DISCOVERY_CONFIG.maxResultsPerKeyword,
        publishedAfter = null,
        videoDuration = 'long' // short, medium, long
    } = options;

    try {
        if (!YOUTUBE_API_KEY) {
            throw new Error('YouTube API key 未配置');
        }

        console.log(`🔍 搜索热门视频: "${keyword}"`);

        // 计算发布时间窗口（默认7天内）
        const publishAfterDate = publishedAfter ||
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const searchResponse = await withRetry(
            () => withTimeout(
                youtube.search.list({
                    key: YOUTUBE_API_KEY,
                    part: 'snippet',
                    q: keyword,
                    type: 'video',
                    order: 'viewCount', // 按观看量排序
                    videoDuration: videoDuration,
                    publishedAfter: publishAfterDate,
                    maxResults: maxResults,
                    relevanceLanguage: 'en'
                }),
                TIMEOUTS.YOUTUBE_API,
                'YouTube 搜索请求超时'
            ),
            RETRY_CONFIGS.YOUTUBE_API
        );

        const videoIds = searchResponse.data.items.map(item => item.id.videoId);

        if (videoIds.length === 0) {
            console.log(`  ⚠️ 未找到相关视频`);
            return [];
        }

        // 获取视频详情（包含统计数据）
        const videosResponse = await withRetry(
            () => withTimeout(
                youtube.videos.list({
                    key: YOUTUBE_API_KEY,
                    part: 'snippet,contentDetails,statistics',
                    id: videoIds.join(',')
                }),
                TIMEOUTS.YOUTUBE_API,
                'YouTube 视频详情请求超时'
            ),
            RETRY_CONFIGS.YOUTUBE_API
        );

        const videos = videosResponse.data.items.map(video => ({
            videoId: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            channelTitle: video.snippet.channelTitle,
            channelId: video.snippet.channelId,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration,
            viewCount: parseInt(video.statistics.viewCount || 0),
            likeCount: parseInt(video.statistics.likeCount || 0),
            commentCount: parseInt(video.statistics.commentCount || 0),
            thumbnail: video.snippet.thumbnails?.high?.url,
            tags: video.snippet.tags || []
        }));

        console.log(`  ✅ 找到 ${videos.length} 个视频`);
        return videos;

    } catch (error) {
        console.error(`搜索热门视频失败 [${keyword}]:`, error.message);
        return [];
    }
};

/**
 * 批量热榜发现（多关键词搜索）
 * @param {Array<string>} keywords - 关键词列表
 * @returns {Promise<Array>} 去重后的视频列表
 */
const discoverHotVideos = async (keywords = DISCOVERY_CONFIG.hotKeywords) => {
    console.log('🔥 开始热榜发现...');
    const allVideos = [];
    const seenIds = new Set();

    for (const keyword of keywords) {
        const videos = await searchHotVideos(keyword);

        for (const video of videos) {
            if (!seenIds.has(video.videoId)) {
                seenIds.add(video.videoId);
                allVideos.push({
                    ...video,
                    discoveryKeyword: keyword
                });
            }
        }

        // 避免 API 速率限制
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`🔥 热榜发现完成: 共 ${allVideos.length} 个不重复视频`);
    return allVideos;
};

// ============================================================
// 2. 质量评分引擎 (Quality Scoring)
// ============================================================

/**
 * 解析 ISO 8601 时长为分钟数
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
 * 计算视频质量分数 (0-100)
 * @param {Object} video - 视频对象（包含统计数据）
 * @returns {Object} { score, breakdown }
 */
const calculateQualityScore = (video) => {
    const { targetChannels, targetSpeakers } = automationConfig;
    const textToCheck = `${video.title || ''} ${video.description || ''} ${video.channelTitle || ''}`.toLowerCase();

    let score = 0;
    const breakdown = {};

    // 1. 互动率 (30分) - (likes + comments) / views
    const views = video.viewCount || 1;
    const likes = video.likeCount || 0;
    const comments = video.commentCount || 0;
    const engagementRate = (likes + comments) / views;
    const engagementScore = Math.min(30, Math.round(engagementRate * 500));
    score += engagementScore;
    breakdown.engagement = { rate: (engagementRate * 100).toFixed(2) + '%', score: engagementScore };

    // 2. 观看量 (20分)
    let viewScore = 0;
    if (views >= 500000) viewScore = 20;
    else if (views >= 100000) viewScore = 16;
    else if (views >= 50000) viewScore = 12;
    else if (views >= 10000) viewScore = 8;
    else if (views >= 5000) viewScore = 4;
    score += viewScore;
    breakdown.views = { count: views, score: viewScore };

    // 3. 时长 (15分) - 长视频通常更深入
    const durationMinutes = parseDuration(video.duration);
    let durationScore = 0;
    if (durationMinutes >= 90) durationScore = 15;
    else if (durationMinutes >= 60) durationScore = 12;
    else if (durationMinutes >= 40) durationScore = 10;
    else if (durationMinutes >= 20) durationScore = 6;
    score += durationScore;
    breakdown.duration = { minutes: durationMinutes, score: durationScore };

    // 4. 频道/人物匹配 (25分)
    let matchScore = 0;
    let matchReason = [];

    // 频道匹配
    const matchedChannel = targetChannels.find(c =>
        textToCheck.includes(c.name.toLowerCase()) ||
        (video.channelTitle && video.channelTitle.toLowerCase().includes(c.name.toLowerCase()))
    );
    if (matchedChannel) {
        matchScore += Math.min(15, matchedChannel.priority * 1.5);
        matchReason.push(`频道: ${matchedChannel.name}`);
    }

    // 访谈人匹配
    const matchedSpeakers = targetSpeakers.filter(s =>
        textToCheck.includes(s.name.toLowerCase())
    );
    for (const speaker of matchedSpeakers.slice(0, 2)) { // 最多计入2个人物
        matchScore += Math.min(10, speaker.priority);
        matchReason.push(`人物: ${speaker.name}`);
    }

    matchScore = Math.min(25, matchScore);
    score += matchScore;
    breakdown.match = { score: matchScore, reasons: matchReason };

    // 5. 新鲜度 (10分)
    const publishedDate = new Date(video.publishedAt);
    const ageInDays = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    let freshnessScore = 0;
    if (ageInDays <= 3) freshnessScore = 10;
    else if (ageInDays <= 7) freshnessScore = 8;
    else if (ageInDays <= 14) freshnessScore = 5;
    else if (ageInDays <= 30) freshnessScore = 2;
    score += freshnessScore;
    breakdown.freshness = { daysOld: Math.round(ageInDays), score: freshnessScore };

    return {
        score: Math.min(100, score),
        breakdown,
        meetsThreshold: score >= DISCOVERY_CONFIG.qualityThreshold
    };
};

/**
 * 批量评分并筛选
 * @param {Array} videos - 视频列表
 * @returns {Array} 评分后的视频列表（按分数降序）
 */
const scoreAndFilterVideos = (videos) => {
    console.log('📊 开始质量评分...');

    const scored = videos.map(video => {
        const { score, breakdown, meetsThreshold } = calculateQualityScore(video);
        return {
            ...video,
            qualityScore: score,
            scoreBreakdown: breakdown,
            meetsThreshold
        };
    });

    // 按分数降序排列
    scored.sort((a, b) => b.qualityScore - a.qualityScore);

    const qualified = scored.filter(v => v.meetsThreshold);
    console.log(`📊 评分完成: ${qualified.length}/${scored.length} 个视频达到阈值 (≥${DISCOVERY_CONFIG.qualityThreshold})`);

    return { all: scored, qualified };
};

// ============================================================
// 3. 发现队列管理
// ============================================================

/**
 * 将发现的视频添加到采集队列
 * @param {Array} videos - 评分后的视频列表
 * @returns {Promise<Object>} 添加结果
 */
const addToCollectionQueue = async (videos) => {
    const results = { added: 0, skipped: 0, errors: [] };

    for (const video of videos) {
        try {
            // 检查是否已存在
            const existing = await pool.query(
                'SELECT id FROM collection_log WHERE video_id = $1',
                [video.videoId]
            );

            if (existing.rows.length > 0) {
                results.skipped++;
                continue;
            }

            // 插入到采集队列
            await pool.query(`
                INSERT INTO collection_log (
                    source_id, video_id, video_url, video_title, 
                    duration, published_at, analyzed,
                    discovery_method, quality_score
                ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8)
            `, [
                1, // 默认 source_id，可优化
                video.videoId,
                `https://www.youtube.com/watch?v=${video.videoId}`,
                video.title,
                video.duration,
                video.publishedAt,
                video.discoveryKeyword ? 'hot_discovery' : 'channel_monitor',
                video.qualityScore
            ]);

            results.added++;
            console.log(`  ➕ 已加入队列: [${video.qualityScore}分] ${video.title?.substring(0, 40)}...`);

        } catch (error) {
            results.errors.push({ videoId: video.videoId, error: error.message });
        }
    }

    return results;
};

// ============================================================
// 4. 完整发现流程
// ============================================================

/**
 * 执行完整的智能发现流程
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 发现结果
 */
const runSmartDiscovery = async (options = {}) => {
    const {
        keywords = DISCOVERY_CONFIG.hotKeywords,
        maxVideosToQueue = 20,
        dryRun = false
    } = options;

    console.log('═'.repeat(60));
    console.log('🚀 开始智能发现流程 (Smart Discovery Pipeline)');
    console.log('═'.repeat(60));

    const startTime = Date.now();
    const results = {
        discovered: 0,
        scored: 0,
        qualified: 0,
        queued: 0,
        skipped: 0,
        topVideos: [],
        errors: []
    };

    try {
        // Step 1: 热榜发现
        const discoveredVideos = await discoverHotVideos(keywords);
        results.discovered = discoveredVideos.length;

        if (discoveredVideos.length === 0) {
            console.log('⚠️ 未发现任何视频');
            return results;
        }

        // Step 2: 质量评分
        const { all, qualified } = scoreAndFilterVideos(discoveredVideos);
        results.scored = all.length;
        results.qualified = qualified.length;

        // 记录 Top 5 高分视频
        results.topVideos = qualified.slice(0, 5).map(v => ({
            videoId: v.videoId,
            title: v.title?.substring(0, 50),
            score: v.qualityScore,
            views: v.viewCount,
            channel: v.channelTitle
        }));

        console.log('\n📊 Top 5 高质量视频:');
        results.topVideos.forEach((v, i) => {
            console.log(`  ${i + 1}. [${v.score}分] ${v.title}...`);
        });

        // Step 3: 添加到队列
        if (!dryRun) {
            const toQueue = qualified.slice(0, maxVideosToQueue);
            const queueResult = await addToCollectionQueue(toQueue);
            results.queued = queueResult.added;
            results.skipped = queueResult.skipped;
            results.errors = queueResult.errors;
        } else {
            console.log('\n[DRY RUN] 跳过入队操作');
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n' + '═'.repeat(60));
        console.log(`✅ 智能发现完成 (${duration}s)`);
        console.log(`   发现: ${results.discovered} | 评分: ${results.scored} | 达标: ${results.qualified} | 入队: ${results.queued}`);
        console.log('═'.repeat(60));

        return results;

    } catch (error) {
        console.error('❌ 智能发现流程失败:', error.message);
        results.errors.push(error.message);
        throw error;
    }
};

// ============================================================
// 导出
// ============================================================

module.exports = {
    // 核心功能
    searchHotVideos,
    discoverHotVideos,
    calculateQualityScore,
    scoreAndFilterVideos,
    addToCollectionQueue,
    runSmartDiscovery,

    // 辅助
    parseDuration,
    DISCOVERY_CONFIG
};
