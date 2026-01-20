// 内容源排名算法服务
// Source Ranker Service
// 基于性能指标的自动排名和评分系统

const pool = require('../config/database');

/**
 * 权重配置
 * 用于计算内容源的综合得分
 */
const WEIGHTS = {
    adoptionRate: 0.35,      // 采纳率最重要
    qualityScore: 0.30,      // 质量评分
    contentFrequency: 0.15,  // 内容频率
    engagement: 0.20         // 用户互动
};

/**
 * 计算单个内容源的排名分数
 * @param {number} sourceId - 内容源ID
 * @param {string} month - 统计月份 (YYYY-MM-DD格式)
 * @returns {Promise<number>} 排名分数 (0-100)
 */
const calculateSourceRank = async (sourceId, month) => {
    try {
        // 获取源的性能指标
        const metricsQuery = `
      SELECT *
      FROM source_metrics
      WHERE source_id = $1 AND month = $2
    `;
        const result = await pool.query(metricsQuery, [sourceId, month]);

        if (result.rows.length === 0) {
            // 如果没有指标数据，返回默认分数
            return 50;
        }

        const metrics = result.rows[0];

        // 归一化各项指标到 0-100
        const adoptionScore = metrics.adoption_rate || 0;  // 已经是百分比
        const qualityScore = (metrics.avg_quality_score || 0) * 20;  // 1-5 -> 20-100
        const frequencyScore = Math.min((metrics.new_content_count || 0) / 10, 1) * 100;  // cap at 10
        const engagementScore = metrics.engagement_score || 0;  // 假设已归一化到0-100

        // 加权计算综合得分
        const totalScore =
            adoptionScore * WEIGHTS.adoptionRate +
            qualityScore * WEIGHTS.qualityScore +
            frequencyScore * WEIGHTS.contentFrequency +
            engagementScore * WEIGHTS.engagement;

        return Math.round(totalScore);
    } catch (error) {
        console.error('Error calculating source rank:', error);
        throw error;
    }
};

/**
 * 计算人物热度分数
 * @param {string} personName - 人物姓名
 * @param {number} days - 统计天数范围
 * @returns {Promise<number>} 热度分数
 */
const calculatePersonTrending = async (personName, days = 30) => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // 从radar_items中统计提及次数
        const mentionQuery = `
      SELECT COUNT(*) as mention_count
      FROM radar_items
      WHERE date >= $1
        AND (content ILIKE $2 OR author_name ILIKE $2)
    `;
        const mentionResult = await pool.query(mentionQuery, [
            cutoffDate.toISOString().split('T')[0],
            `%${personName}%`
        ]);
        const mentions = parseInt(mentionResult.rows[0]?.mention_count || 0);

        // 统计作为作者的新内容数
        const appearanceQuery = `
      SELECT COUNT(*) as appearance_count
      FROM radar_items
      WHERE date >= $1 AND author_name = $2
    `;
        const appearanceResult = await pool.query(appearanceQuery, [
            cutoffDate.toISOString().split('T')[0],
            personName
        ]);
        const newAppearances = parseInt(appearanceResult.rows[0]?.appearance_count || 0);

        // 计算热度分数
        // 新访谈权重最高，其次是内容被采纳，最后是被提及
        const trendingScore =
            newAppearances * 30 +
            mentions * 5;

        return trendingScore;
    } catch (error) {
        console.error('Error calculating person trending:', error);
        throw error;
    }
};

/**
 * 更新所有内容源的排名
 * 通常作为月度批处理任务运行
 * @param {string} month - 要更新的月份 (可选，默认为当前月)
 * @returns {Promise<Object>} 更新结果统计
 */
const updateAllRankings = async (month = null) => {
    try {
        // 如果没有指定月份，使用当前月的第一天
        if (!month) {
            const now = new Date();
            month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        }

        console.log(`开始更新 ${month} 的内容源排名...`);

        // 获取所有活跃的内容源
        const sourcesQuery = `
      SELECT id FROM content_sources WHERE status = 'active'
    `;
        const sourcesResult = await pool.query(sourcesQuery);
        const sources = sourcesResult.rows;

        let updated = 0;
        let failed = 0;

        for (const source of sources) {
            try {
                // 计算排名
                const rank = await calculateSourceRank(source.id, month);

                // 更新或插入source_metrics记录
                const upsertQuery = `
          INSERT INTO source_metrics (source_id, month, calculated_rank)
          VALUES ($1, $2, $3)
          ON CONFLICT (source_id, month)
          DO UPDATE SET calculated_rank = $3, updated_at = CURRENT_TIMESTAMP
        `;
                await pool.query(upsertQuery, [source.id, month, rank]);
                updated++;
            } catch (error) {
                console.error(`更新源 ${source.id} 失败:`, error);
                failed++;
            }
        }

        console.log(`排名更新完成: ${updated} 成功, ${failed} 失败`);
        return { updated, failed, month };
    } catch (error) {
        console.error('Error updating all rankings:', error);
        throw error;
    }
};

/**
 * 更新所有人物的热度分数
 * @returns {Promise<Object>} 更新结果统计
 */
const updateAllPersonMetrics = async () => {
    try {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

        console.log(`开始更新 ${month} 的人物热度...`);

        // 获取所有人物类型的内容源
        const peopleQuery = `
      SELECT id, name FROM content_sources WHERE type = 'person' AND status = 'active'
    `;
        const peopleResult = await pool.query(peopleQuery);
        const people = peopleResult.rows;

        let updated = 0;
        let failed = 0;

        for (const person of people) {
            try {
                // 计算热度分数
                const trendingScore = await calculatePersonTrending(person.name, 30);

                // 获取提及和出现统计
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - 30);

                const statsQuery = `
          SELECT 
            COUNT(*) FILTER (WHERE content ILIKE $1 OR author_name ILIKE $1) as mentions,
            COUNT(*) FILTER (WHERE author_name = $2) as appearances
          FROM radar_items
          WHERE date >= $3
        `;
                const statsResult = await pool.query(statsQuery, [
                    `%${person.name}%`,
                    person.name,
                    cutoffDate.toISOString().split('T')[0]
                ]);

                const stats = statsResult.rows[0];

                // 更新或插入person_metrics记录
                const upsertQuery = `
          INSERT INTO person_metrics (person_name, month, mention_count, new_appearance_count, trending_score)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (person_name, month)
          DO UPDATE SET 
            mention_count = $3,
            new_appearance_count = $4,
            trending_score = $5,
            updated_at = CURRENT_TIMESTAMP
        `;
                await pool.query(upsertQuery, [
                    person.name,
                    month,
                    parseInt(stats.mentions || 0),
                    parseInt(stats.appearances || 0),
                    trendingScore
                ]);
                updated++;
            } catch (error) {
                console.error(`更新人物 ${person.name} 失败:`, error);
                failed++;
            }
        }

        console.log(`人物热度更新完成: ${updated} 成功, ${failed} 失败`);
        return { updated, failed, month };
    } catch (error) {
        console.error('Error updating person metrics:', error);
        throw error;
    }
};

/**
 * 计算并更新采纳率
 * 基于实际的radar_items数据
 * @param {number} sourceId - 内容源ID
 * @param {string} month - 月份
 * @returns {Promise<void>}
 */
const updateAdoptionRate = async (sourceId, month) => {
    try {
        // 获取源信息
        const sourceQuery = `SELECT name, type FROM content_sources WHERE id = $1`;
        const sourceResult = await pool.query(sourceQuery, [sourceId]);
        if (sourceResult.rows.length === 0) return;

        const source = sourceResult.rows[0];

        // 根据类型确定匹配策略
        let adoptedCount = 0;
        let totalCount = 0;

        if (source.type === 'person') {
            // 统计该人物作为作者的内容数
            const query = `
        SELECT COUNT(*) as count
        FROM radar_items
        WHERE author_name = $1
          AND date >= $2
          AND date < $2::date + INTERVAL '1 month'
      `;
            const result = await pool.query(query, [source.name, month]);
            adoptedCount = parseInt(result.rows[0]?.count || 0);
            totalCount = adoptedCount;  // 对于人物，采纳率=100%如果有内容
        } else if (source.type === 'channel' || source.type === 'publication') {
            // 统计source字段中提到该来源的内容
            const query = `
        SELECT COUNT(*) as count
        FROM radar_items
        WHERE source ILIKE $1
          AND date >= $2
          AND date < $2::date + INTERVAL '1 month'
      `;
            const result = await pool.query(query, [`%${source.name}%`, month]);
            adoptedCount = parseInt(result.rows[0]?.count || 0);
            totalCount = adoptedCount;  // 简化处理
        }

        const adoptionRate = totalCount > 0 ? (adoptedCount / totalCount * 100) : 0;

        // 更新metrics
        const updateQuery = `
      INSERT INTO source_metrics (source_id, month, new_content_count, adopted_count, adoption_rate)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (source_id, month)
      DO UPDATE SET
        new_content_count = $3,
        adopted_count = $4,
        adoption_rate = $5,
        updated_at = CURRENT_TIMESTAMP
    `;
        await pool.query(updateQuery, [sourceId, month, totalCount, adoptedCount, adoptionRate]);
    } catch (error) {
        console.error('Error updating adoption rate:', error);
        throw error;
    }
};

module.exports = {
    calculateSourceRank,
    calculatePersonTrending,
    updateAllRankings,
    updateAllPersonMetrics,
    updateAdoptionRate,
    WEIGHTS
};
