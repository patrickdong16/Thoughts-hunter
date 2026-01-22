// 内容采集服务
// Content Collector Service
// 用于从YouTube等平台获取新内容

const { google } = require('googleapis');
const { exec } = require('child_process');
const { promisify } = require('util');
const pool = require('../config/database');

const execAsync = promisify(exec);
const youtube = google.youtube('v3');

// YouTube API配置 - 优先使用环境变量，fallback到配置文件
const getApiKey = (key) => {
    if (process.env[key]) return process.env[key];
    try {
        const config = require('../config/api-keys.json');
        return config[key];
    } catch (e) {
        return null;
    }
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
            const searchResponse = await youtube.search.list({
                key: YOUTUBE_API_KEY,
                part: 'snippet',
                q: channelId,
                type: 'channel',
                maxResults: 1
            });

            if (searchResponse.data.items.length === 0) {
                throw new Error(`找不到频道: ${channelId}`);
            }

            actualChannelId = searchResponse.data.items[0].snippet.channelId;
        }

        // 获取频道的uploads播放列表
        const channelResponse = await youtube.channels.list({
            key: YOUTUBE_API_KEY,
            part: 'contentDetails',
            id: actualChannelId
        });

        if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
            throw new Error(`频道不存在: ${channelId}`);
        }

        const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

        // 获取最新上传的视频
        const playlistResponse = await youtube.playlistItems.list({
            key: YOUTUBE_API_KEY,
            part: 'snippet,contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: maxResults,
            order: 'date'
        });

        const videoIds = playlistResponse.data.items.map(item => item.contentDetails.videoId);

        // 获取视频详情（包含duration）
        const videosResponse = await youtube.videos.list({
            key: YOUTUBE_API_KEY,
            part: 'contentDetails,snippet',
            id: videoIds.join(',')
        });

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
 * 使用yt-dlp提取视频字幕
 * @param {string} videoId - YouTube视频ID
 * @returns {Promise<string>} 字幕文本
 */
const getVideoTranscript = async (videoId) => {
    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // 使用yt-dlp获取自动生成的字幕
        // --write-auto-sub: 下载自动生成的字幕
        // --skip-download: 只下载字幕不下载视频
        // --sub-lang en,zh: 优先英文和中文
        // --convert-subs txt: 转换为纯文本
        const command = `yt-dlp --write-auto-sub --skip-download --sub-lang en,zh-Hans,zh --convert-subs txt --output "/tmp/%(id)s" "${videoUrl}" 2>&1`;

        const { stdout, stderr } = await execAsync(command);

        // 读取生成的字幕文件
        const fs = require('fs');
        const subtitlePath = `/tmp/${videoId}.en.txt`;

        if (!fs.existsSync(subtitlePath)) {
            // 尝试其他语言
            const alternativePath = `/tmp/${videoId}.zh-Hans.txt`;
            if (fs.existsSync(alternativePath)) {
                const transcript = fs.readFileSync(alternativePath, 'utf-8');
                fs.unlinkSync(alternativePath); // 清理临时文件
                return cleanTranscript(transcript);
            }

            throw new Error('未找到字幕文件，视频可能没有可用字幕');
        }

        const transcript = fs.readFileSync(subtitlePath, 'utf-8');

        // 清理临时文件
        fs.unlinkSync(subtitlePath);

        return cleanTranscript(transcript);
    } catch (error) {
        console.error('提取字幕失败:', error.message);
        throw error;
    }
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
        const response = await youtube.videos.list({
            key: YOUTUBE_API_KEY,
            part: 'snippet,contentDetails,statistics',
            id: videoId
        });

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
                // 新视频，记录到日志（包含duration用于后续筛选）
                const insertLogQuery = `
          INSERT INTO collection_log (source_id, video_id, video_url, video_title, duration, published_at, analyzed)
          VALUES ($1, $2, $3, $4, $5, $6, false)
        `;
                await pool.query(insertLogQuery, [
                    sourceId,
                    video.videoId,
                    `https://www.youtube.com/watch?v=${video.videoId}`,
                    video.title,
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
