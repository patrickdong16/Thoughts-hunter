const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/radar/today
 * 获取今日雷达内容
 */
router.get('/today', async (req, res) => {
    try {
        const userId = req.query.user_id || null;

        // 使用北京时区计算"今天"的日期
        const beijingDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' });

        const query = `
      SELECT 
        ri.*,
        b.domain,
        b.question as band_question,
        b.side_a as band_side_a,
        b.side_b as band_side_b,
        b.tti,
        ua.liked,
        ua.stance as user_stance
      FROM radar_items ri
      JOIN bands b ON ri.freq = b.id
      LEFT JOIN user_actions ua ON ri.id = ua.item_id AND ua.user_id = $1
      WHERE ri.date = $2
      ORDER BY ri.freq
    `;

        const result = await pool.query(query, [userId, beijingDate]);

        res.json({
            success: true,
            date: beijingDate,
            count: result.rows.length,
            items: result.rows
        });
    } catch (error) {
        console.error('Error fetching today radar:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch today radar'
        });
    }
});

/**
 * GET /api/radar/:date
 * 获取指定日期的雷达内容
 * 参数: date (YYYY-MM-DD)
 */
router.get('/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const userId = req.query.user_id || null;

        // 验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const query = `
      SELECT 
        ri.*,
        b.domain,
        b.question as band_question,
        b.side_a as band_side_a,
        b.side_b as band_side_b,
        b.tti,
        ua.liked,
        ua.stance as user_stance
      FROM radar_items ri
      JOIN bands b ON ri.freq = b.id
      LEFT JOIN user_actions ua ON ri.id = ua.item_id AND ua.user_id = $1
      WHERE ri.date = $2
      ORDER BY ri.freq
    `;

        const result = await pool.query(query, [userId, date]);

        res.json({
            success: true,
            date: date,
            count: result.rows.length,
            items: result.rows
        });
    } catch (error) {
        console.error('Error fetching radar by date:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch radar'
        });
    }
});

/**
 * GET /api/radar/item/:id
 * 获取单个雷达条目详情
 */
router.get('/item/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.query.user_id || null;

        const query = `
      SELECT 
        ri.*,
        b.domain,
        b.question as band_question,
        b.side_a as band_side_a,
        b.side_b as band_side_b,
        b.tti,
        ua.liked,
        ua.stance as user_stance
      FROM radar_items ri
      JOIN bands b ON ri.freq = b.id
      LEFT JOIN user_actions ua ON ri.id = ua.item_id AND ua.user_id = $1
      WHERE ri.id = $2
    `;

        const result = await pool.query(query, [userId, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        res.json({
            success: true,
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch item'
        });
    }
});

/**
 * POST /api/radar
 * 创建新的雷达条目（CMS使用）
 */
router.post('/', async (req, res) => {
    try {
        const {
            date, freq, stance, title, author_name, author_avatar,
            author_bio, source, content, tension_q, tension_a, tension_b, keywords
        } = req.body;

        // 验证必填字段
        if (!date || !freq || !stance || !title || !author_name || !content) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // 验证立场
        if (!['A', 'B'].includes(stance.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: 'Stance must be A or B'
            });
        }

        // 验证内容长度（规则：≥400字符）
        // 400个中文字符约等于一篇实质性的分析文章
        // 注：中文字符在JS中每个计为1，即使UTF-8编码为3字节
        if (content.length < 400) {
            return res.status(400).json({
                success: false,
                error: `Content must be at least 400 characters (current: ${content.length})`
            });
        }

        const query = `
            INSERT INTO radar_items (
                date, freq, stance, title, author_name, author_avatar,
                author_bio, source, content, tension_q, tension_a, tension_b, keywords
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;

        const result = await pool.query(query, [
            date, freq, stance.toUpperCase(), title, author_name, author_avatar || '',
            author_bio || '', source || '', content, tension_q || '', tension_a || '',
            tension_b || '', keywords || []
        ]);

        res.json({
            success: true,
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating radar item:', error);
        if (error.code === '23505') {
            res.status(409).json({
                success: false,
                error: 'Item already exists for this date and frequency'
            });
        } else if (error.code === '23503') {
            res.status(400).json({
                success: false,
                error: 'Invalid frequency ID'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to create radar item'
            });
        }
    }
});

/**
 * PUT /api/radar/:id
 * 更新雷达条目（CMS使用）
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            date, freq, stance, title, author_name, author_avatar,
            author_bio, source, content, tension_q, tension_a, tension_b, keywords
        } = req.body;

        // 验证立场
        if (stance && !['A', 'B'].includes(stance.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: 'Stance must be A or B'
            });
        }

        // 验证内容长度
        if (content && content.length < 500) {
            return res.status(400).json({
                success: false,
                error: `Content must be at least 500 characters (current: ${content.length})`
            });
        }

        const query = `
            UPDATE radar_items SET
                date = COALESCE($1, date),
                freq = COALESCE($2, freq),
                stance = COALESCE($3, stance),
                title = COALESCE($4, title),
                author_name = COALESCE($5, author_name),
                author_avatar = COALESCE($6, author_avatar),
                author_bio = COALESCE($7, author_bio),
                source = COALESCE($8, source),
                content = COALESCE($9, content),
                tension_q = COALESCE($10, tension_q),
                tension_a = COALESCE($11, tension_a),
                tension_b = COALESCE($12, tension_b),
                keywords = COALESCE($13, keywords),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $14
            RETURNING *
        `;

        const result = await pool.query(query, [
            date, freq, stance?.toUpperCase(), title, author_name, author_avatar,
            author_bio, source, content, tension_q, tension_a, tension_b, keywords, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        res.json({
            success: true,
            item: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating radar item:', error);
        if (error.code === '23505') {
            res.status(409).json({
                success: false,
                error: 'Item already exists for this date and frequency'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update radar item'
            });
        }
    }
});

/**
 * DELETE /api/radar/:id
 * 删除雷达条目（CMS使用）
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM radar_items WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item deleted successfully',
            id: result.rows[0].id
        });
    } catch (error) {
        console.error('Error deleting radar item:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete radar item'
        });
    }
});

/**
 * GET /api/radar/all/grouped
 * 获取所有雷达条目按日期分组（CMS使用）
 */
router.get('/all/grouped', async (req, res) => {
    try {
        const query = `
            SELECT 
                ri.*,
                b.domain,
                b.question as band_question,
                b.side_a as band_side_a,
                b.side_b as band_side_b,
                b.tti
            FROM radar_items ri
            JOIN bands b ON ri.freq = b.id
            ORDER BY ri.date DESC, ri.freq
        `;

        const result = await pool.query(query);

        // 按日期分组
        const grouped = result.rows.reduce((acc, item) => {
            const date = item.date.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {});

        res.json({
            success: true,
            total: result.rows.length,
            grouped: grouped
        });
    } catch (error) {
        console.error('Error fetching grouped items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch items'
        });
    }
});

module.exports = router;
