// 推送通知 API 路由
// Push Notification API Routes

const express = require('express');
const router = express.Router();
const pushService = require('../services/push-service');
const pool = require('../config/database');

/**
 * POST /api/push/register
 * 注册推送令牌
 */
router.post('/register', async (req, res) => {
    try {
        const { token, user_id, platform, device_name } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: '缺少推送令牌'
            });
        }

        const result = await pushService.registerToken(
            token,
            user_id || null,
            platform || 'ios',
            device_name || null
        );

        res.json({
            success: true,
            message: '推送令牌注册成功',
            data: {
                id: result.id,
                token: result.token.substring(0, 30) + '...',
                platform: result.platform
            }
        });
    } catch (error) {
        console.error('注册推送令牌失败:', error);

        if (error.message === '无效的 Expo Push Token') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: '注册推送令牌失败'
        });
    }
});

/**
 * DELETE /api/push/unregister
 * 注销推送令牌
 */
router.delete('/unregister', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: '缺少推送令牌'
            });
        }

        await pushService.markTokenInactive(token);

        res.json({
            success: true,
            message: '推送令牌已注销'
        });
    } catch (error) {
        console.error('注销推送令牌失败:', error);
        res.status(500).json({
            success: false,
            error: '注销推送令牌失败'
        });
    }
});

/**
 * POST /api/push/send-daily
 * 发送每日更新推送（内部使用，由 GitHub Actions 调用）
 */
router.post('/send-daily', async (req, res) => {
    try {
        // 获取今日内容数量
        const beijingDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });
        const countResult = await pool.query(
            'SELECT COUNT(*) as count FROM radar_items WHERE date = $1',
            [beijingDate]
        );
        const itemCount = parseInt(countResult.rows[0].count);

        const result = await pushService.sendDailyUpdateNotification(itemCount);

        res.json({
            success: true,
            message: '每日推送已发送',
            data: result
        });
    } catch (error) {
        console.error('发送每日推送失败:', error);
        res.status(500).json({
            success: false,
            error: '发送每日推送失败'
        });
    }
});

/**
 * POST /api/push/send
 * 发送自定义推送（管理员使用）
 */
router.post('/send', async (req, res) => {
    try {
        const { title, body, data } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                error: '缺少标题或正文'
            });
        }

        const result = await pushService.sendToAllDevices({
            title,
            body,
            data: data || {}
        });

        res.json({
            success: true,
            message: '推送已发送',
            data: result
        });
    } catch (error) {
        console.error('发送推送失败:', error);
        res.status(500).json({
            success: false,
            error: '发送推送失败'
        });
    }
});

/**
 * GET /api/push/stats
 * 获取推送统计信息
 */
router.get('/stats', async (req, res) => {
    try {
        // 活跃令牌数
        const tokensResult = await pool.query(
            'SELECT COUNT(*) as count, platform FROM push_tokens WHERE is_active = true GROUP BY platform'
        );

        // 最近推送记录
        const logsResult = await pool.query(
            'SELECT * FROM push_log ORDER BY sent_at DESC LIMIT 10'
        );

        res.json({
            success: true,
            data: {
                activeTokens: tokensResult.rows,
                recentPushes: logsResult.rows
            }
        });
    } catch (error) {
        console.error('获取推送统计失败:', error);
        res.status(500).json({
            success: false,
            error: '获取推送统计失败'
        });
    }
});

module.exports = router;
