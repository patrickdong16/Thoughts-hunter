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
        sourceName = content.source_name || content.author_name,
        contentType = 'rss'  // 'rss' | 'video' | 'google'
    } = options;

    try {
        const { rows } = await pool.query(`
            INSERT INTO content_reservoir 
                (content, freq, priority, source_url, source_name, content_type)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, [
            JSON.stringify(content),
            freq,
            priority,
            sourceUrl,
            sourceName,
            contentType
        ]);

        console.log(`📦 储备 [${contentType}]: ${content.title?.substring(0, 30)}... → 优先级 ${priority}`);
        return { success: true, id: rows[0].id, priority };
    } catch (error) {
        console.error('❌ 储备失败:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * 计算内容优先级 (1=最高, 10=最低)
 * 优先顺序: 权威源 > TTI 高 > 核心频段
 * @param {Object} content - 内容对象
 * @param {string} freq - 频段
 * @returns {number} 优先级 1-10
 */
function calculatePriority(content, freq) {
    let priority = 5; // 默认

    // 1. 权威来源优先 (最重要 -3)
    const authorityAuthors = [
        'Ray Dalio', 'Tyler Cowen', 'Yuval Harari', 'Jonathan Haidt',
        'Naval Ravikant', 'Paul Graham', 'Ben Thompson', 'Andrej Karpathy',
        'Lex Fridman', 'Sam Altman', 'Jensen Huang', 'Mark Carney'
    ];
    if (content.author_name && authorityAuthors.some(a =>
        content.author_name.toLowerCase().includes(a.toLowerCase())
    )) {
        priority -= 3;
    }

    // 2. TTI 高分优先 (-2 for 80+, -1 for 70+)
    if (content.tti && content.tti >= 80) {
        priority -= 2;
    } else if (content.tti && content.tti >= 70) {
        priority -= 1;
    }

    // 3. 核心频段优先 (x1 bands get -1)
    if (freq && freq.endsWith('1')) {
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

    // 验证 gap.gap 是有效数字，避免 NaN 导致 SQL 错误
    const limitCount = Number.isFinite(gap.gap) ? gap.gap + 10 : 20;

    // 获取可用的储备内容 (按优先级排序)
    const { rows: reservoirItems } = await pool.query(`
        SELECT id, content, freq, priority
        FROM content_reservoir
        WHERE status = 'pending'
          AND expires_at > NOW()
        ORDER BY priority ASC, created_at ASC
        LIMIT $1
    `, [limitCount]);

    console.log(`📦 储备库有 ${reservoirItems.length} 条待发布内容`);

    const usedFreqs = new Set(gap.usedFreqs || []);

    // 获取今天已发布的 URL、频段和作者，避免重复发布
    const { rows: existingItems } = await pool.query(`
        SELECT source_url, freq, author_name FROM radar_items 
        WHERE date = $1
    `, [date]);
    const publishedUrls = new Set(existingItems.filter(r => r.source_url).map(r => r.source_url));
    const publishedAuthors = new Set(existingItems.filter(r => r.author_name).map(r => r.author_name));
    // 将已发布的频段也加入 usedFreqs（强制 maxPerFreq: 1）
    existingItems.forEach(r => { if (r.freq) usedFreqs.add(r.freq); });
    console.log(`   已发布: ${existingItems.length} 条, 频段: ${usedFreqs.size}, URL: ${publishedUrls.size}, 作者: ${publishedAuthors.size}`);

    for (const item of reservoirItems) {
        // 检查频段是否可用
        if (usedFreqs.has(item.freq)) {
            continue;
        }

        const content = typeof item.content === 'string'
            ? JSON.parse(item.content)
            : item.content;

        // 检查 URL 是否已发布（去重）
        if (content.source_url && publishedUrls.has(content.source_url)) {
            console.log(`   ⏭️ 跳过重复 URL: ${content.title?.substring(0, 30)}...`);
            // 标记为已发布（避免重复处理）
            await pool.query(`
                UPDATE content_reservoir
                SET status = 'published', published_date = $1, published_at = NOW()
                WHERE id = $2
            `, [date, item.id]);
            continue;
        }

        // 检查作者是否已发布（同一天同作者去重）
        const authorName = content.author_name || content.speaker;
        if (authorName && publishedAuthors.has(authorName)) {
            console.log(`   ⏭️ 跳过重复作者: ${authorName} - ${content.title?.substring(0, 25)}...`);
            continue;
        }

        try {

            // 插入到 radar_items (匹配实际表结构)
            await pool.query(`
                INSERT INTO radar_items 
                    (date, freq, stance, title, author_name, author_avatar, content, 
                     tension_q, tension_a, tension_b, source_url, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
            `, [
                date,
                item.freq,
                content.stance || 'A',
                content.title,
                content.author_name || content.speaker || 'Unknown',
                content.author_avatar || '🔭',
                content.content,
                content.tension_question || content.tension_q || '',
                content.tension_a || '',
                content.tension_b || '',
                content.source_url
            ]);

            // 更新储备状态
            await pool.query(`
                UPDATE content_reservoir
                SET status = 'published', published_date = $1, published_at = NOW()
                WHERE id = $2
            `, [date, item.id]);

            usedFreqs.add(item.freq);
            if (content.source_url) publishedUrls.add(content.source_url);
            const authorName = content.author_name || content.speaker;
            if (authorName) publishedAuthors.add(authorName);
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

/**
 * 获取储备库候选内容 (用于统一发布管道)
 * @param {number} limit - 最大数量
 * @returns {Array} 候选列表
 */
async function getCandidates(limit = 10) {
    const { rows } = await pool.query(`
        SELECT id, content, freq, priority, source_url, source_name
        FROM content_reservoir
        WHERE status = 'pending'
          AND expires_at > NOW()
        ORDER BY priority ASC, created_at ASC
        LIMIT $1
    `, [limit]);

    return rows.map(row => {
        const content = typeof row.content === 'string'
            ? JSON.parse(row.content)
            : row.content;
        return {
            content,
            freq: row.freq,
            priority: row.priority,
            sourceType: 'reservoir',
            sourceUrl: row.source_url || content.source_url,
            sourceName: row.source_name || content.author_name,
            reservoirId: row.id
        };
    });
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
    getCandidates,
    calculatePriority
};
