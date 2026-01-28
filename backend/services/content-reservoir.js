/**
 * 内容储备库服务 v1.0
 * Content Reservoir Service
 * 
 * 管理超配额的优质内容，供未来日期发布
 */

const pool = require('../config/database');

// ============================================
// 核心功能
// ============================================

/**
 * 添加内容到储备库
 * @param {Object} content - AI 分析后的完整内容对象
 * @param {Object} options - 配置选项
 * @returns {Object} 储备结果
 */
async function addToReservoir(content, options = {}) {
    const {
        freq = content.freq || 'T1',
        priority = calculatePriority(content, freq),
        sourceUrl = content.source_url,
        sourceName = content.source_name || content.author_name
    } = options;

    try {
        const { rows } = await pool.query(`
            INSERT INTO content_reservoir 
                (content, freq, priority, source_url, source_name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [
            JSON.stringify(content),
            freq,
            priority,
            sourceUrl,
            sourceName
        ]);

        console.log(`📦 储备: ${content.title?.substring(0, 30)}... → 优先级 ${priority}`);
        return { success: true, id: rows[0].id, priority };
    } catch (error) {
        console.error('❌ 储备失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 计算内容优先级
 * @param {Object} content - 内容对象
 * @param {string} freq - 频段
 * @returns {number} 优先级 1-10
 */
function calculatePriority(content, freq) {
    let priority = 5; // 默认

    // 核心频段优先 (T1, P1, H1, Φ1, F1, R1)
    if (freq && freq.endsWith('1')) {
        priority -= 2;
    }

    // TTI 高分优先
    if (content.tti && content.tti >= 80) {
        priority -= 1;
    }

    // 权威来源优先
    const authorityAuthors = ['Ray Dalio', 'Tyler Cowen', 'Yuval Harari', 'Jonathan Haidt'];
    if (content.author_name && authorityAuthors.some(a => content.author_name.includes(a))) {
        priority -= 1;
    }

    return Math.max(1, Math.min(10, priority)); // 保持在 1-10 范围
}

/**
 * 从储备库发布内容到指定日期
 * @param {string} date - 目标日期 YYYY-MM-DD
 * @param {Object} gap - 配额缺口信息
 * @returns {Object} 发布结果
 */
async function publishFromReservoir(date, gap) {
    const result = { published: 0, items: [] };

    if (!gap || gap.gap <= 0) {
        console.log('✅ 无需从储备补充');
        return result;
    }

    // 获取可用的储备内容 (按优先级排序)
    const { rows: reservoirItems } = await pool.query(`
        SELECT id, content, freq, priority
        FROM content_reservoir
        WHERE status = 'pending'
          AND expires_at > NOW()
        ORDER BY priority ASC, created_at ASC
        LIMIT $1
    `, [gap.gap + 5]); // 多取几条以便筛选

    console.log(`📦 储备库有 ${reservoirItems.length} 条待发布内容`);

    const usedFreqs = new Set(gap.usedFreqs || []);

    for (const item of reservoirItems) {
        // 检查频段是否可用
        if (usedFreqs.has(item.freq)) {
            continue;
        }

        try {
            const content = typeof item.content === 'string'
                ? JSON.parse(item.content)
                : item.content;

            // 插入到 radar_items
            await pool.query(`
                INSERT INTO radar_items 
                    (date, freq, title, content, tension_question, tension_a, tension_b, 
                     source_url, speaker, tti, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            `, [
                date,
                item.freq,
                content.title,
                content.content,
                content.tension_question || content.tension_q || '',
                content.tension_a || '',
                content.tension_b || '',
                content.source_url,
                content.author_name || content.speaker,
                content.tti || 50
            ]);

            // 更新储备状态
            await pool.query(`
                UPDATE content_reservoir
                SET status = 'published', published_date = $1, published_at = NOW()
                WHERE id = $2
            `, [date, item.id]);

            usedFreqs.add(item.freq);
            result.published++;
            result.items.push({ id: item.id, freq: item.freq, title: content.title?.substring(0, 30) });
            console.log(`✅ 发布储备: ${content.title?.substring(0, 30)}... → ${item.freq}`);

            if (result.published >= gap.gap) {
                break;
            }
        } catch (error) {
            console.error(`❌ 发布储备失败 [${item.id}]:`, error.message);
        }
    }

    return result;
}

/**
 * 获取储备库统计
 */
async function getReservoirStats() {
    const { rows } = await pool.query(`
        SELECT 
            status,
            COUNT(*) as count,
            array_agg(DISTINCT freq) as freqs
        FROM content_reservoir
        GROUP BY status
    `);

    const { rows: pendingByFreq } = await pool.query(`
        SELECT freq, COUNT(*) as count
        FROM content_reservoir
        WHERE status = 'pending' AND expires_at > NOW()
        GROUP BY freq
        ORDER BY count DESC
    `);

    return {
        byStatus: rows.reduce((acc, r) => {
            acc[r.status] = { count: parseInt(r.count), freqs: r.freqs };
            return acc;
        }, {}),
        pendingByFreq: pendingByFreq.map(r => ({ freq: r.freq, count: parseInt(r.count) })),
        total: rows.reduce((sum, r) => sum + parseInt(r.count), 0)
    };
}

/**
 * 清理过期内容
 */
async function purgeExpired() {
    const { rowCount } = await pool.query(`
        UPDATE content_reservoir
        SET status = 'expired'
        WHERE status = 'pending' AND expires_at < NOW()
    `);

    if (rowCount > 0) {
        console.log(`🗑️ 清理 ${rowCount} 条过期储备内容`);
    }
    return { purged: rowCount };
}

/**
 * 检查 URL 是否已在储备库中
 */
async function isUrlInReservoir(url) {
    if (!url) return false;
    const { rows } = await pool.query(
        `SELECT id FROM content_reservoir WHERE source_url = $1 AND status = 'pending' LIMIT 1`,
        [url]
    );
    return rows.length > 0;
}

// ============================================
// 导出
// ============================================

module.exports = {
    addToReservoir,
    publishFromReservoir,
    getReservoirStats,
    purgeExpired,
    isUrlInReservoir,
    calculatePriority
};
