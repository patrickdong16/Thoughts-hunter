/**
 * Lead 管理服务 v1.0
 * Leads Manager Service
 * 
 * 管理候选池的 CRUD 和深挖操作
 */

const pool = require('../config/database');
const Parser = require('rss-parser');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

const parser = new Parser({
    timeout: 15000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ThoughtsRadar/1.0)' }
});

// ============================================
// Lead 采集
// ============================================

/**
 * 插入 leads 到候选池
 * @param {Array} leads - lead 列表
 */
async function insertLeads(leads) {
    let inserted = 0;
    let skipped = 0;

    for (const lead of leads) {
        try {
            // 简单插入，依赖 UNIQUE INDEX 自动去重
            await pool.query(`
                INSERT INTO leads_pool 
                    (source_type, source_url, source_name, title, snippet, leader_name, raw_data)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                lead.sourceType,
                lead.sourceUrl,
                lead.sourceName,
                lead.title,
                lead.snippet,
                lead.leaderName || null,
                JSON.stringify(lead.rawData || {})
            ]);
            inserted++;
        } catch (error) {
            // 23505 = unique_violation (重复)
            if (error.code === '23505') {
                skipped++;
            } else {
                console.log(`   ⚠️ Lead 插入失败: ${error.message}`);
                skipped++;
            }
        }
    }

    console.log(`   📥 Leads: ${inserted} 新增, ${skipped} 跳过`);
    return { inserted, skipped };
}

/**
 * 获取待处理 leads
 * @param {number} limit - 数量限制
 */
async function getPendingLeads(limit = 20) {
    const { rows } = await pool.query(`
        SELECT * FROM leads_pool 
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT $1
    `, [limit]);
    return rows;
}

/**
 * 更新 lead 状态
 */
async function updateLeadStatus(id, status, enrichedContent = null) {
    if (enrichedContent) {
        await pool.query(`
            UPDATE leads_pool 
            SET status = $2, enriched_at = NOW(), enriched_content = $3
            WHERE id = $1
        `, [id, status, JSON.stringify(enrichedContent)]);
    } else {
        await pool.query(`
            UPDATE leads_pool SET status = $2 WHERE id = $1
        `, [id, status]);
    }
}

// ============================================
// Lead 深挖
// ============================================

/**
 * 判断 lead 是否需要深挖
 */
function needsEnrichment(lead) {
    // Google News 通常只有摘要，需要深挖
    if (lead.source_type === 'google') return true;

    // RSS 内容不足也需要深挖
    if (!lead.snippet || lead.snippet.length < 500) return true;

    return false;
}

/**
 * 解码 Google News RSS 文章 URL
 * Google News RSS 返回的是加密的重定向链接，需要解码获取真实 URL
 * @param {string} googleUrl - Google News RSS article URL
 * @returns {string} 真实文章 URL
 */
async function resolveGoogleNewsUrl(googleUrl) {
    if (!googleUrl.includes('news.google.com/rss/articles/')) {
        return googleUrl; // 不是 Google News URL，直接返回
    }

    try {
        // 方法1: 尝试从 URL 中提取 base64 编码的真实 URL
        const urlMatch = googleUrl.match(/articles\/([^?]+)/);
        if (urlMatch) {
            const encoded = urlMatch[1];
            // Google News 使用多层编码，尝试解码
            try {
                // 尝试 base64 解码
                const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
                // 在解码内容中查找 http URL
                const urlInDecoded = decoded.match(/https?:\/\/[^\s"<>]+/);
                if (urlInDecoded) {
                    console.log(`      🔗 解码成功: ${urlInDecoded[0].substring(0, 50)}...`);
                    return urlInDecoded[0];
                }
            } catch (e) {
                // base64 解码失败，继续尝试方法2
            }
        }

        // 方法2: 通过 HTTP 跟踪重定向获取真实 URL
        console.log(`      🔗 跟踪重定向...`);
        const response = await fetch(googleUrl, {
            method: 'HEAD',
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });

        if (response.url && response.url !== googleUrl) {
            console.log(`      🔗 重定向到: ${response.url.substring(0, 50)}...`);
            return response.url;
        }

        // 方法3: GET 请求并检查最终 URL
        const getResponse = await fetch(googleUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html'
            }
        });

        if (getResponse.url && getResponse.url !== googleUrl) {
            console.log(`      🔗 最终URL: ${getResponse.url.substring(0, 50)}...`);
            return getResponse.url;
        }

        return googleUrl; // 无法解析，返回原 URL
    } catch (error) {
        console.log(`      ⚠️ URL解析失败: ${error.message}`);
        return googleUrl; // 出错时返回原 URL
    }
}

/**
 * 深挖 lead - 抓取原文内容
 * @param {Object} lead - lead 对象
 */
async function enrichLead(lead) {
    console.log(`   🔍 深挖: ${lead.title?.substring(0, 40)}...`);

    try {
        // 解析真实 URL (处理 Google News 重定向)
        let targetUrl = lead.source_url;
        if (lead.source_type === 'google' || targetUrl.includes('news.google.com')) {
            targetUrl = await resolveGoogleNewsUrl(targetUrl);
        }

        // 抓取原始网页
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml'
            },
            redirect: 'follow'
        });

        if (!response.ok) {
            console.log(`      ⚠️ HTTP ${response.status}`);
            return null;
        }

        const html = await response.text();

        // 使用 Readability 提取正文
        const dom = new JSDOM(html, { url: targetUrl });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article || !article.textContent) {
            console.log(`      ⚠️ 无法提取正文`);
            return null;
        }

        console.log(`      ✅ 提取 ${article.textContent.length} 字符`);

        return {
            title: article.title || lead.title,
            content: article.textContent.substring(0, 10000),
            excerpt: article.excerpt,
            byline: article.byline,
            siteName: article.siteName,
            leader: lead.leader_name,
            sourceUrl: targetUrl, // 使用解析后的真实 URL
            originalUrl: lead.source_url // 保留原始 Google URL
        };
    } catch (error) {
        console.log(`      ❌ 深挖失败: ${error.message}`);
        return null;
    }
}

// ============================================
// 统计
// ============================================

/**
 * 获取 leads 统计
 */
async function getLeadsStats() {
    const { rows } = await pool.query(`
        SELECT 
            source_type,
            status,
            COUNT(*) as count
        FROM leads_pool
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY source_type, status
    `);
    return rows;
}

/**
 * 清理过期 leads (7天前)
 */
async function purgeOldLeads() {
    const { rowCount } = await pool.query(`
        DELETE FROM leads_pool 
        WHERE created_at < NOW() - INTERVAL '7 days'
    `);
    if (rowCount > 0) {
        console.log(`   🗑️ 清理 ${rowCount} 条过期 leads`);
    }
    return rowCount;
}

// ============================================
// 导出
// ============================================

module.exports = {
    insertLeads,
    getPendingLeads,
    updateLeadStatus,
    needsEnrichment,
    enrichLead,
    getLeadsStats,
    purgeOldLeads
};
