/**
 * 微信公众号 API 路由
 */

const express = require('express');
const router = express.Router();
const wechatPublisher = require('../services/wechat-publisher');

/**
 * 检查微信配置状态
 * GET /api/wechat/status
 */
router.get('/status', async (req, res) => {
    try {
        const hasConfig = !!(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET);

        if (!hasConfig) {
            return res.json({
                success: false,
                configured: false,
                message: '微信 AppID 或 AppSecret 未配置'
            });
        }

        // 尝试获取 access_token 验证配置
        try {
            await wechatPublisher.getAccessToken();
            res.json({
                success: true,
                configured: true,
                message: '微信配置正常'
            });
        } catch (error) {
            res.json({
                success: false,
                configured: true,
                message: `配置有误: ${error.message}`
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 同步今日内容到草稿箱
 * POST /api/wechat/sync-today
 */
router.post('/sync-today', async (req, res) => {
    try {
        console.log('📤 开始同步今日内容到微信草稿箱...');
        const result = await wechatPublisher.syncTodayToDraft();
        res.json(result);
    } catch (error) {
        console.error('❌ 同步失败:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 获取草稿列表
 * GET /api/wechat/drafts
 */
router.get('/drafts', async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const count = parseInt(req.query.count) || 20;

        const result = await wechatPublisher.getDraftList(offset, count);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 发布草稿
 * POST /api/wechat/publish/:mediaId
 */
router.post('/publish/:mediaId', async (req, res) => {
    try {
        const { mediaId } = req.params;

        if (!mediaId) {
            return res.status(400).json({
                success: false,
                error: '缺少 mediaId 参数'
            });
        }

        const result = await wechatPublisher.publishDraft(mediaId);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 创建单篇文章草稿
 * POST /api/wechat/draft
 * Body: { title, author, content, source_url }
 */
router.post('/draft', async (req, res) => {
    try {
        const { title, author, content, source_url } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: '缺少 title 或 content'
            });
        }

        const article = {
            title,
            author: author || '思想雷达',
            content: `<p>${content.replace(/\n/g, '</p><p>')}</p>`,
            content_source_url: source_url || '',
            digest: content.substring(0, 100) + '...'
        };

        const mediaId = await wechatPublisher.createDraft(article);
        res.json({
            success: true,
            mediaId
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 获取素材列表（用于获取 thumb_media_id）
 * GET /api/wechat/materials
 */
router.get('/materials', async (req, res) => {
    try {
        const type = req.query.type || 'image';
        const offset = parseInt(req.query.offset) || 0;
        const count = parseInt(req.query.count) || 20;

        const result = await wechatPublisher.getMaterialList(type, offset, count);
        res.json({
            success: true,
            ...result,
            hint: '使用返回的 media_id 设置 WECHAT_DEFAULT_THUMB_ID 环境变量'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 获取详细配置状态
 * GET /api/wechat/config
 */
router.get('/config', async (req, res) => {
    try {
        const config = wechatPublisher.getConfig();
        res.json({
            success: true,
            config,
            message: config.hasDefaultThumb
                ? '配置完整，可以同步内容'
                : '缺少默认封面图，请先上传图片素材'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
