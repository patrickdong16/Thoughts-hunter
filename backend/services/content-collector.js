// 内容采集服务
// Content Collector Service
// 用于从YouTube等平台获取新内容

const { google } = require('googleapis');
const { YoutubeTranscript } = require('youtube-transcript');
const pool = require('../config/database');
const youtube = google.youtube('v3');
const { withTimeout, withRetry, TIMEOUTS, RETRY_CONFIGS } = require('../utils/api-utils');

// YouTube API配置 - 优先使用环境变量，fallback到配置文件（开发环境）
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
const YOUTUBE_API_KEY = getApiKey('YOUTUBE_API_KEY');
const MAX_RESULTS = parseInt(process.env.MAX_VIDEOS_PER_CHECK) || 10;

/**
 * 从YouTube频道获取最新视频
 * @param {string} channelId - YouTube频道ID或@handle
 * @param {number} maxResults - 最多获取视频数
 * @returns {Promise<Array>} 视频列表
 */
const getChannelLatestVideos = async (channelId, maxResults = MAX_RESULTS) => {
    try {
        if (!YOUTUBE_API_KEY) {
            throw new Error('YouTube API key未配置');
        }

        // 如果是@handle格式，需要先获取频道ID
        let actualChannelId = channelId;
        if (channelId.startsWith('@')) {
            const searchResponse = await withRetry(
                () => withTimeout(
                    youtube.search.list({
                        key: YOUTUBE_API_KEY,
                        part: 'snippet',
                        q: channelId,
                        type: 'channel',
                        maxResults: 1
                    }),
                    TIMEOUTS.YOUTUBE_API,
                    'YouTube 频道搜索请求超时'
                ),
                RETRY_CONFIGS.YOUTUBE_API
            );

            if (searchResponse.data.items.length === 0) {
                throw new Error(`找不到频道: ${channelId}`);
            }

            actualChannelId = searchResponse.data.items[0].snippet.channelId;
        }

        // 获取频道的uploads播放列表
        const channelResponse = await withRetry(
            () => withTimeout(
                youtube.channels.list({
                    key: YOUTUBE_API_KEY,
                    part: 'contentDetails',
                    id: actualChannelId
                }),
                TIMEOUTS.YOUTUBE_API,
                'YouTube 频道信息请求超时'
            ),
            RETRY_CONFIGS.YOUTUBE_API
        );

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            throw new Error(`频道不存在: ${channelId}`);
        }

        const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

        // 获取最新上传的视频
        const playlistResponse = await withRetry(
            () => withTimeout(
                youtube.playlistItems.list({
                    key: YOUTUBE_API_KEY,
                    part: 'snippet,contentDetails',
                    playlistId: uploadsPlaylistId,
                    maxResults: maxResults,
                    order: 'date'
                }),
                TIMEOUTS.YOUTUBE_API,
                'YouTube 播放列表请求超时'
            ),
            RETRY_CONFIGS.YOUTUBE_API
        );

        const videoIds = playlistResponse.data.items.map(item => item.contentDetails.videoId);

        // 获取视频详情（包含duration）
        const videosResponse = await withRetry(
            () => withTimeout(
                youtube.videos.list({
                    key: YOUTUBE_API_KEY,
                    part: 'contentDetails,snippet',
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
            publishedAt: video.snippet.publishedAt,
            thumbnail: video.snippet.thumbnails?.default?.url,
            channelTitle: video.snippet.channelTitle,
            duration: video.contentDetails.duration  // ISO 8601 格式如 PT1H23M45S
        }));

        return videos;
    } catch (error) {
        console.error('获取频道视频失败:', error.message);
        throw error;
    }
};

/**
 * 使用 yt-dlp 提取视频字幕（优先），youtube-transcript 作为 fallback
 * @param {string} videoId - YouTube视频ID
 * @returns {Promise<string>} 字幕文本
 */
const getVideoTranscript = async (videoId) => {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const fs = require('fs');
    const execAsync = promisify(exec);

    console.log(`[Transcript] 获取视频字幕: ${videoId}`);
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 方法1: 尝试使用 yt-dlp（更可靠）
    try {
        console.log('[Transcript] 尝试 yt-dlp 获取字幕...');

        // 下载自动生成的英文字幕
        const outputPath = `/tmp/subtitle_${videoId}`;
        const command = `yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format json3 -o "${outputPath}" "${videoUrl}" 2>&1`;

        await execAsync(command, { timeout: 60000 });

        // 读取字幕文件
        const subtitleFile = `${outputPath}.en.json3`;
        if (fs.existsSync(subtitleFile)) {
            const subtitleData = JSON.parse(fs.readFileSync(subtitleFile, 'utf-8'));

            // 从 json3 格式提取文本
            let text = '';
            if (subtitleData.events) {
                for (const event of subtitleData.events) {
                    if (event.segs) {
                        for (const seg of event.segs) {
                            if (seg.utf8 && seg.utf8.trim() !== '') {
                                text += seg.utf8;
                            }
                        }
                    }
                }
            }

            // 清理临时文件
            try { fs.unlinkSync(subtitleFile); } catch (e) { }

            if (text.length > 100) {
                console.log(`[Transcript] yt-dlp 成功获取字幕，长度: ${text.length} 字符`);
                return cleanTranscript(text);
            }
        }
        console.log('[Transcript] yt-dlp 未找到字幕文件');
    } catch (ytdlpError) {
        console.log(`[Transcript] yt-dlp 失败: ${ytdlpError.message}`);
    }

    // 方法2: fallback 到 youtube-transcript npm 包
    try {
        console.log('[Transcript] 尝试 youtube-transcript 库...');
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'en'
        }).catch(async () => {
            return YoutubeTranscript.fetchTranscript(videoId, {
                lang: 'zh-Hans'
            }).catch(() => {
                return YoutubeTranscript.fetchTranscript(videoId);
            });
        });

        if (transcriptItems && transcriptItems.length > 0) {
            const transcript = transcriptItems.map(item => item.text).join(' ');
            console.log(`[Transcript] youtube-transcript 成功，长度: ${transcript.length} 字符`);
            return cleanTranscript(transcript);
        }
    } catch (ytError) {
        console.log(`[Transcript] youtube-transcript 失败: ${ytError.message}`);
    }

    throw new Error('所有字幕获取方法均失败');
};

/**
 * 清理字幕文本
 * @param {string} rawTranscript - 原始字幕
 * @returns {string} 清理后的文本
 */
const cleanTranscript = (rawTranscript) => {
    // 移除时间戳和格式标记
    let cleaned = rawTranscript
        .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g, '')
        .replace(/^\d+$/gm, '')  // 移除序号
        .replace(/\n{3,}/g, '\n\n')  // 移除多余空行
        .trim();

    return cleaned;
};

/**
 * 获取视频详细元数据
 * @param {string} videoId - 视频ID
 * @returns {Promise<Object>} 元数据对象
 */
const getVideoMetadata = async (videoId) => {
    try {
        const response = await withRetry(
            () => withTimeout(
                youtube.videos.list({
                    key: YOUTUBE_API_KEY,
                    part: 'snippet,contentDetails,statistics',
                    id: videoId
                }),
                TIMEOUTS.YOUTUBE_API,
                'YouTube 视频元数据请求超时'
            ),
            RETRY_CONFIGS.YOUTUBE_API
        );

        if (!response.data.items || response.data.items.length === 0) {
            throw new Error(`视频不存在: ${videoId}`);
        }

        const video = response.data.items[0];

        return {
            videoId: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration,
            viewCount: video.statistics.viewCount,
            tags: video.snippet.tags || [],
            thumbnail: video.snippet.thumbnails.high.url
        };
    } catch (error) {
        console.error('获取视频元数据失败:', error.message);
        throw error;
    }
};

/**
 * 检查单个内容源的新内容
 * @param {number} sourceId - 内容源ID
 * @returns {Promise<Array>} 未处理的新视频列表
 */
const checkNewContentForSource = async (sourceId) => {
    try {
        // 获取源信息
        const sourceQuery = `SELECT * FROM content_sources WHERE id = $1 AND type = 'channel'`;
        const sourceResult = await pool.query(sourceQuery, [sourceId]);

        if (sourceResult.rows.length === 0) {
            throw new Error(`内容源 ${sourceId} 不存在或不是频道类型`);
        }

        const source = sourceResult.rows[0];

        // 从URL提取频道ID（假设格式为 youtube.com/@handle 或 youtube.com/channel/ID）
        const channelId = extractChannelId(source.url);

        if (!channelId) {
            throw new Error(`无法从URL提取频道ID: ${source.url}`);
        }

        console.log(`检查频道 ${source.name} (${channelId}) 的新内容...`);

        // 获取最新视频
        const latestVideos = await getChannelLatestVideos(channelId, MAX_RESULTS);

        // 过滤出未处理的视频
        const newVideos = [];

        for (const video of latestVideos) {
            // 检查是否已在collection_log中
            const logQuery = `
        SELECT id FROM collection_log
        WHERE source_id = $1 AND video_id = $2
      `;
            const logResult = await pool.query(logQuery, [sourceId, video.videoId]);

            if (logResult.rows.length === 0) {
                // 新视频，记录到日志（包含所有筛选所需字段）
                const insertLogQuery = `
          INSERT INTO collection_log (source_id, video_id, video_url, video_title, title, description, channel_title, duration, published_at, analyzed)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
        `;
                await pool.query(insertLogQuery, [
                    sourceId,
                    video.videoId,
                    `https://www.youtube.com/watch?v=${video.videoId}`,
                    video.title,                                        // video_title (兼容旧代码)
                    video.title,                                        // title (筛选用)
                    video.description?.substring(0, 2000) || null,      // description (筛选用)
                    video.channelTitle || null,                         // channel_title (筛选用)
                    video.duration,
                    video.publishedAt
                ]);

                newVideos.push(video);
            }
        }

        console.log(`发现 ${newVideos.length} 个新视频`);
        return newVideos;
    } catch (error) {
        console.error('检查新内容失败:', error.message);
        throw error;
    }
};

/**
 * 从YouTube URL提取频道ID
 * @param {string} url - YouTube频道URL
 * @returns {string|null} 频道ID或handle
 */
const extractChannelId = (url) => {
    if (!url) return null;

    // 匹配 youtube.com/@handle
    const handleMatch = url.match(/youtube\.com\/@([^\/\?]+)/);
    if (handleMatch) return '@' + handleMatch[1];

    // 匹配 youtube.com/channel/CHANNEL_ID
    const channelMatch = url.match(/youtube\.com\/channel\/([^\/\?]+)/);
    if (channelMatch) return channelMatch[1];

    // 匹配 youtube.com/c/CustomName
    const customMatch = url.match(/youtube\.com\/c\/([^\/\?]+)/);
    if (customMatch) return '@' + customMatch[1];

    return null;
};

/**
 * 检查所有活跃频道的新内容
 * @returns {Promise<Object>} 检查结果统计
 */
const checkAllActiveSources = async () => {
    try {
        const sourcesQuery = `
      SELECT id, name FROM content_sources
      WHERE type = 'channel' AND status = 'active'
    `;
        const sourcesResult = await pool.query(sourcesQuery);
        const sources = sourcesResult.rows;

        console.log(`开始检查 ${sources.length} 个频道的新内容...`);

        let totalNew = 0;
        const results = [];

        for (const source of sources) {
            try {
                const newVideos = await checkNewContentForSource(source.id);
                totalNew += newVideos.length;
                results.push({
                    sourceId: source.id,
                    sourceName: source.name,
                    newCount: newVideos.length
                });
            } catch (error) {
                console.error(`检查源 ${source.name} 失败:`, error.message);
                results.push({
                    sourceId: source.id,
                    sourceName: source.name,
                    error: error.message
                });
            }
        }

        console.log(`检查完成: 共发现 ${totalNew} 个新视频`);
        return { totalSources: sources.length, totalNew, results };
    } catch (error) {
        console.error('检查所有源失败:', error.message);
        throw error;
    }
};

module.exports = {
    getChannelLatestVideos,
    getVideoTranscript,
    getVideoMetadata,
    checkNewContentForSource,
    checkAllActiveSources,
    extractChannelId
};
