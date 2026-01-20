// 内容源管理服务
// Content Source Manager Service
// 提供内容源的CRUD操作和查询功能

const pool = require('../config/database');

/**
 * 获取所有内容源（带过滤）
 * @param {Object} filters - 过滤条件 { domain, type, status }
 * @returns {Promise<Array>} 内容源列表
 */
const getAllSources = async (filters = {}) => {
    try {
        let query = 'SELECT * FROM content_sources WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (filters.domain) {
            query += ` AND domain = $${paramIndex}`;
            params.push(filters.domain);
            paramIndex++;
        }

        if (filters.type) {
            query += ` AND type = $${paramIndex}`;
            params.push(filters.type);
            paramIndex++;
        }

        if (filters.status) {
            query += ` AND status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        query += ' ORDER BY priority_rank ASC, name ASC';

        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Error fetching sources:', error);
        throw error;
    }
};

/**
 * 根据ID获取单个内容源
 * @param {number} id - 内容源ID
 * @returns {Promise<Object|null>} 内容源详情
 */
const getSourceById = async (id) => {
    try {
        const query = 'SELECT * FROM content_sources WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching source by ID:', error);
        throw error;
    }
};

/**
 * 创建新内容源
 * @param {Object} data - 内容源数据
 * @returns {Promise<Object>} 创建的内容源
 */
const createSource = async (data) => {
    try {
        const { type, name, url, domain, description, priority_rank = 100, status = 'active' } = data;

        // 验证必填字段
        if (!type || !name || !domain) {
            throw new Error('缺少必填字段: type, name, domain');
        }

        // 验证类型和状态
        const validTypes = ['channel', 'person', 'publication'];
        const validDomains = ['T', 'P', 'Φ', 'H', 'F', 'R'];
        const validStatuses = ['active', 'paused', 'retired'];

        if (!validTypes.includes(type)) {
            throw new Error(`无效的类型: ${type}`);
        }
        if (!validDomains.includes(domain)) {
            throw new Error(`无效的领域: ${domain}`);
        }
        if (!validStatuses.includes(status)) {
            throw new Error(`无效的状态: ${status}`);
        }

        const query = `
      INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

        const result = await pool.query(query, [type, name, url, domain, description, priority_rank, status]);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating source:', error);
        throw error;
    }
};

/**
 * 更新内容源
 * @param {number} id - 内容源ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的内容源
 */
const updateSource = async (id, data) => {
    try {
        const allowedFields = ['name', 'url', 'domain', 'description', 'priority_rank', 'status'];
        const updates = [];
        const params = [];
        let paramIndex = 1;

        // 构建动态更新语句
        for (const [key, value] of Object.entries(data)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updates.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            throw new Error('没有有效的更新字段');
        }

        params.push(id);
        const query = `
      UPDATE content_sources
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            throw new Error(`找不到ID为 ${id} 的内容源`);
        }
        return result.rows[0];
    } catch (error) {
        console.error('Error updating source:', error);
        throw error;
    }
};

/**
 * 归档内容源（软删除）
 * @param {number} id - 内容源ID
 * @returns {Promise<Object>} 更新后的内容源
 */
const archiveSource = async (id) => {
    try {
        return await updateSource(id, { status: 'retired' });
    } catch (error) {
        console.error('Error archiving source:', error);
        throw error;
    }
};

/**
 * 获取内容源的性能指标
 * @param {number} sourceId - 内容源ID
 * @param {number} months - 查询月数（默认6个月）
 * @returns {Promise<Array>} 性能指标列表
 */
const getSourceMetrics = async (sourceId, months = 6) => {
    try {
        const query = `
      SELECT *
      FROM source_metrics
      WHERE source_id = $1
      ORDER BY month DESC
      LIMIT $2
    `;
        const result = await pool.query(query, [sourceId, months]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching source metrics:', error);
        throw error;
    }
};

/**
 * 获取所有来源的当前排名（按领域分组）
 * @returns {Promise<Object>} 按领域分组的排名
 */
const getSourceRankings = async () => {
    try {
        const query = `
      SELECT 
        cs.id,
        cs.name,
        cs.type,
        cs.domain,
        cs.priority_rank,
        sm.calculated_rank,
        sm.adoption_rate,
        sm.avg_quality_score,
        sm.month
      FROM content_sources cs
      LEFT JOIN LATERAL (
        SELECT *
        FROM source_metrics
        WHERE source_id = cs.id
        ORDER BY month DESC
        LIMIT 1
      ) sm ON true
      WHERE cs.status = 'active'
      ORDER BY cs.domain, COALESCE(sm.calculated_rank, cs.priority_rank) ASC
    `;
        const result = await pool.query(query);

        // 按领域分组
        const rankings = {};
        result.rows.forEach(row => {
            if (!rankings[row.domain]) {
                rankings[row.domain] = [];
            }
            rankings[row.domain].push(row);
        });

        return rankings;
    } catch (error) {
        console.error('Error fetching source rankings:', error);
        throw error;
    }
};

/**
 * 获取热门人物（按热度分数排序）
 * @param {number} days - 统计天数范围
 * @returns {Promise<Array>} 热门人物列表
 */
const getTrendingPeople = async (days = 30) => {
    try {
        const query = `
      SELECT 
        pm.person_name,
        pm.trending_score,
        pm.new_appearance_count,
        pm.mention_count,
        pm.content_adopted,
        cs.id as source_id,
        cs.url
      FROM person_metrics pm
      LEFT JOIN content_sources cs ON cs.name = pm.person_name AND cs.type = 'person'
      WHERE pm.month >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY pm.trending_score DESC
      LIMIT 20
    `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching trending people:', error);
        throw error;
    }
};

module.exports = {
    getAllSources,
    getSourceById,
    createSource,
    updateSource,
    archiveSource,
    getSourceMetrics,
    getSourceRankings,
    getTrendingPeople
};
