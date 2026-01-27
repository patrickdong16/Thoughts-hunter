const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { getRulesForDate, canAddContent, canAddToFreq } = require('../config/day-rules');
const { validateContentLength, MIN_CONTENT_LENGTH } = require('../utils/char-count');
const { normalizeUrl } = require('../utils/url-normalizer');

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

        // 获取主题日信息（供前端显示banner）
        const dayRules = getRulesForDate(beijingDate);
        const themeDay = dayRules.isThemeDay ? {
            event: dayRules.event,
            eventEn: dayRules.eventEn,
            focus: dayRules.focus
        } : null;

        res.json({
            success: true,
            date: beijingDate,
            count: result.rows.length,
            items: result.rows,
            themeDay: themeDay
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
 * GET /api/radar/day-info/:date
 * 获取指定日期的类型和规则信息
 */
router.get('/day-info/:date', async (req, res) => {
    try {
        const { date } = req.params;

        // 验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const dayRules = getRulesForDate(date);

        // 查询当日已有内容统计
        const statsResult = await pool.query(`
            SELECT freq, COUNT(*) as count 
            FROM radar_items WHERE date = $1 
            GROUP BY freq
        `, [date]);

        const totalCount = statsResult.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
        const byFreq = Object.fromEntries(statsResult.rows.map(r => [r.freq, parseInt(r.count)]));

        res.json({
            success: true,
            date,
            isThemeDay: dayRules.isThemeDay,
            event: dayRules.event,
            eventEn: dayRules.eventEn,
            rules: dayRules.rules,
            focus: dayRules.focus,
            currentStats: {
                total: totalCount,
                remaining: dayRules.rules.maxItems - totalCount,
                byFreq
            }
        });
    } catch (error) {
        console.error('Error fetching day info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch day info'
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
            author_bio, source, content, tension_q, tension_a, tension_b, keywords,
            source_url, video_id
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

        // 验证内容长度 - 统一计数标准
        // 使用 countVisibleChars() 计算可见字符数，排除换行和多余空格
        const contentValidation = validateContentLength(content);
        if (!contentValidation.valid) {
            return res.status(400).json({
                success: false,
                error: `内容不足${MIN_CONTENT_LENGTH}字（当前${contentValidation.count}字，还需${contentValidation.shortage}字）`
            });
        }

        // ========== 主题日/普通日规则验证 ==========
        const dayRules = getRulesForDate(date);

        // 检查当日总数限制
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM radar_items WHERE date = $1', [date]
        );
        const currentCount = parseInt(countResult.rows[0].count);
        const contentCheck = canAddContent(date, currentCount);
        if (!contentCheck.canAdd) {
            return res.status(409).json({
                success: false,
                error: contentCheck.reason,
                isThemeDay: dayRules.isThemeDay
            });
        }

        // 检查频段限制（仅普通日）
        const freqResult = await pool.query(
            'SELECT COUNT(*) FROM radar_items WHERE date = $1 AND freq = $2', [date, freq]
        );
        const freqCount = parseInt(freqResult.rows[0].count);
        const freqCheck = canAddToFreq(date, freq, freqCount);
        if (!freqCheck.canAdd) {
            return res.status(409).json({
                success: false,
                error: freqCheck.reason,
                isThemeDay: dayRules.isThemeDay
            });
        }

        // ========== 零重复规则：source_url 全局唯一 ==========
        if (source_url) {
            const normalizedUrl = normalizeUrl(source_url);
            const duplicateCheck = await pool.query(
                'SELECT id, date, title FROM radar_items WHERE source_url = $1',
                [normalizedUrl]
            );
            if (duplicateCheck.rows.length > 0) {
                const existing = duplicateCheck.rows[0];
                return res.status(409).json({
                    success: false,
                    error: `内容已存在（ID: ${existing.id}, 日期: ${existing.date}, 标题: ${existing.title.substring(0, 30)}...）`,
                    existingItem: existing
                });
            }
            // 存储标准化后的 URL
            req.body.source_url = normalizedUrl;
        }

        const query = `
            INSERT INTO radar_items (
                date, freq, stance, title, author_name, author_avatar,
                author_bio, source, source_url, content, tension_q, tension_a, tension_b, keywords, video_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;

        const result = await pool.query(query, [
            date, freq, stance.toUpperCase(), title, author_name, author_avatar || '',
            author_bio || '', source || '', req.body.source_url || null, content, tension_q || '', tension_a || '',
            tension_b || '', keywords || [], video_id || null
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

        // 验证内容长度 - 统一计数标准
        if (content) {
            const contentValidation = validateContentLength(content);
            if (!contentValidation.valid) {
                return res.status(400).json({
                    success: false,
                    error: `内容不足${MIN_CONTENT_LENGTH}字（当前${contentValidation.count}字，还需${contentValidation.shortage}字）`
                });
            }
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
 * DELETE /api/radar/by-date/:date
 * 删除指定日期的所有雷达条目（运维用）
 */
router.delete('/by-date/:date', async (req, res) => {
    try {
        const { date } = req.params;

        // 验证日期格式
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const result = await pool.query(
            'DELETE FROM radar_items WHERE date = $1 RETURNING id',
            [date]
        );

        console.log(`🗑️ 删除 ${date} 的 ${result.rowCount} 条内容`);

        res.json({
            success: true,
            message: `Deleted ${result.rowCount} items for ${date}`,
            date: date,
            deletedCount: result.rowCount
        });
    } catch (error) {
        console.error('Error bulk deleting radar items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete radar items'
        });
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
