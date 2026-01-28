/**
 * 思想领袖内容抓取服务
 * Leader Content Fetcher
 * 
 * 从思想领袖的 RSS/博客获取最新内容作为 fallback 来源
 */

const Parser = require('rss-parser');
const pool = require('../config/database');
const { getRulesForDate } = require('../config/day-rules');
const aiAnalyzer = require('./ai-analyzer');
const multiSourceGenerator = require('./multi-source-generator');

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
 * v2: 使用 AI 分析生成中文内容，而非直接使用 RSS 原文
 */
async function analyzeArticleWithAI(article, freq) {
    console.log(`🤖 AI 分析: ${article.title?.substring(0, 40)}...`);

    try {
        // 构建分析用的元数据
        const metadata = {
            title: article.title,
            channelTitle: article.author,
            publishedAt: article.pubDate,
            description: article.content || ''
        };

        // 调用 AI 分析（使用元数据模式，因为 RSS 没有完整字幕）
        const analysis = await aiAnalyzer.analyzeMetadata(metadata);

        if (analysis.items && analysis.items.length > 0) {
            // AI 成功生成了中文内容
            const item = analysis.items[0];
            return {
                success: true,
                draft: {
                    freq: item.freq || freq,
                    stance: item.stance || 'A',
                    title: item.title,
                    author_name: item.author_name || article.author,
                    author_avatar: aiAnalyzer.generateAvatar(item.author_name || article.author),
                    author_bio: item.author_bio || article.leader?.role || '',
                    source: item.source || `${article.author}, ${new Date(article.pubDate).toLocaleDateString('zh-CN')}`,
                    source_url: article.link,
                    content: item.content,
                    tension_q: item.tension_q || '',
                    tension_a: item.tension_a || '',
                    tension_b: item.tension_b || ''
                }
            };
        }

        return { success: false, reason: 'AI 未生成有效内容' };
    } catch (error) {
        console.error(`❌ AI 分析失败: ${error.message}`);
        return { success: false, reason: error.message };
    }
}

/**
 * 基于内容缺口生成补充内容
 * @param {string} date - 日期
 * @param {Object} options - 可选参数
 * @param {boolean} options.forceGenerate - 强制生成（即使配额已满）用于填补频段缺口
 * @param {number} options.maxItems - 最多生成数量
 */
async function generateFallbackContent(date, options = {}) {
    const { forceGenerate = false, maxItems = 4 } = options;
    const beijingDate = date || new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai'
    });

    console.log(`\n🔄 Fallback 内容生成: ${beijingDate} (force=${forceGenerate})`);

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

    // 3. 计算缺失的核心频段
    const coreFreqs = ['T1', 'P1', 'Φ1', 'H1', 'F1', 'R1'];
    const missingCoreFreqs = coreFreqs.filter(f => !usedFreqs.has(f));

    console.log(`📊 当前: ${existing.length} 条 | 目标: ${minItems} 条 | 缺口: ${gap} 条`);
    console.log(`📊 缺失核心频段: ${missingCoreFreqs.join(', ') || '无'}`);

    // 如果配额已满且不强制生成，检查是否需要填补频段
    if (gap === 0 && !forceGenerate) {
        if (missingCoreFreqs.length === 0) {
            return {
                success: true,
                message: '内容已达标，无需补充',
                date: beijingDate,
                currentCount: existing.length,
                gap: 0
            };
        }
        // 有缺失频段但未强制生成，提示用户
        return {
            success: true,
            message: '配额已满但存在频段缺口，建议使用 forceGenerate=true',
            date: beijingDate,
            currentCount: existing.length,
            gap: 0,
            missingFreqs: missingCoreFreqs
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

    // 5. 已有来源检查（防止单一来源）
    const { rows: existingAuthors } = await pool.query(
        'SELECT DISTINCT author_name FROM radar_items WHERE date = $1',
        [beijingDate]
    );
    const usedAuthors = new Set(existingAuthors.map(r => r.author_name));

    // 6. 按领域分配文章时确保来源多样性
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
        analyzed: 0,
        inserted: 0,
        skipped: 0,
        errors: []
    };

    // 过滤已用作者的文章，优先多样化
    const diverseArticles = articles.filter(a => !usedAuthors.has(a.author));
    const articlesToProcess = diverseArticles.length >= gap
        ? diverseArticles
        : articles; // 如果多样化不够，回退到全部

    console.log(`📰 待处理文章: ${articlesToProcess.length} (多样化: ${diverseArticles.length}, 需求: ${gap})`);

    for (const article of articlesToProcess.slice(0, gap + 2)) { // 多处理一些留余量
        if (results.inserted >= gap) break;

        // 找到对应频段
        const prefix = domainToFreq[article.domain] || 'T';
        const freq = availableFreqs.find(f => f.startsWith(prefix)) || availableFreqs[0];

        if (!freq) {
            results.skipped++;
            continue;
        }

        // 内容长度检查
        if (!article.content || article.content.length < 50) {
            console.log(`  ⚠️ 内容太短，跳过: ${article.title?.substring(0, 30)}`);
            results.skipped++;
            continue;
        }

        try {
            // 使用 AI 分析生成中文内容
            const aiResult = await analyzeArticleWithAI(article, freq);
            results.analyzed++;

            if (!aiResult.success) {
                console.log(`  ⚠️ AI 分析失败: ${aiResult.reason}`);
                results.skipped++;
                continue;
            }

            const draft = aiResult.draft;

            // 质量验证
            if (!draft.content || draft.content.length < 400) {
                console.log(`  ⚠️ 生成内容太短 (${draft.content?.length || 0} 字)，跳过`);
                results.skipped++;
                continue;
            }

            // 插入数据库
            await pool.query(`
                INSERT INTO radar_items (
                    date, freq, stance, title,
                    author_name, author_avatar, author_bio,
                    source, source_url, content,
                    tension_q, tension_a, tension_b
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                beijingDate, draft.freq, draft.stance, draft.title,
                draft.author_name, draft.author_avatar, draft.author_bio,
                draft.source, draft.source_url, draft.content,
                draft.tension_q, draft.tension_a, draft.tension_b
            ]);

            console.log(`  ✅ [${draft.freq}] ${draft.title?.substring(0, 40)}...`);
            results.inserted++;
            usedAuthors.add(draft.author_name);

            // 从可用列表移除
            const idx = availableFreqs.indexOf(draft.freq);
            if (idx > -1) availableFreqs.splice(idx, 1);

        } catch (error) {
            console.error(`  ❌ 处理失败: ${error.message}`);
            results.errors.push(error.message);
        }
    }

    // 配额验证：检查是否达标
    const gapResult = await multiSourceGenerator.getContentGap(beijingDate);

    const response = {
        success: true,
        message: `Fallback 完成: 插入 ${results.inserted} 条`,
        date: beijingDate,
        results,
        quotaPassed: !gapResult.needsMore,
        quotaStatus: null,
        searchQueries: []
    };

    // 如果配额未满，返回搜索建议
    if (gapResult.needsMore) {
        response.quotaStatus = {
            current: gapResult.currentCount,
            target: gapResult.minItems,
            gap: gapResult.gap,
            missingFreqs: gapResult.stats.frequency.missing
        };
        response.searchQueries = multiSourceGenerator.generateWebSearchQueries(gapResult);
        response.warning = `配额未满: ${gapResult.currentCount}/${gapResult.minItems}, 缺${gapResult.stats.frequency.missing.join(',')}频段`;
        console.log(`⚠️ ${response.warning}`);
        console.log(`🔍 建议搜索: ${response.searchQueries.length} 条查询`);
    }

    return response;
}

module.exports = {
    getLeadersWithRSS,
    fetchRSSFeed,
    fetchAllLeaderContent,
    generateFallbackContent
};
