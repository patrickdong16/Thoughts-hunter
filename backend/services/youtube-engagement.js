/**
 * YouTube 互动数据服务 (测试版本)
 * 获取视频观看量、点赞数、评论数
 * 
 * 回滚方法: 删除此文件即可
 */

const { google } = require('googleapis');
const pool = require('../config/database');
const youtube = google.youtube('v3');
const { withTimeout, withRetry, TIMEOUTS, RETRY_CONFIGS } = require('../utils/api-utils');

// YouTube API Key
const getApiKey = (key) => {
    if (process.env[key]) return process.env[key];
    if (process.env.NODE_ENV !== 'production') {
        try {
            const config = require('../config/api-keys.json');
            if (config[key]) return config[key];
        } catch (e) { }
    }
    return null;
};
const YOUTUBE_API_KEY = getApiKey('YOUTUBE_API_KEY');

/**
 * 获取单个视频的互动数据
 * @param {string} videoId - YouTube 视频 ID
 * @returns {Promise<Object>} 互动数据
 */
async function fetchVideoEngagement(videoId) {
    if (!YOUTUBE_API_KEY) {
        throw new Error('YOUTUBE_API_KEY 未配置');
    }

    try {
        const response = await withRetry(
            () => withTimeout(
                youtube.videos.list({
                    key: YOUTUBE_API_KEY,
                    part: 'statistics',
                    id: videoId
                }),
                TIMEOUTS.YOUTUBE_API,
                'YouTube API 超时'
            ),
            RETRY_CONFIGS.YOUTUBE_API
        );

        if (!response.data.items || response.data.items.length === 0) {
            return null; // 视频不存在或已删除
        }

        const stats = response.data.items[0].statistics;
        return {
            videoId,
            viewCount: parseInt(stats.viewCount) || 0,
            likeCount: parseInt(stats.likeCount) || 0,
            commentCount: parseInt(stats.commentCount) || 0,
            fetchedAt: new Date()
        };
    } catch (error) {
        console.error(`获取视频 ${videoId} 互动数据失败:`, error.message);
        throw error;
    }
}

/**
 * 批量获取视频互动数据 (最多50个/请求)
 * @param {string[]} videoIds - 视频 ID 数组
 * @returns {Promise<Object>} videoId -> engagement 映射
 */
async function fetchBatchEngagement(videoIds) {
    if (!YOUTUBE_API_KEY) {
        throw new Error('YOUTUBE_API_KEY 未配置');
    }

    const results = {};

    // YouTube API 限制每次最多 50 个视频
    const batchSize = 50;
    for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize);

        try {
            const response = await withRetry(
                () => withTimeout(
                    youtube.videos.list({
                        key: YOUTUBE_API_KEY,
                        part: 'statistics',
                        id: batch.join(',')
                    }),
                    TIMEOUTS.YOUTUBE_API,
                    'YouTube API 超时'
                ),
                RETRY_CONFIGS.YOUTUBE_API
            );

            for (const item of response.data.items || []) {
                const stats = item.statistics;
                results[item.id] = {
                    viewCount: parseInt(stats.viewCount) || 0,
                    likeCount: parseInt(stats.likeCount) || 0,
                    commentCount: parseInt(stats.commentCount) || 0
                };
            }
        } catch (error) {
            console.error(`批量获取失败 (batch ${i / batchSize + 1}):`, error.message);
        }
    }

    return results;
}

/**
 * 更新数据库中所有有 video_id 的内容
 * @returns {Promise<Object>} 更新统计
 */
async function updateAllEngagement() {
    console.log('📊 开始更新 YouTube 互动数据...\n');

    try {
        // 获取所有有 video_id 的内容
        const query = `
            SELECT id, video_id 
            FROM radar_items 
            WHERE video_id IS NOT NULL AND video_id != ''
        `;
        const result = await pool.query(query);
        const items = result.rows;

        console.log(`找到 ${items.length} 条有视频 ID 的内容\n`);

        if (items.length === 0) {
            return { total: 0, updated: 0, failed: 0 };
        }

        // 批量获取互动数据
        const videoIds = items.map(item => item.video_id);
        const engagementData = await fetchBatchEngagement(videoIds);

        // 更新数据库
        let updated = 0;
        let failed = 0;

        for (const item of items) {
            const engagement = engagementData[item.video_id];

            if (engagement) {
                await pool.query(`
                    UPDATE radar_items 
                    SET yt_view_count = $1, 
                        yt_like_count = $2, 
                        yt_comment_count = $3, 
                        yt_updated_at = NOW()
                    WHERE id = $4
                `, [engagement.viewCount, engagement.likeCount, engagement.commentCount, item.id]);

                updated++;
            } else {
                failed++;
            }
        }

        console.log(`\n✅ 更新完成: ${updated} 成功, ${failed} 失败`);
        return { total: items.length, updated, failed };

    } catch (error) {
        console.error('更新互动数据失败:', error.message);
        throw error;
    }
}

/**
 * 获取互动数据统计
 * @returns {Promise<Object>} 统计数据
 */
async function getEngagementStats() {
    const query = `
        SELECT 
            COUNT(*) as total_items,
            COUNT(yt_view_count) as with_engagement,
            SUM(yt_view_count) as total_views,
            AVG(yt_view_count)::INTEGER as avg_views,
            MAX(yt_view_count) as max_views,
            SUM(yt_like_count) as total_likes,
            SUM(yt_comment_count) as total_comments
        FROM radar_items
        WHERE video_id IS NOT NULL
    `;

    const result = await pool.query(query);
    return result.rows[0];
}

/**
 * 获取热度排行榜
 * @param {number} limit - 返回数量
 * @returns {Promise<Array>} 热度排行
 */
async function getTopByViews(limit = 10) {
    const query = `
        SELECT id, title, author_name, freq, date, 
               yt_view_count, yt_like_count, yt_comment_count,
               video_id
        FROM radar_items
        WHERE yt_view_count IS NOT NULL
        ORDER BY yt_view_count DESC
        LIMIT $1
    `;

    const result = await pool.query(query, [limit]);
    return result.rows;
}

module.exports = {
    fetchVideoEngagement,
    fetchBatchEngagement,
    updateAllEngagement,
    getEngagementStats,
    getTopByViews
};
