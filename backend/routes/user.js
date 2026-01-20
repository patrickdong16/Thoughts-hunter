const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * POST /api/user/like
 * 收藏/取消收藏
 * Body: { user_id, item_id, liked }
 */
router.post('/like', async (req, res) => {
    try {
        const { user_id, item_id, liked } = req.body;

        if (!user_id || !item_id || typeof liked !== 'boolean') {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: user_id, item_id, liked'
            });
        }

        // 检查item是否存在
        const itemCheck = await pool.query(
            'SELECT id FROM radar_items WHERE id = $1',
            [item_id]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        // 插入或更新用户行为
        const query = `
      INSERT INTO user_actions (user_id, item_id, liked)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET liked = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

        const result = await pool.query(query, [user_id, item_id, liked]);

        res.json({
            success: true,
            action: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating like:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update like status'
        });
    }
});

/**
 * POST /api/user/stance
 * 记录用户立场
 * Body: { user_id, item_id, stance }
 */
router.post('/stance', async (req, res) => {
    try {
        const { user_id, item_id, stance } = req.body;

        if (!user_id || !item_id) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: user_id, item_id'
            });
        }

        if (stance && stance !== 'A' && stance !== 'B') {
            return res.status(400).json({
                success: false,
                error: 'Stance must be "A", "B", or null'
            });
        }

        // 检查item是否存在
        const itemCheck = await pool.query(
            'SELECT id FROM radar_items WHERE id = $1',
            [item_id]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        // 插入或更新用户立场
        const query = `
      INSERT INTO user_actions (user_id, item_id, stance)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, item_id)
      DO UPDATE SET stance = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

        const result = await pool.query(query, [user_id, item_id, stance]);

        res.json({
            success: true,
            action: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating stance:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update stance'
        });
    }
});

/**
 * GET /api/user/:user_id/likes
 * 获取用户收藏列表
 */
router.get('/:user_id/likes', async (req, res) => {
    try {
        const { user_id } = req.params;

        const query = `
      SELECT 
        ri.*,
        b.domain,
        b.question as band_question,
        b.side_a as band_side_a,
        b.side_b as band_side_b,
        b.tti,
        ua.liked,
        ua.stance as user_stance,
        ua.created_at as liked_at
      FROM user_actions ua
      JOIN radar_items ri ON ua.item_id = ri.id
      JOIN bands b ON ri.freq = b.id
      WHERE ua.user_id = $1 AND ua.liked = true
      ORDER BY ua.created_at DESC
    `;

        const result = await pool.query(query, [user_id]);

        res.json({
            success: true,
            count: result.rows.length,
            items: result.rows
        });
    } catch (error) {
        console.error('Error fetching user likes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user likes'
        });
    }
});

/**
 * GET /api/user/:user_id/stances
 * 获取用户的所有立场记录
 */
router.get('/:user_id/stances', async (req, res) => {
    try {
        const { user_id } = req.params;

        const query = `
      SELECT 
        ri.*,
        b.domain,
        b.question as band_question,
        b.side_a as band_side_a,
        b.side_b as band_side_b,
        b.tti,
        ua.stance as user_stance,
        ua.created_at as stance_at
      FROM user_actions ua
      JOIN radar_items ri ON ua.item_id = ri.id
      JOIN bands b ON ri.freq = b.id
      WHERE ua.user_id = $1 AND ua.stance IS NOT NULL
      ORDER BY ua.created_at DESC
    `;

        const result = await pool.query(query, [user_id]);

        res.json({
            success: true,
            count: result.rows.length,
            items: result.rows
        });
    } catch (error) {
        console.error('Error fetching user stances:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user stances'
        });
    }
});

module.exports = router;
