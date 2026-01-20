// 草稿管理 API 路由
// Drafts API Routes

const express = require('express');
const router = express.Router();
const draftManager = require('../services/draft-manager');
const aiAnalyzer = require('../services/ai-analyzer');
const contentCollector = require('../services/content-collector');

/**
 * GET /api/drafts
 * 获取草稿列表
 */
router.get('/', async (req, res) => {
    try {
        const { status = 'pending', limit = 50 } = req.query;
        const drafts = await draftManager.getAllDrafts(status, parseInt(limit));
        res.json({ success: true, data: drafts, count: drafts.length });
    } catch (error) {
        console.error('获取草稿列表失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/drafts/stats
 * 获取草稿统计
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await draftManager.getDraftStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('获取草稿统计失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/drafts/:id
 * 获取单个草稿详情
 */
router.get('/:id', async (req, res) => {
    try {
        const draft = await draftManager.getDraftById(req.params.id);
        if (!draft) {
            return res.status(404).json({ success: false, error: '草稿不存在' });
        }
        res.json({ success: true, data: draft });
    } catch (error) {
        console.error('获取草稿详情失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * PUT /api/drafts/:id
 * 更新草稿内容
 */
router.put('/:id', async (req, res) => {
    try {
        const draft = await draftManager.updateDraft(req.params.id, req.body);
        res.json({ success: true, data: draft });
    } catch (error) {
        console.error('更新草稿失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/drafts/:id/approve
 * 批准草稿并发布
 */
router.post('/:id/approve', async (req, res) => {
    try {
        const { selectedIndices, reviewedBy = 'cms_user' } = req.body;
        const result = await draftManager.approveDraft(
            req.params.id,
            selectedIndices,
            reviewedBy
        );
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('批准草稿失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/drafts/:id/reject
 * 拒绝草稿
 */
router.post('/:id/reject', async (req, res) => {
    try {
        const { reason = '', reviewedBy = 'cms_user' } = req.body;
        await draftManager.rejectDraft(req.params.id, reason, reviewedBy);
        res.json({ success: true, message: '草稿已拒绝' });
    } catch (error) {
        console.error('拒绝草稿失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /api/drafts/:id
 * 删除草稿
 */
router.delete('/:id', async (req, res) => {
    try {
        await draftManager.deleteDraft(req.params.id);
        res.json({ success: true, message: '草稿已删除' });
    } catch (error) {
        console.error('删除草稿失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/drafts/analyze-video
 * 手动分析视频并创建草稿
 */
router.post('/analyze-video', async (req, res) => {
    try {
        const { url, sourceId } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: '请提供视频URL' });
        }

        // 从URL提取视频ID
        const videoIdMatch = url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|$)/);
        if (!videoIdMatch) {
            return res.status(400).json({ success: false, error: '无效的YouTube URL' });
        }

        const videoId = videoIdMatch[1];
        console.log(`开始分析视频: ${videoId}`);

        const draft = await aiAnalyzer.createDraftFromVideo(videoId, sourceId || null);

        res.json({
            success: true,
            data: draft,
            message: `草稿创建成功，包含 ${draft.generated_items?.length || 0} 个条目`
        });
    } catch (error) {
        console.error('分析视频失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
