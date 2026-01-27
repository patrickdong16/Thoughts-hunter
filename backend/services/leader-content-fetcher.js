/**
 * 思想领袖内容抓取服务
 * Leader Content Fetcher
 * 
 * 从思想领袖的 RSS/博客获取最新内容作为 fallback 来源
 */

const Parser = require('rss-parser');
const pool = require('../config/database');
const { getRulesForDate } = require('../config/day-rules');

const parser = new Parser({
    timeout: 15000,
    headers: {
        'User-Agent': 'Thoughts-Radar/1.0 (Content Aggregator)'
    }
});

/**
 * 从数据库获取有 RSS 源的活跃思想领袖
 */
async function getLeadersWithRSS() {
    const result = await pool.query(`
        SELECT id, name, name_cn, domain, priority, rss_url, blog_url, role
        FROM thought_leaders
        WHERE status = 'active' 
          AND (rss_url IS NOT NULL OR blog_url IS NOT NULL)
        ORDER BY priority ASC, domain
        LIMIT 20
    `);
    return result.rows;
}

/**
 * 从单个 RSS 源获取最新文章
 */
async function fetchRSSFeed(url, leaderName) {
    try {
        console.log(`📰 抓取 RSS: ${leaderName} - ${url}`);
        const feed = await parser.parseURL(url);

        // 只返回最近 7 天的文章
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        const recentItems = feed.items
            .filter(item => {
                const pubDate = new Date(item.pubDate || item.isoDate);
                return pubDate > cutoffDate;
            })
            .slice(0, 3)  // 每个源最多3篇
            .map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate || item.isoDate,
                content: item.contentSnippet || item.content?.substring(0, 500) || '',
                author: leaderName
            }));

        console.log(`  ✅ 获取 ${recentItems.length} 篇文章`);
        return recentItems;
    } catch (error) {
        console.log(`  ❌ RSS 抓取失败: ${error.message}`);
        return [];
    }
}

/**
 * 获取所有领袖的最新内容
 */
async function fetchAllLeaderContent() {
    const leaders = await getLeadersWithRSS();
    console.log(`\n📚 开始抓取 ${leaders.length} 个思想领袖的内容...`);

    const allArticles = [];

    for (const leader of leaders) {
        const url = leader.rss_url || leader.blog_url;
        if (url && url.includes('rss') || url.includes('feed') || url.includes('atom')) {
            const articles = await fetchRSSFeed(url, leader.name);
            articles.forEach(article => {
                article.leader = leader;
                article.domain = leader.domain;
            });
            allArticles.push(...articles);
        }
    }

    console.log(`\n📊 共获取 ${allArticles.length} 篇文章`);
    return allArticles;
}

/**
 * 将文章转换为 radar_item 格式的草稿
 * 注意：这是简化版，完整版需要 AI 分析
 */
function articleToRadarDraft(article, freq) {
    return {
        freq,
        stance: 'A',  // 默认，需要 AI 判断
        title: article.title,
        author_name: article.author,
        author_avatar: article.author?.substring(0, 2) || '??',
        author_bio: article.leader?.role || '',
        source: `${article.author}, ${new Date(article.pubDate).toLocaleDateString('zh-CN')}`,
        source_url: article.link,
        content: article.content,
        domain: article.domain,
        tension_q: '',
        tension_a: '',
        tension_b: ''
    };
}

/**
 * 基于内容缺口生成补充内容
 */
async function generateFallbackContent(date) {
    const beijingDate = date || new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai'
    });

    console.log(`\n🔄 Fallback 内容生成: ${beijingDate}`);

    // 1. 检查当前内容状态
    const { rows: existing } = await pool.query(
        'SELECT freq FROM radar_items WHERE date = $1',
        [beijingDate]
    );
    const usedFreqs = new Set(existing.map(r => r.freq));

    // 2. 获取规则
    const dayRules = getRulesForDate(beijingDate);
    const minItems = dayRules.minItems || 6;
    const gap = Math.max(0, minItems - existing.length);

    console.log(`📊 当前: ${existing.length} 条 | 目标: ${minItems} 条 | 缺口: ${gap} 条`);

    if (gap === 0) {
        return {
            success: true,
            message: '内容已达标，无需补充',
            date: beijingDate,
            currentCount: existing.length,
            gap: 0
        };
    }

    // 3. 抓取 RSS 内容
    const articles = await fetchAllLeaderContent();

    if (articles.length === 0) {
        return {
            success: false,
            message: 'RSS 源无可用内容',
            date: beijingDate,
            gap
        };
    }

    // 4. 可用频段
    const allFreqs = ['T1', 'T2', 'P1', 'P2', 'H1', 'Φ1', 'F1', 'R1'];
    const availableFreqs = allFreqs.filter(f => !usedFreqs.has(f));

    // 5. 按领域分配文章 (简化版)
    const domainToFreq = {
        'tech': 'T',
        'geopolitics': 'P',
        'history': 'H',
        'philosophy': 'Φ',
        'finance': 'F',
        'religion': 'R'
    };

    const results = {
        fetched: articles.length,
        inserted: 0,
        skipped: 0,
        errors: []
    };

    for (const article of articles.slice(0, gap)) {
        // 找到对应频段
        const prefix = domainToFreq[article.domain] || 'T';
        const freq = availableFreqs.find(f => f.startsWith(prefix)) || availableFreqs[0];

        if (!freq) {
            results.skipped++;
            continue;
        }

        // 内容长度检查
        if (!article.content || article.content.length < 100) {
            console.log(`  ⚠️ 内容太短，跳过: ${article.title?.substring(0, 30)}`);
            results.skipped++;
            continue;
        }

        try {
            const draft = articleToRadarDraft(article, freq);

            // 插入数据库 (注意：radar_items 表没有 domain 列)
            await pool.query(`
                INSERT INTO radar_items (
                    date, freq, stance, title,
                    author_name, author_avatar, author_bio,
                    source, source_url, content,
                    tension_q, tension_a, tension_b
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (date, freq) DO NOTHING
            `, [
                beijingDate, draft.freq, draft.stance, draft.title,
                draft.author_name, draft.author_avatar, draft.author_bio,
                draft.source, draft.source_url, draft.content,
                draft.tension_q, draft.tension_a, draft.tension_b
            ]);

            console.log(`  ✅ [${freq}] ${draft.title?.substring(0, 40)}...`);
            results.inserted++;

            // 从可用列表移除
            const idx = availableFreqs.indexOf(freq);
            if (idx > -1) availableFreqs.splice(idx, 1);

        } catch (error) {
            console.error(`  ❌ 插入失败: ${error.message}`);
            results.errors.push(error.message);
        }
    }

    return {
        success: true,
        message: `Fallback 完成: 插入 ${results.inserted} 条`,
        date: beijingDate,
        results
    };
}

module.exports = {
    getLeadersWithRSS,
    fetchRSSFeed,
    fetchAllLeaderContent,
    generateFallbackContent
};
