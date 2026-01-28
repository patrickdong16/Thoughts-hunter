/**
 * 分层 RSS 内容抓取服务
 * Tiered RSS Feed Fetcher
 * 
 * 从 CONTENT_SOURCES.json 的 rssFeeds 结构抓取内容
 * 支持 Tier 1 (知识枢纽) 和 Tier 2 (领域深耕) 分层优先级
 */

const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const aiAnalyzer = require('./ai-analyzer');

const parser = new Parser({
    timeout: 20000,
    headers: {
        'User-Agent': 'Thoughts-Radar/2.0 (Content Aggregator)'
    }
});

// 加载配置
function loadRSSConfig() {
    const configPath = path.resolve(__dirname, '../../CONTENT_SOURCES.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.rssFeeds || {};
}

/**
 * 获取所有 RSS 源，按优先级排序
 * @param {string[]} targetDomains - 目标频段 (可选)
 * @returns {Array} 排序后的 RSS 源列表
 */
function getAllFeeds(targetDomains = null) {
    const config = loadRSSConfig();
    const allFeeds = [];

    // 收集所有 tier 的 feeds
    for (const tierKey of Object.keys(config)) {
        const tier = tierKey.startsWith('tier1') ? 1 : 2;
        const feeds = config[tierKey] || [];

        feeds.forEach(feed => {
            // 如果指定了目标频段，过滤匹配的
            if (targetDomains && targetDomains.length > 0) {
                const hasMatch = feed.domains.some(d => targetDomains.includes(d));
                if (!hasMatch) return;
            }

            allFeeds.push({
                ...feed,
                tier,
                tierKey
            });
        });
    }

    // 按优先级排序: tier1 > tier2, priority 1 > 2 > 3
    allFeeds.sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return (a.priority || 3) - (b.priority || 3);
    });

    return allFeeds;
}

/**
 * 抓取单个 RSS 源
 * @param {Object} feed - RSS 源配置
 * @param {number} maxItems - 最大文章数
 * @returns {Array} 文章列表
 */
async function fetchSingleFeed(feed, maxItems = 5) {
    try {
        console.log(`📰 [${feed.tier === 1 ? 'Tier1' : 'Tier2'}] 抓取: ${feed.name}`);
        const result = await parser.parseURL(feed.url);

        // 只返回最近 7 天的文章
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        const items = result.items
            .filter(item => {
                const pubDate = new Date(item.pubDate || item.isoDate);
                return pubDate > cutoffDate;
            })
            .slice(0, maxItems)
            .map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate || item.isoDate,
                content: item.contentSnippet || item.content?.substring(0, 1000) || '',
                author: item.creator || item.author || feed.name,
                source: {
                    name: feed.name,
                    name_cn: feed.name_cn,
                    tier: feed.tier,
                    domains: feed.domains
                }
            }));

        console.log(`  ✅ 获取 ${items.length} 篇 (${feed.domains.join(',')})`);
        return items;
    } catch (error) {
        console.log(`  ❌ 抓取失败: ${error.message}`);
        return [];
    }
}

/**
 * 按频段需求抓取内容
 * @param {string[]} missingFreqs - 缺失的频段列表 (如 ['P1', 'H1'])
 * @returns {Object} 按频段分组的文章
 */
async function fetchByMissingFreqs(missingFreqs) {
    if (!missingFreqs || missingFreqs.length === 0) {
        console.log('✅ 无缺失频段，跳过抓取');
        return { articles: [], feedsScanned: 0 };
    }

    // 提取频段前缀 (P1 -> P, H1 -> H)
    const targetDomains = [...new Set(missingFreqs.map(f => f[0]))];
    console.log(`\n🎯 目标频段: ${targetDomains.join(', ')}`);

    const feeds = getAllFeeds(targetDomains);
    console.log(`📚 匹配 ${feeds.length} 个 RSS 源`);

    const allArticles = [];

    for (const feed of feeds) {
        const items = await fetchSingleFeed(feed);
        allArticles.push(...items);

        // 每个频段收集到足够文章后可以提前退出
        if (allArticles.length >= missingFreqs.length * 3) {
            console.log(`📊 已收集足够文章 (${allArticles.length}篇)，停止抓取`);
            break;
        }
    }

    return {
        articles: allArticles,
        feedsScanned: feeds.length,
        targetDomains
    };
}

/**
 * 抓取 Tier 1 源的最新内容
 * @returns {Array} 文章列表
 */
async function fetchTier1() {
    const config = loadRSSConfig();
    const tier1Feeds = config.tier1 || [];

    console.log(`\n🌟 抓取 Tier 1 知识枢纽 (${tier1Feeds.length} 源)...`);

    const allArticles = [];
    for (const feed of tier1Feeds) {
        const items = await fetchSingleFeed({ ...feed, tier: 1 }, 5);
        allArticles.push(...items);
    }

    return allArticles;
}

/**
 * 使用 AI 分析 RSS 文章并转换为 radar_item 格式
 * @param {Object} article - RSS 文章
 * @param {string} targetFreq - 目标频段
 * @returns {Object|null} radar_item 格式的内容
 */
async function analyzeArticleForRadar(article, targetFreq) {
    try {
        const prompt = `分析以下文章，为思想雷达生成内容:

标题: ${article.title}
来源: ${article.source.name_cn || article.source.name}
摘要: ${article.content}

请用中文生成:
1. 标题 (保留原意，翻译成中文，15-25字)
2. 内容 (500-800字，解读核心观点，加入背景分析)
3. 张力问题 (一个思辨性问题)
4. 正方观点 (tension_a)
5. 反方观点 (tension_b)

目标频段: ${targetFreq}`;

        // 调用 AI 分析器
        const result = await aiAnalyzer.analyzeContent(prompt, {
            type: 'rss_article',
            source: article.source.name,
            freq: targetFreq
        });

        return result;
    } catch (error) {
        console.log(`  ❌ AI 分析失败: ${error.message}`);
        return null;
    }
}

module.exports = {
    loadRSSConfig,
    getAllFeeds,
    fetchSingleFeed,
    fetchByMissingFreqs,
    fetchTier1,
    analyzeArticleForRadar
};
