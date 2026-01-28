/**
 * 领袖热点扫描服务 v2.0
 * Leader Hotspot Scanner via Google News RSS
 * 
 * v2.0: 返回 leads 格式，不直接 AI 分析
 */

const Parser = require('rss-parser');

const parser = new Parser({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThoughtsRadar/1.0)'
    }
});

// ============================================
// 核心功能
// ============================================

/**
 * 扫描领袖热点话题 - 返回 leads 格式
 * @param {Array} leaders - 领袖配置列表 (全部 50+)
 * @param {Object} options - 扫描选项
 * @returns {Array} leads 列表
 */
async function scanLeaderHotTopics(leaders, options = {}) {
    const {
        maxArticlesPerLeader = 3,
        hoursBack = 24
    } = options;

    const leads = [];
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    console.log(`🔥 Google News 领袖热点扫描 (${leaders.length} 位领袖)`);

    for (const leader of leaders) {
        try {
            const articles = await fetchGoogleNewsRSS(leader.name);

            // 筛选最近的文章
            const recent = articles.filter(a => {
                const pubDate = new Date(a.isoDate || a.pubDate);
                return pubDate > cutoffTime;
            }).slice(0, maxArticlesPerLeader);

            if (recent.length > 0) {
                console.log(`   🔥 ${leader.name_cn || leader.name}: ${recent.length} 条`);

                for (const article of recent) {
                    leads.push({
                        sourceType: 'google',
                        sourceUrl: article.link,
                        sourceName: article.creator?.[0] || 'Google News',
                        title: article.title,
                        snippet: article.contentSnippet || article.content,
                        leaderName: leader.name,
                        rawData: {
                            pubDate: article.pubDate,
                            categories: article.categories,
                            leader: {
                                name: leader.name,
                                name_cn: leader.name_cn,
                                domain: leader.domain,
                                priority: leader.priority
                            }
                        }
                    });
                }
            }

            // 避免过快请求
            await new Promise(r => setTimeout(r, 200));
        } catch (error) {
            console.log(`   ⚠️ ${leader.name}: ${error.message}`);
        }
    }

    console.log(`   📊 Google leads 总计: ${leads.length} 条`);
    return leads;
}

/**
 * 获取 Google News RSS
 * @param {string} query - 搜索词
 * @returns {Array} 文章列表
 */
async function fetchGoogleNewsRSS(query) {
    const encodedQuery = encodeURIComponent(`"${query}"`);
    const rssUrl = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

    try {
        const feed = await parser.parseURL(rssUrl);
        return feed.items || [];
    } catch (error) {
        // 静默失败，避免刷屏
        return [];
    }
}

// ============================================
// 导出
// ============================================

module.exports = {
    scanLeaderHotTopics,
    fetchGoogleNewsRSS
};
