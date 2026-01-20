// 内容采集 API 路由
// Collection API Routes

const express = require('express');
const router = express.Router();
const contentCollector = require('../services/content-collector');
const aiAnalyzer = require('../services/ai-analyzer');
const pool = require('../config/database');

/**
 * GET /api/collection/recent-videos/:sourceId
 * 获取指定内容源的最新视频
 */
router.get('/recent-videos/:sourceId', async (req, res) => {
    try {
        const { sourceId } = req.params;
        const { limit = 10 } = req.query;

        // 获取内容源信息
        const sourceResult = await pool.query(
            'SELECT * FROM content_sources WHERE id = $1',
            [sourceId]
        );

        if (sourceResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: '内容源不存在' });
        }

        const source = sourceResult.rows[0];

        if (source.type !== 'channel') {
            return res.status(400).json({ success: false, error: '仅支持频道类型的内容源' });
        }

        // 提取频道ID
        const channelId = contentCollector.extractChannelId(source.url);
        if (!channelId) {
            return res.status(400).json({ success: false, error: '无法从URL提取频道ID' });
        }

        const videos = await contentCollector.getChannelLatestVideos(channelId, parseInt(limit));

        res.json({
            success: true,
            data: videos,
            source: { id: source.id, name: source.name, url: source.url }
        });
    } catch (error) {
        console.error('获取最新视频失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/collection/check-source/:sourceId
 * 检查单个内容源的新内容
 */
router.post('/check-source/:sourceId', async (req, res) => {
    try {
        const newVideos = await contentCollector.checkNewContentForSource(req.params.sourceId);

        res.json({
            success: true,
            data: newVideos,
            count: newVideos.length,
            message: `发现 ${newVideos.length} 个新视频`
        });
    } catch (error) {
        console.error('检查新内容失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/collection/check-all
 * 检查所有活跃内容源的新内容
 */
router.post('/check-all', async (req, res) => {
    try {
        const results = await contentCollector.checkAllActiveSources();
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('检查所有源失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/collection/analyze/:sourceId/:videoId
 * 分析指定视频并创建草稿
 */
router.post('/analyze/:sourceId/:videoId', async (req, res) => {
    try {
        const { sourceId, videoId } = req.params;

        // 检查视频时长（运营规范：≥40分钟）
        const metadata = await contentCollector.getVideoMetadata(videoId);
        const durationMatch = metadata.duration?.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

        if (durationMatch) {
            const hours = parseInt(durationMatch[1]) || 0;
            const minutes = parseInt(durationMatch[2]) || 0;
            const totalMinutes = hours * 60 + minutes;

            if (totalMinutes < 40) {
                return res.status(400).json({
                    success: false,
                    error: `视频时长 ${totalMinutes} 分钟，不满足最低40分钟要求`,
                    duration: totalMinutes
                });
            }
        }

        const draft = await aiAnalyzer.createDraftFromVideo(videoId, parseInt(sourceId));

        res.json({
            success: true,
            data: draft,
            message: `分析完成，生成 ${draft.generated_items?.length || 0} 个条目`
        });
    } catch (error) {
        console.error('分析视频失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/collection/log
 * 获取采集日志
 */
router.get('/log', async (req, res) => {
    try {
        const { limit = 50, analyzed } = req.query;

        let query = `
      SELECT cl.*, cs.name as source_name 
      FROM collection_log cl
      LEFT JOIN content_sources cs ON cl.source_id = cs.id
      WHERE 1=1
    `;
        const params = [];

        if (analyzed !== undefined) {
            params.push(analyzed === 'true');
            query += ` AND cl.analyzed = $${params.length}`;
        }

        query += ` ORDER BY cl.checked_at DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows, count: result.rows.length });
    } catch (error) {
        console.error('获取采集日志失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
