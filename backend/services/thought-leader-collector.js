/**
 * 思想领袖内容采集服务
 * Thought Leader Content Collector
 * 
 * 功能：
 * 1. 从 RSS 订阅获取思想领袖最新文章
 * 2. 爬取博客页面发现新内容
 * 3. 记录已检查的内容，避免重复处理
 */

const pool = require('../config/database');
const { normalizeUrl } = require('../utils/url-normalizer');
const { withTimeout, withRetry, TIMEOUTS, RETRY_CONFIGS } = require('../utils/api-utils');

// RSS 解析器
let Parser;
try {
    Parser = require('rss-parser');
} catch (e) {
    console.warn('⚠️ rss-parser 未安装，RSS 采集功能不可用');
}

/**
 * 获取所有活跃的思想领袖
 */
async function getActiveLeaders() {
    const result = await pool.query(`
        SELECT * FROM thought_leaders 
        WHERE status = 'active' 
        ORDER BY priority ASC, name ASC
    `);
    return result.rows;
}

/**
 * 获取指定思想领袖的信息
 */
async function getLeaderById(id) {
    const result = await pool.query(
        'SELECT * FROM thought_leaders WHERE id = $1',
        [id]
    );
    return result.rows[0];
}

/**
 * 从 RSS 获取最新文章
 * @param {Object} leader - 思想领袖对象
 * @returns {Array} 新发现的文章列表
 */
async function fetchLeaderRSS(leader) {
    if (!leader.rss_url) {
        console.log(`[RSS] ${leader.name}: 无 RSS 订阅地址`);
        return [];
    }

    if (!Parser) {
        console.warn(`[RSS] ${leader.name}: rss-parser 未安装`);
        return [];
    }

    console.log(`[RSS] 检查 ${leader.name} (${leader.rss_url})...`);

    try {
        const parser = new Parser({
            timeout: 10000,
            headers: {
                'User-Agent': 'ThoughtsRadar/1.0 (Content Aggregator)'
            }
        });

        const feed = await parser.parseURL(leader.rss_url);
        const articles = [];

        for (const item of feed.items.slice(0, 10)) {
            const url = item.link || item.url;
            if (!url) continue;

            const normalizedUrl = normalizeUrl(url);

            // 检查是否已记录
            const existing = await pool.query(
                'SELECT id FROM leader_content_log WHERE url_normalized = $1',
                [normalizedUrl]
            );

            if (existing.rows.length === 0) {
                // 新文章，记录到日志
                await pool.query(`
                    INSERT INTO leader_content_log 
                    (leader_id, content_url, url_normalized, title, published_at)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    leader.id,
                    url,
                    normalizedUrl,
                    item.title || '(无标题)',
                    item.pubDate ? new Date(item.pubDate) : null
                ]);

                articles.push({
                    leader: leader.name,
                    leaderCn: leader.name_cn,
                    domain: leader.domain,
                    priority: leader.priority,
                    url: url,
                    title: item.title,
                    pubDate: item.pubDate,
                    summary: item.contentSnippet?.substring(0, 200)
                });
            }
        }

        // 更新最后检查时间
        await pool.query(
            'UPDATE thought_leaders SET last_checked_at = NOW() WHERE id = $1',
            [leader.id]
        );

        console.log(`[RSS] ${leader.name}: 发现 ${articles.length} 篇新文章`);
        return articles;
    } catch (error) {
        console.error(`[RSS] ${leader.name} 采集失败:`, error.message);
        return [];
    }
}

/**
 * 检查所有思想领袖的新内容
 * @returns {Object} 检查结果
 */
async function checkAllLeaders() {
    console.log('\n========== 思想领袖内容检查 ==========');

    const leaders = await getActiveLeaders();
    console.log(`共 ${leaders.length} 位活跃思想领袖`);

    const results = {
        totalLeaders: leaders.length,
        checked: 0,
        newArticles: [],
        errors: []
    };

    for (const leader of leaders) {
        try {
            const articles = await fetchLeaderRSS(leader);
            results.newArticles.push(...articles);
            results.checked++;
        } catch (error) {
            results.errors.push({
                leader: leader.name,
                error: error.message
            });
        }
    }

    // 按优先级排序新文章
    results.newArticles.sort((a, b) => a.priority - b.priority);

    console.log(`\n检查完成: ${results.checked}/${leaders.length} 位领袖`);
    console.log(`发现新文章: ${results.newArticles.length} 篇`);
    if (results.errors.length > 0) {
        console.log(`错误: ${results.errors.length} 个`);
    }

    return results;
}

/**
 * 获取待处理的高优先级内容
 * @param {number} limit - 返回数量限制
 * @returns {Array} 待处理文章列表
 */
async function getPendingHighPriorityContent(limit = 10) {
    const result = await pool.query(`
        SELECT 
            lcl.*,
            tl.name as leader_name,
            tl.name_cn as leader_name_cn,
            tl.domain,
            tl.priority
        FROM leader_content_log lcl
        JOIN thought_leaders tl ON lcl.leader_id = tl.id
        WHERE lcl.ingested = FALSE 
        AND lcl.skip_reason IS NULL
        AND tl.priority <= 3
        ORDER BY tl.priority ASC, lcl.discovered_at DESC
        LIMIT $1
    `, [limit]);
    return result.rows;
}

/**
 * 标记内容为已处理
 */
async function markContentIngested(contentLogId, radarItemId) {
    await pool.query(`
        UPDATE leader_content_log 
        SET ingested = TRUE, radar_item_id = $2
        WHERE id = $1
    `, [contentLogId, radarItemId]);
}

/**
 * 标记内容为跳过
 */
async function markContentSkipped(contentLogId, reason) {
    await pool.query(`
        UPDATE leader_content_log 
        SET skip_reason = $2
        WHERE id = $1
    `, [contentLogId, reason]);
}

/**
 * 添加新的思想领袖
 */
async function addLeader(leaderData) {
    const { name, name_cn, role, domain, priority, rss_url, blog_url, twitter_handle, notes } = leaderData;

    const result = await pool.query(`
        INSERT INTO thought_leaders 
        (name, name_cn, role, domain, priority, rss_url, blog_url, twitter_handle, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (name) DO UPDATE SET
            role = EXCLUDED.role,
            priority = EXCLUDED.priority,
            rss_url = EXCLUDED.rss_url,
            blog_url = EXCLUDED.blog_url,
            updated_at = NOW()
        RETURNING *
    `, [name, name_cn, role, domain, priority || 50, rss_url, blog_url, twitter_handle, notes]);

    return result.rows[0];
}

/**
 * 获取统计信息
 */
async function getLeaderStats() {
    const leadersResult = await pool.query(`
        SELECT 
            domain,
            COUNT(*) as count,
            AVG(priority) as avg_priority
        FROM thought_leaders
        WHERE status = 'active'
        GROUP BY domain
        ORDER BY domain
    `);

    const contentResult = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN ingested THEN 1 END) as ingested,
            COUNT(CASE WHEN skip_reason IS NOT NULL THEN 1 END) as skipped,
            COUNT(CASE WHEN ingested = FALSE AND skip_reason IS NULL THEN 1 END) as pending
        FROM leader_content_log
    `);

    return {
        leadersByDomain: leadersResult.rows,
        contentStats: contentResult.rows[0]
    };
}

module.exports = {
    getActiveLeaders,
    getLeaderById,
    fetchLeaderRSS,
    checkAllLeaders,
    getPendingHighPriorityContent,
    markContentIngested,
    markContentSkipped,
    addLeader,
    getLeaderStats
};
