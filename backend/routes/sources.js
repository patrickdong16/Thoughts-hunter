// 内容源管理 API 路由
// Content Sources API Routes

const express = require('express');
const router = express.Router();

const sourceManager = require('../services/source-manager');
const sourceRanker = require('../services/source-ranker');
const sourceDiscovery = require('../services/source-discovery');

// ============================================
// 内容源管理路由
// ============================================

/**
 * GET /api/sources
 * 获取所有内容源（支持过滤）
 * Query params: domain, type, status
 */
router.get('/', async (req, res) => {
    try {
        const filters = {
            domain: req.query.domain,
            type: req.query.type,
            status: req.query.status || 'active'
        };

        const sources = await sourceManager.getAllSources(filters);
        res.json({
            success: true,
            count: sources.length,
            data: sources
        });
    } catch (error) {
        console.error('Error fetching sources:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sources/:id
 * 获取单个内容源详情
 */
router.get('/:id', async (req, res) => {
    try {
        const source = await sourceManager.getSourceById(req.params.id);

        if (!source) {
            return res.status(404).json({
                success: false,
                error: '找不到该内容源'
            });
        }

        res.json({
            success: true,
            data: source
        });
    } catch (error) {
        console.error('Error fetching source:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sources
 * 创建新内容源
 */
router.post('/', async (req, res) => {
    try {
        const source = await sourceManager.createSource(req.body);
        res.status(201).json({
            success: true,
            data: source
        });
    } catch (error) {
        console.error('Error creating source:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/sources/:id
 * 更新内容源
 */
router.put('/:id', async (req, res) => {
    try {
        const source = await sourceManager.updateSource(req.params.id, req.body);
        res.json({
            success: true,
            data: source
        });
    } catch (error) {
        console.error('Error updating source:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/sources/:id
 * 归档内容源（软删除）
 */
router.delete('/:id', async (req, res) => {
    try {
        const source = await sourceManager.archiveSource(req.params.id);
        res.json({
            success: true,
            message: '内容源已归档',
            data: source
        });
    } catch (error) {
        console.error('Error archiving source:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// 性能指标路由
// ============================================

/**
 * GET /api/sources/:id/metrics
 * 获取内容源的性能指标
 * Query params: months (默认6)
 */
router.get('/:id/metrics', async (req, res) => {
    try {
        const months = parseInt(req.query.months) || 6;
        const metrics = await sourceManager.getSourceMetrics(req.params.id, months);

        res.json({
            success: true,
            count: metrics.length,
            data: metrics
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sources/rankings
 * 获取所有来源的排名（按领域分组）
 */
router.get('/rankings/all', async (req, res) => {
    try {
        const rankings = await sourceManager.getSourceRankings();
        res.json({
            success: true,
            data: rankings
        });
    } catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/sources/people/trending
 * 获取热门人物列表
 * Query params: days (默认30)
 */
router.get('/people/trending', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const trending = await sourceManager.getTrendingPeople(days);

        res.json({
            success: true,
            count: trending.length,
            data: trending
        });
    } catch (error) {
        console.error('Error fetching trending people:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// 推荐管理路由
// ============================================

/**
 * GET /api/sources/recommendations
 * 获取所有待审核的推荐
 */
router.get('/recommendations/pending', async (req, res) => {
    try {
        const recommendations = await sourceDiscovery.getPendingRecommendations();
        res.json({
            success: true,
            count: recommendations.length,
            data: recommendations
        });
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sources/recommendations/:id/approve
 * 批准推荐
 * Body: { domain, description, priority_rank }
 */
router.post('/recommendations/:id/approve', async (req, res) => {
    try {
        const source = await sourceDiscovery.approveRecommendation(
            req.params.id,
            req.body
        );
        res.json({
            success: true,
            message: '推荐已批准',
            data: source
        });
    } catch (error) {
        console.error('Error approving recommendation:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sources/recommendations/:id/reject
 * 拒绝推荐
 */
router.post('/recommendations/:id/reject', async (req, res) => {
    try {
        await sourceDiscovery.rejectRecommendation(req.params.id);
        res.json({
            success: true,
            message: '推荐已拒绝'
        });
    } catch (error) {
        console.error('Error rejecting recommendation:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sources/discover
 * 手动触发源发现
 * Body: { days } (可选，默认30天)
 */
router.post('/discover', async (req, res) => {
    try {
        const days = req.body.days || 30;
        const recommendations = await sourceDiscovery.discoverNewSources(days);

        res.json({
            success: true,
            message: `发现完成，创建了 ${recommendations.length} 条新推荐`,
            count: recommendations.length,
            data: recommendations
        });
    } catch (error) {
        console.error('Error discovering sources:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sources/update-rankings
 * 手动触发排名更新
 */
router.post('/update-rankings', async (req, res) => {
    try {
        const month = req.body.month || null;
        const result = await sourceRanker.updateAllRankings(month);

        res.json({
            success: true,
            message: '排名更新完成',
            data: result
        });
    } catch (error) {
        console.error('Error updating rankings:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/sources/update-person-metrics
 * 手动触发人物热度更新
 */
router.post('/update-person-metrics', async (req, res) => {
    try {
        const result = await sourceRanker.updateAllPersonMetrics();

        res.json({
            success: true,
            message: '人物热度更新完成',
            data: result
        });
    } catch (error) {
        console.error('Error updating person metrics:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
