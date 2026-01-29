// 草稿管理服务
// Draft Manager Service
// 处理草稿的生命周期管理

const pool = require('../config/database');
const { validateItem } = require('./content-validator');

/**
 * 获取所有草稿（带过滤）
 * @param {string} status - 状态过滤 (pending/approved/rejected)
 * @param {number} limit - 返回数量限制
 * @returns {Promise<Array>} 草稿列表
 */
const getAllDrafts = async (status = 'pending', limit = 50) => {
    try {
        let query = `
      SELECT 
        d.*,
        cs.name as source_name,
        cs.type as source_type,
        cs.domain as source_domain
      FROM drafts d
      LEFT JOIN content_sources cs ON d.source_id = cs.id
      WHERE 1=1
    `;

        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND d.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex}`;
        params.push(limit);

        const result = await pool.query(query, params);

        // 解析generated_items JSON
        const drafts = result.rows.map(draft => ({
            ...draft,
            generated_items: typeof draft.generated_items === 'string'
                ? JSON.parse(draft.generated_items)
                : draft.generated_items,
            item_count: draft.generated_items ?
                (typeof draft.generated_items === 'string'
                    ? JSON.parse(draft.generated_items).length
                    : draft.generated_items.length)
                : 0
        }));

        return drafts;
    } catch (error) {
        console.error('获取草稿列表失败:', error);
        throw error;
    }
};

/**
 * 根据ID获取单个草稿
 * @param {number} id - 草稿ID
 * @returns {Promise<Object>} 草稿详情
 */
const getDraftById = async (id) => {
    try {
        const query = `
      SELECT 
        d.*,
        cs.name as source_name,
        cs.type as source_type,
        cs.domain as source_domain
      FROM drafts d
      LEFT JOIN content_sources cs ON d.source_id = cs.id
      WHERE d.id = $1
    `;

        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        const draft = result.rows[0];
        draft.generated_items = typeof draft.generated_items === 'string'
            ? JSON.parse(draft.generated_items)
            : draft.generated_items;

        return draft;
    } catch (error) {
        console.error('获取草稿详情失败:', error);
        throw error;
    }
};

/**
 * 更新草稿内容
 * @param {number} id - 草稿ID
 * @param {Object} updates - 更新数据
 * @returns {Promise<Object>} 更新后的草稿
 */
const updateDraft = async (id, updates) => {
    try {
        const allowedFields = ['generated_items', 'notes', 'source_title'];
        const setClauses = [];
        const params = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                if (key === 'generated_items') {
                    setClauses.push(`${key} = $${paramIndex}::jsonb`);
                    params.push(JSON.stringify(value));
                } else {
                    setClauses.push(`${key} = $${paramIndex}`);
                    params.push(value);
                }
                paramIndex++;
            }
        }

        if (setClauses.length === 0) {
            throw new Error('没有有效的更新字段');
        }

        params.push(id);
        const query = `
      UPDATE drafts
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            throw new Error(`草稿 ${id} 不存在`);
        }

        const draft = result.rows[0];
        draft.generated_items = typeof draft.generated_items === 'string'
            ? JSON.parse(draft.generated_items)
            : draft.generated_items;

        return draft;
    } catch (error) {
        console.error('更新草稿失败:', error);
        throw error;
    }
};

/**
 * 批准草稿并发布到radar_items（带质检）
 * @param {number} draftId - 草稿ID
 * @param {Array} selectedIndices - 要发布的items索引数组（可选，默认全部）
 * @param {string} reviewedBy - 审核人
 * @param {Object} options - 额外选项 { skipValidation: false }
 * @returns {Promise<Object>} 创建的radar_items IDs
 */
const approveDraft = async (draftId, selectedIndices = null, reviewedBy = 'system', options = {}) => {
    const { skipValidation = false } = options;

    try {
        // 获取草稿
        const draft = await getDraftById(draftId);

        if (!draft) {
            throw new Error(`草稿 ${draftId} 不存在`);
        }

        if (draft.status === 'approved') {
            throw new Error('草稿已经被批准');
        }

        const items = draft.generated_items || [];

        if (items.length === 0) {
            throw new Error('草稿中没有可发布的内容');
        }

        // 确定要发布的items
        const itemsToPublish = selectedIndices !== null && Array.isArray(selectedIndices)
            ? selectedIndices.map(i => items[i]).filter(Boolean)
            : items;

        if (itemsToPublish.length === 0) {
            throw new Error('没有选择要发布的内容');
        }

        // 🔍 质检步骤：验证每个 item
        const validatedItems = [];
        const rejectedItems = [];

        for (const item of itemsToPublish) {
            if (skipValidation) {
                validatedItems.push({ item, validation: { passed: true, skipped: true } });
            } else {
                const validation = validateItem(item, { isGeneration: false });
                if (validation.passed && !validation.blocked) {
                    validatedItems.push({ item, validation });
                } else {
                    rejectedItems.push({
                        item,
                        validation,
                        reason: validation.errors.map(e => e.message).join('; ')
                    });
                }
            }
        }

        console.log(`📋 质检结果: ${validatedItems.length} 通过, ${rejectedItems.length} 未通过`);

        if (validatedItems.length === 0) {
            throw new Error(`所有内容未通过质检: ${rejectedItems.map(r => r.reason).join('; ')}`);
        }

        // 发布通过质检的items到radar_items表
        const createdIds = [];

        for (const { item } of validatedItems) {
            try {
                const insertQuery = `
          INSERT INTO radar_items (
            date, freq, stance, title, author_name, author_avatar,
            author_bio, source, content, tension_q, tension_a, tension_b, keywords
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (date, freq) DO NOTHING
          RETURNING id
        `;

                const result = await pool.query(insertQuery, [
                    item.date || new Date().toISOString().split('T')[0],
                    item.freq,
                    item.stance,
                    item.title,
                    item.author_name,
                    item.author_avatar,
                    item.author_bio || '',
                    item.source,
                    item.content,
                    item.tension_q || '',
                    item.tension_a || '',
                    item.tension_b || '',
                    item.keywords || []
                ]);

                if (result.rows.length > 0) {
                    createdIds.push(result.rows[0].id);
                }
            } catch (itemError) {
                console.error(`发布item失败 (${item.freq}):`, itemError.message);
                // 继续处理其他items
            }
        }

        // 更新草稿状态
        await pool.query(
            `UPDATE drafts 
       SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1
       WHERE id = $2`,
            [reviewedBy, draftId]
        );

        console.log(`✓ 草稿 ${draftId} 已批准，发布了 ${createdIds.length} 个条目`);

        return {
            draftId,
            publishedCount: createdIds.length,
            radarItemIds: createdIds,
            validationSummary: {
                passed: validatedItems.length,
                rejected: rejectedItems.length,
                rejectedItems: rejectedItems.map(r => ({
                    title: r.item.title,
                    freq: r.item.freq,
                    reason: r.reason
                }))
            }
        };
    } catch (error) {
        console.error('批准草稿失败:', error);
        throw error;
    }
};

/**
 * 拒绝草稿
 * @param {number} draftId - 草稿ID
 * @param {string} reason - 拒绝原因
 * @param {string} reviewedBy - 审核人
 * @returns {Promise<void>}
 */
const rejectDraft = async (draftId, reason = '', reviewedBy = 'system') => {
    try {
        const query = `
      UPDATE drafts
      SET status = 'rejected', 
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = $1,
          notes = COALESCE(notes || E'\n', '') || $2
      WHERE id = $3
    `;

        await pool.query(query, [reviewedBy, `拒绝原因: ${reason}`, draftId]);
        console.log(`✓ 草稿 ${draftId} 已拒绝`);
    } catch (error) {
        console.error('拒绝草稿失败:', error);
        throw error;
    }
};

/**
 * 删除草稿
 * @param {number} draftId - 草稿ID
 * @returns {Promise<void>}
 */
const deleteDraft = async (draftId) => {
    try {
        await pool.query('DELETE FROM drafts WHERE id = $1', [draftId]);
        console.log(`✓ 草稿 ${draftId} 已删除`);
    } catch (error) {
        console.error('删除草稿失败:', error);
        throw error;
    }
};

/**
 * 获取草稿统计信息
 * @returns {Promise<Object>} 统计数据
 */
const getDraftStats = async () => {
    try {
        const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_count
      FROM drafts
    `;

        const statsResult = await pool.query(statsQuery);
        const stats = statsResult.rows[0];

        // 获取频段覆盖情况（从pending drafts）
        const bandCoverageQuery = `
      SELECT 
        jsonb_array_elements(generated_items)->>'freq' as freq,
        COUNT(*) as count
      FROM drafts
      WHERE status = 'pending'
      GROUP BY freq
      ORDER BY count DESC
    `;

        const bandResult = await pool.query(bandCoverageQuery);
        const bandCoverage = bandResult.rows;

        return {
            ...stats,
            pending_count: parseInt(stats.pending_count),
            approved_count: parseInt(stats.approved_count),
            rejected_count: parseInt(stats.rejected_count),
            total_count: parseInt(stats.total_count),
            recent_count: parseInt(stats.recent_count),
            band_coverage: bandCoverage
        };
    } catch (error) {
        console.error('获取草稿统计失败:', error);
        throw error;
    }
};

module.exports = {
    getAllDrafts,
    getDraftById,
    updateDraft,
    approveDraft,
    rejectDraft,
    deleteDraft,
    getDraftStats
};
