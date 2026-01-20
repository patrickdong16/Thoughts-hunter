// 内容源自动发现服务
// Source Discovery Service
// 通过分析已采纳内容自动发现新的高质量来源

const pool = require('../config/database');

/**
 * 从文本中提取人名和机构名
 * 简化版：基于关键词和大写字母模式
 * @param {string} text - 要分析的文本
 * @returns {Array} 提取的名称列表
 */
const extractMentions = (text) => {
    const mentions = [];

    // 常见的引用模式
    const patterns = [
        /according to ([A-Z][a-z]+ [A-Z][a-z]+)/g,  // "according to John Smith"
        /([A-Z][a-z]+ [A-Z][a-z]+) (argues|suggests|believes|states|says)/g,  // "John Smith argues"
        /([A-Z][a-z]+ [A-Z][a-z]+), (a|an) ([^,]+),/g,  // "John Smith, a professor,"
        /as ([A-Z][a-z]+ [A-Z][a-z]+) (writes|explains|notes)/g,  // "as John Smith writes"
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const name = match[1];
            if (name && name.length > 3 && !mentions.includes(name)) {
                mentions.push(name);
            }
        }
    }

    return mentions;
};

/**
 * 检查名称是否已被追踪
 * @param {string} name - 名称
 * @param {string} type - 类型 (person/channel/publication)
 * @returns {Promise<boolean>} 是否已追踪
 */
const isTracked = async (name, type = 'person') => {
    try {
        const query = `
      SELECT COUNT(*) as count
      FROM content_sources
      WHERE name ILIKE $1 AND type = $2
    `;
        const result = await pool.query(query, [name, type]);
        return parseInt(result.rows[0]?.count || 0) > 0;
    } catch (error) {
        console.error('Error checking if tracked:', error);
        return false;
    }
};

/**
 * 检查推荐是否已存在
 * @param {string} name - 名称
 * @param {string} type - 类型
 * @returns {Promise<boolean>} 是否已推荐
 */
const isRecommended = async (name, type) => {
    try {
        const query = `
      SELECT COUNT(*) as count
      FROM source_recommendations
      WHERE name ILIKE $1 AND source_type = $2 AND status = 'pending'
    `;
        const result = await pool.query(query, [name, type]);
        return parseInt(result.rows[0]?.count || 0) > 0;
    } catch (error) {
        console.error('Error checking if recommended:', error);
        return false;
    }
};

/**
 * 创建新的来源推荐
 * @param {Object} recommendation - 推荐数据
 * @returns {Promise<Object>} 创建的推荐记录
 */
const createRecommendation = async (recommendation) => {
    try {
        const { source_type, name, url, reason, discovered_from } = recommendation;

        // 检查是否已存在
        if (await isTracked(name, source_type)) {
            console.log(`跳过已追踪的来源: ${name}`);
            return null;
        }

        if (await isRecommended(name, source_type)) {
            console.log(`跳过已推荐的来源: ${name}`);
            return null;
        }

        const query = `
      INSERT INTO source_recommendations (source_type, name, url, reason, discovered_from, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `;

        const result = await pool.query(query, [source_type, name, url || '', reason, discovered_from]);
        console.log(`✓ 创建新推荐: ${name} (${source_type}) - ${reason}`);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating recommendation:', error);
        return null;
    }
};

/**
 * 分析最近采纳的内容，发现新来源
 * @param {number} daysScan - 扫描最近多少天的内容
 * @returns {Promise<Array>} 创建的推荐列表
 */
const discoverNewSources = async (daysScan = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysScan);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        console.log(`\n开始扫描最近 ${daysScan} 天的内容...`);

        // 获取最近的radar_items
        const query = `
      SELECT id, title, author_name, source, content, date
      FROM radar_items
      WHERE date >= $1
      ORDER BY date DESC
    `;
        const result = await pool.query(query, [cutoffDateStr]);
        const recentItems = result.rows;

        console.log(`找到 ${recentItems.length} 条最近内容`);

        // 统计提及的人名
        const mentionCounts = {};
        const itemSources = {};

        for (const item of recentItems) {
            // 从内容中提取提及的人名
            const mentions = extractMentions(item.content);

            for (const name of mentions) {
                if (!mentionCounts[name]) {
                    mentionCounts[name] = {
                        count: 0,
                        foundIn: []
                    };
                }
                mentionCounts[name].count++;
                if (!mentionCounts[name].foundIn.includes(item.title)) {
                    mentionCounts[name].foundIn.push(item.title);
                }
            }

            // 从source字段提取来源
            if (item.source) {
                // 简单解析source字段（格式通常是 "日期 · 来源 · 说明"）
                const sourceParts = item.source.split('·').map(s => s.trim());
                if (sourceParts.length >= 2) {
                    const sourceName = sourceParts[1];
                    if (!itemSources[sourceName]) {
                        itemSources[sourceName] = {
                            count: 0,
                            foundIn: []
                        };
                    }
                    itemSources[sourceName].count++;
                    if (!itemSources[sourceName].foundIn.includes(item.title)) {
                        itemSources[sourceName].foundIn.push(item.title);
                    }
                }
            }
        }

        const recommendations = [];

        // 推荐高频提及的人物（至少被提及3次）
        console.log('\n分析人物提及...');
        for (const [name, data] of Object.entries(mentionCounts)) {
            if (data.count >= 3) {
                const rec = await createRecommendation({
                    source_type: 'person',
                    name: name,
                    url: '',
                    reason: `在最近${daysScan}天的内容中被提及${data.count}次`,
                    discovered_from: data.foundIn.slice(0, 3).join(', ')
                });
                if (rec) recommendations.push(rec);
            }
        }

        // 推荐高频出现的来源（至少出现2次）
        console.log('\n分析出版来源...');
        for (const [sourceName, data] of Object.entries(itemSources)) {
            if (data.count >= 2) {
                const rec = await createRecommendation({
                    source_type: 'publication',
                    name: sourceName,
                    url: '',
                    reason: `在最近${daysScan}天的内容中作为来源出现${data.count}次`,
                    discovered_from: data.foundIn.slice(0, 3).join(', ')
                });
                if (rec) recommendations.push(rec);
            }
        }

        console.log(`\n发现完成: 创建了 ${recommendations.length} 条新推荐`);
        return recommendations;
    } catch (error) {
        console.error('Error discovering new sources:', error);
        throw error;
    }
};

/**
 * 获取所有待审核的推荐
 * @returns {Promise<Array>} 推荐列表
 */
const getPendingRecommendations = async () => {
    try {
        const query = `
      SELECT *
      FROM source_recommendations
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error fetching pending recommendations:', error);
        throw error;
    }
};

/**
 * 批准推荐（将其添加到content_sources）
 * @param {number} recommendationId - 推荐ID
 * @param {Object} additionalData - 额外数据（domain, description等）
 * @returns {Promise<Object>} 创建的内容源
 */
const approveRecommendation = async (recommendationId, additionalData = {}) => {
    try {
        // 获取推荐详情
        const recQuery = `SELECT * FROM source_recommendations WHERE id = $1`;
        const recResult = await pool.query(recQuery, [recommendationId]);

        if (recResult.rows.length === 0) {
            throw new Error(`找不到ID为 ${recommendationId} 的推荐`);
        }

        const rec = recResult.rows[0];

        // 创建新的content_source
        const { domain = 'T', description = rec.reason, priority_rank = 100 } = additionalData;

        const createQuery = `
      INSERT INTO content_sources (type, name, url, domain, description, priority_rank, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *
    `;
        const createResult = await pool.query(createQuery, [
            rec.source_type,
            rec.name,
            rec.url,
            domain,
            description,
            priority_rank
        ]);

        // 更新推荐状态为已批准
        const updateQuery = `UPDATE source_recommendations SET status = 'approved' WHERE id = $1`;
        await pool.query(updateQuery, [recommendationId]);

        console.log(`✓ 已批准推荐: ${rec.name}`);
        return createResult.rows[0];
    } catch (error) {
        console.error('Error approving recommendation:', error);
        throw error;
    }
};

/**
 * 拒绝推荐
 * @param {number} recommendationId - 推荐ID
 * @returns {Promise<void>}
 */
const rejectRecommendation = async (recommendationId) => {
    try {
        const query = `UPDATE source_recommendations SET status = 'rejected' WHERE id = $1`;
        await pool.query(query, [recommendationId]);
        console.log(`✓ 已拒绝推荐 ID: ${recommendationId}`);
    } catch (error) {
        console.error('Error rejecting recommendation:', error);
        throw error;
    }
};

module.exports = {
    discoverNewSources,
    getPendingRecommendations,
    approveRecommendation,
    rejectRecommendation,
    createRecommendation
};
