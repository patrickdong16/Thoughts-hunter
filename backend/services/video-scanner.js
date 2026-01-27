/**
 * YouTube 视频扫描服务
 * Video Scanner Service
 * 
 * 扫描配置的目标频道，筛选符合条件的视频添加到采集队列
 */

const { google } = require('googleapis');
const automationConfig = require('../config/automation');
const pool = require('../config/database');

// YouTube API 客户端
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

/**
 * 获取 N 天前的日期
 */
function getDateNDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

/**
 * 解析 ISO 8601 时长格式为分钟数
 * PT1H30M45S -> 90
 */
function parseDuration(duration) {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || 0);
    const minutes = parseInt(match[2] || 0);
    return hours * 60 + minutes;
}

/**
 * 根据频道用户名获取频道ID
 */
async function getChannelIdByUsername(username) {
    try {
        // 先尝试 forUsername
        let response = await youtube.channels.list({
            part: 'id',
            forUsername: username
        });

        if (response.data.items?.length > 0) {
            return response.data.items[0].id;
        }

        // 尝试搜索频道
        response = await youtube.search.list({
            part: 'snippet',
            q: username,
            type: 'channel',
            maxResults: 1
        });

        if (response.data.items?.length > 0) {
            return response.data.items[0].id.channelId;
        }

        return null;
    } catch (error) {
        console.error(`Failed to get channel ID for ${username}:`, error.message);
        return null;
    }
}

/**
 * 扫描单个频道的最新视频
 * @param {string} channelId - 频道ID或用户名
 * @param {number} maxResults - 最大结果数
 * @param {number} daysBack - 查询多少天内的视频
 */
async function scanChannelVideos(channelId, maxResults = 10, daysBack = 7) {
    try {
        // 如果是用户名格式，尝试获取真实频道ID
        let realChannelId = channelId;
        if (!channelId.startsWith('UC')) {
            realChannelId = await getChannelIdByUsername(channelId);
            if (!realChannelId) {
                console.log(`Cannot find channel ID for: ${channelId}`);
                return [];
            }
        }

        const response = await youtube.search.list({
            part: 'snippet',
            channelId: realChannelId,
            type: 'video',
            order: 'date',
            publishedAfter: getDateNDaysAgo(daysBack).toISOString(),
            maxResults
        });

        return response.data.items || [];
    } catch (error) {
        console.error(`Scan channel ${channelId} error:`, error.message);
        return [];
    }
}

/**
 * 获取视频详细信息（时长、统计等）
 * @param {Array<string>} videoIds - 视频ID列表
 */
async function getVideoDetails(videoIds) {
    if (!videoIds || videoIds.length === 0) return [];

    try {
        const response = await youtube.videos.list({
            part: 'contentDetails,snippet,statistics',
            id: videoIds.join(',')
        });
        return response.data.items || [];
    } catch (error) {
        console.error('Get video details error:', error.message);
        return [];
    }
}

/**
 * 检查视频是否已在队列中
 */
async function isVideoInQueue(videoId) {
    const { rows } = await pool.query(
        'SELECT id FROM collection_log WHERE video_id = $1',
        [videoId]
    );
    return rows.length > 0;
}

/**
 * 添加视频到采集队列
 */
async function addToQueue(video, channel, details) {
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const channelTitle = video.snippet.channelTitle;
    const publishedAt = video.snippet.publishedAt;
    const duration = details?.contentDetails?.duration || 'PT0S';

    // 注意：collection_log.source_id 是整数类型外键
    // 这里使用 video_title 而不是 title (匹配现有表结构)
    await pool.query(`
        INSERT INTO collection_log 
        (video_id, video_title, channel_title, duration, published_at, checked_at, analyzed)
        VALUES ($1, $2, $3, $4, $5, NOW(), false)
        ON CONFLICT (video_id) DO NOTHING
    `, [videoId, title, channelTitle, duration, publishedAt]);
}

/**
 * 扫描所有配置频道
 * @param {Object} options - 扫描选项
 */
async function scanAllChannels(options = {}) {
    const {
        maxVideosPerChannel = 5,
        daysBack = 7,
        minDuration = automationConfig.videoFilters.minDuration || 40
    } = options;

    const results = {
        channelsScanned: 0,
        channelsFailed: 0,
        videosFound: 0,
        videosEligible: 0,
        videosAdded: 0,
        videosSkipped: 0,
        errors: []
    };

    const channels = automationConfig.targetChannels || [];
    console.log(`Scanning ${channels.length} channels...`);

    for (const channel of channels) {
        try {
            // 扫描频道视频
            const videos = await scanChannelVideos(
                channel.channelId,
                maxVideosPerChannel,
                daysBack
            );

            if (videos.length === 0) {
                results.channelsFailed++;
                continue;
            }

            results.channelsScanned++;
            results.videosFound += videos.length;

            // 获取视频详情
            const videoIds = videos.map(v => v.id.videoId);
            const details = await getVideoDetails(videoIds);
            const detailsMap = new Map(details.map(d => [d.id, d]));

            // 筛选并添加到队列
            for (const video of videos) {
                const videoId = video.id.videoId;
                const detail = detailsMap.get(videoId);
                const duration = parseDuration(detail?.contentDetails?.duration);

                // 检查时长
                if (duration < minDuration) {
                    continue;
                }

                results.videosEligible++;

                // 检查是否已存在
                if (await isVideoInQueue(videoId)) {
                    results.videosSkipped++;
                    continue;
                }

                // 添加到队列
                await addToQueue(video, channel, detail);
                results.videosAdded++;
                console.log(`✅ Added: ${video.snippet.title} (${duration}min)`);
            }

            // 避免 API 配额限制，适当延迟
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            results.errors.push({
                channel: channel.name,
                error: error.message
            });
        }
    }

    return results;
}

/**
 * 搜索特定人物的视频
 * @param {string} speakerName - 人物名称
 * @param {Object} options - 搜索选项
 */
async function searchSpeakerVideos(speakerName, options = {}) {
    const {
        maxResults = 5,
        daysBack = 30,
        minDuration = 40
    } = options;

    try {
        const response = await youtube.search.list({
            part: 'snippet',
            q: `${speakerName} interview OR speech OR podcast`,
            type: 'video',
            order: 'date',
            publishedAfter: getDateNDaysAgo(daysBack).toISOString(),
            videoDuration: 'long', // > 20 minutes
            maxResults
        });

        const videos = response.data.items || [];
        const videoIds = videos.map(v => v.id.videoId);
        const details = await getVideoDetails(videoIds);

        // 筛选时长
        const eligible = details.filter(d => {
            const duration = parseDuration(d.contentDetails.duration);
            return duration >= minDuration;
        });

        return {
            speaker: speakerName,
            found: videos.length,
            eligible: eligible.length,
            videos: eligible.map(d => ({
                videoId: d.id,
                title: d.snippet.title,
                channel: d.snippet.channelTitle,
                duration: d.contentDetails.duration,
                publishedAt: d.snippet.publishedAt
            }))
        };
    } catch (error) {
        console.error(`Search speaker ${speakerName} error:`, error.message);
        return { speaker: speakerName, error: error.message };
    }
}

/**
 * 通过 RSS Feed 扫描频道视频（无配额限制）
 * YouTube RSS: https://www.youtube.com/feeds/videos.xml?channel_id=UC...
 * @param {string} channelId - UC 开头的频道 ID
 */
async function scanChannelViaRSS(channelId) {
    const Parser = require('rss-parser');
    const parser = new Parser();

    try {
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const feed = await parser.parseURL(feedUrl);

        return feed.items.map(item => ({
            videoId: item.id?.split(':').pop() || item.link?.split('v=').pop(),
            title: item.title,
            channelTitle: feed.title,
            publishedAt: item.pubDate || item.isoDate,
            link: item.link
        }));
    } catch (error) {
        console.error(`RSS scan ${channelId} error:`, error.message);
        return [];
    }
}

/**
 * 通过 RSS 扫描所有频道（备用渠道）
 * 适用于 YouTube API 配额用完时
 */
async function scanAllChannelsViaRSS(options = {}) {
    const { minDuration = 40 } = options;

    const results = {
        channelsScanned: 0,
        channelsFailed: 0,
        videosFound: 0,
        videosAdded: 0,
        videosSkipped: 0,
        errors: []
    };

    const channels = automationConfig.targetChannels || [];
    console.log(`[RSS] Scanning ${channels.length} channels...`);

    for (const channel of channels) {
        // 只处理 UC 开头的标准频道 ID
        if (!channel.channelId?.startsWith('UC')) {
            results.channelsFailed++;
            continue;
        }

        try {
            const videos = await scanChannelViaRSS(channel.channelId);

            if (videos.length === 0) {
                results.channelsFailed++;
                continue;
            }

            results.channelsScanned++;
            results.videosFound += videos.length;

            // 获取这些视频的详情（检查时长）- 仅消耗 1 单位/视频
            const videoIds = videos.map(v => v.videoId).filter(Boolean);
            const details = await getVideoDetails(videoIds);
            const detailsMap = new Map(details.map(d => [d.id, d]));

            for (const video of videos) {
                const detail = detailsMap.get(video.videoId);
                const duration = parseDuration(detail?.contentDetails?.duration);

                // 检查时长
                if (duration < minDuration) continue;

                // 检查是否已存在
                if (await isVideoInQueue(video.videoId)) {
                    results.videosSkipped++;
                    continue;
                }

                // 添加到队列
                await pool.query(`
                    INSERT INTO collection_log 
                    (video_id, video_title, channel_title, duration, published_at, checked_at, analyzed)
                    VALUES ($1, $2, $3, $4, $5, NOW(), false)
                    ON CONFLICT (video_id) DO NOTHING
                `, [video.videoId, video.title, video.channelTitle,
                detail?.contentDetails?.duration || 'PT0S', video.publishedAt]);

                results.videosAdded++;
                console.log(`[RSS] ✅ Added: ${video.title}`);
            }

        } catch (error) {
            results.errors.push({ channel: channel.name, error: error.message });
        }
    }

    return results;
}

/**
 * 智能扫描：优先 API，失败则 fallback 到 RSS
 */
async function scanWithFallback(options = {}) {
    console.log('Attempting YouTube API scan...');

    try {
        const apiResults = await scanAllChannels(options);

        // 如果 API 成功扫描了频道，返回结果
        if (apiResults.channelsScanned > 0) {
            return { method: 'api', ...apiResults };
        }

        // API 失败（可能配额用完），尝试 RSS
        console.log('API scan failed, falling back to RSS...');
        const rssResults = await scanAllChannelsViaRSS(options);
        return { method: 'rss', ...rssResults };

    } catch (error) {
        // API 出错，尝试 RSS
        console.log(`API error: ${error.message}, falling back to RSS...`);
        const rssResults = await scanAllChannelsViaRSS(options);
        return { method: 'rss', ...rssResults };
    }
}

module.exports = {
    scanChannelVideos,
    getVideoDetails,
    scanAllChannels,
    searchSpeakerVideos,
    parseDuration,
    addToQueue,
    isVideoInQueue,
    scanChannelViaRSS,
    scanAllChannelsViaRSS,
    scanWithFallback
};
