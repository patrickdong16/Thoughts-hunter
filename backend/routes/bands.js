const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * GET /api/bands
 * 获取所有频段及其TTI值
 */
router.get('/', async (req, res) => {
    try {
        const query = `
      SELECT 
        id,
        domain,
        question,
        side_a,
        side_b,
        tti
      FROM bands
      ORDER BY 
        CASE domain
          WHEN 'tech' THEN 1
          WHEN 'politics' THEN 2
          WHEN 'history' THEN 3
          WHEN 'philosophy' THEN 4
          WHEN 'religion' THEN 5
          WHEN 'finance' THEN 6
        END,
        id
    `;

        const result = await pool.query(query);

        // 按领域分组
        const grouped = result.rows.reduce((acc, band) => {
            if (!acc[band.domain]) {
                acc[band.domain] = [];
            }
            acc[band.domain].push(band);
            return acc;
        }, {});

        res.json({
            success: true,
            count: result.rows.length,
            bands: result.rows,
            grouped: grouped
        });
    } catch (error) {
        console.error('Error fetching bands:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch bands'
        });
    }
});

/**
 * GET /api/bands/:id
 * 获取单个频段详情
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
      SELECT 
        id,
        domain,
        question,
        side_a,
        side_b,
        tti
      FROM bands
      WHERE id = $1
    `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Band not found'
            });
        }

        res.json({
            success: true,
            band: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching band:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch band'
        });
    }
});

/**
 * PUT /api/bands/:id/tti
 * 更新频段的TTI值（CMS使用）
 */
router.put('/:id/tti', async (req, res) => {
    try {
        const { id } = req.params;
        const { tti } = req.body;

        // 验证TTI值
        if (typeof tti !== 'number' || tti < 0 || tti > 100) {
            return res.status(400).json({
                success: false,
                error: 'TTI must be a number between 0 and 100'
            });
        }

        const query = `
            UPDATE bands 
            SET tti = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [tti, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Band not found'
            });
        }

        res.json({
            success: true,
            band: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating band TTI:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update band TTI'
        });
    }
});

module.exports = router;
