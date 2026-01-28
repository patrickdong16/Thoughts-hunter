/**
 * 内容雷达扫描服务 v3.0
 * Content Radar Scanner
 * 
 * 配置驱动的统一内容扫描入口
 * 
 * 优先级策略:
 * - 非视频内容: RSS 优先 (Tier1 → Tier2 → Tier3 → Leader RSS)
 * - 视频内容: YouTube 优先 (频道扫描 → 搜索)
 * 
 * 配置来源: CONTENT_SOURCES.json (唯一信息源配置中心)
 */

const fs = require('fs');
const path = require('path');
const tieredRSSFetcher = require('./tiered-rss-fetcher');
const leaderContentFetcher = require('./leader-content-fetcher');
const multiSourceGenerator = require('./multi-source-generator');
const contentReservoir = require('./content-reservoir');
const pool = require('../config/database');
const aiAnalyzer = require('./ai-analyzer');

// ============================================
// 配置加载
// ============================================

/**
 * 从 CONTENT_SOURCES.json 加载完整配置
 * 使用 require 确保在所有环境下路径正确解析
 * 注意：Railway 从 backend/ 构建，所以配置文件需要在 backend/ 目录下
 */
function loadConfig() {
    // 尝试 backend 目录（Railway）或 项目根目录（本地开发）
    try {
        return require('../CONTENT_SOURCES.json');
    } catch (e) {
        return require('../../CONTENT_SOURCES.json');
    }
}

/**
 * 获取所有 RSS 源 (合并 rssFeeds + leaders)
 */
function getAllRSSSources() {
    const config = loadConfig();
    const sources = [];

    // 1. 从 rssFeeds 获取分层源
    const tieredFeeds = tieredRSSFetcher.getAllFeeds();
    sources.push(...tieredFeeds.map(f => ({
        ...f,
        sourceType: 'tiered',
        tier: f.tier
    })));

    // 2. 从 leaders 获取个人 RSS
    if (config.leaders) {
        config.leaders
            .filter(l => l.rss_url && l.status === 'active')
            .forEach(l => {
                sources.push({
                    name: l.name,
                    name_cn: l.name_cn,
                    url: l.rss_url,
                    domains: [l.domain?.charAt(0).toUpperCase() || 'T'],
                    priority: l.priority || 3,
                    sourceType: 'leader',
                    tier: 4
                });
            });
    }

    return sources;
}

/**
 * 获取 YouTube 频道列表
 */
function getYouTubeChannels() {
    const config = loadConfig();
    return config.youtubeChannels || [];
}

// ============================================
// 内容扫描
// ============================================

/**
 * 每日雷达扫描主函数 v5.1
 * 双池架构: 
 *   Phase 1: 多源采集 → leads_pool (候选池)
 *   Phase 2: AI 分析 + 深挖 → content_reservoir (储备池)
 *   Phase 3: 配额发布 → radar_items
 * @param {string} date - YYYY-MM-DD 格式日期
 * @returns {Object} 扫描结果
 */
async function dailyScan(date) {
    const beijingDate = date || new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai'
    });

    console.log(`\n🛰️ ========== 每日雷达扫描 ${beijingDate} (v5.1 双池架构) ==========\n`);

    // 获取当前配额状态
    const gap = await multiSourceGenerator.getContentGap(beijingDate);
    console.log(`📊 当前配额: ${gap.currentCount}/${gap.minItems} (缺 ${gap.gap})`);

    const result = {
        date: beijingDate,
        startTime: new Date().toISOString(),
        leadsCollected: { google: 0, rss: 0, total: 0 },
        leadsProcessed: { enriched: 0, toReservoir: 0, failed: 0 },
        published: 0,
        quotaBefore: gap.currentCount,
        quotaAfter: gap.currentCount
    };

    const leadsManager = require('./leads-manager');
    const leaderHotspotScanner = require('./leader-hotspot-scanner');

    // ==========================================
    // Phase 1: 多源采集 → 候选池 (leads_pool)
    // ==========================================
    console.log(`\n📥 Phase 1: 多源采集 → 候选池`);

    // 1a. Google News - 全部领袖
    console.log(`   🔥 Google News 扫描...`);
    const config = await loadConfig();
    const googleLeads = await leaderHotspotScanner.scanLeaderHotTopics(config.leaders, {
        maxArticlesPerLeader: 3,
        hoursBack: 24
    });
    result.leadsCollected.google = googleLeads.length;

    // 1b. RSS 扫描
    console.log(`   📰 RSS 扫描...`);
    const rssLeads = await collectRSSLeads(beijingDate);
    result.leadsCollected.rss = rssLeads.length;

    // 1c. 插入候选池
    const allLeads = [...googleLeads, ...rssLeads];
    result.leadsCollected.total = allLeads.length;
    await leadsManager.insertLeads(allLeads);

    // ==========================================
    // Phase 2: AI 分析 + 深挖 → 储备池
    // ==========================================
    console.log(`\n🔬 Phase 2: Lead 处理 → 储备池`);
    await leadsManager.purgeOldLeads();

    const pendingLeads = await leadsManager.getPendingLeads(30);
    console.log(`   待处理 leads: ${pendingLeads.length} 条`);

    for (const lead of pendingLeads) {
        try {
            // 深挖补全内容
            let enrichedContent = lead.snippet;
            if (leadsManager.needsEnrichment(lead)) {
                const enriched = await leadsManager.enrichLead(lead);
                if (enriched) {
                    enrichedContent = enriched.content;
                    result.leadsProcessed.enriched++;
                }
            }

            // AI 分析生成内容
            const analyzed = await aiAnalyzer.analyzeRSSArticle({
                title: lead.title,
                content: enrichedContent || lead.snippet,
                source: lead.source_name,
                url: lead.source_url,
                targetFreq: lead.raw_data?.leader?.domain ? `${lead.raw_data.leader.domain}1` : 'T1'
            });

            if (analyzed && analyzed.content && analyzed.content.length >= 400) {
                // 合格 → 储备池
                await contentReservoir.addToReservoir(analyzed, {
                    contentType: lead.source_type,
                    sourceUrl: lead.source_url,
                    sourceName: lead.leader_name || lead.source_name
                });
                await leadsManager.updateLeadStatus(lead.id, 'enriched', enrichedContent);
                result.leadsProcessed.toReservoir++;
            } else {
                await leadsManager.updateLeadStatus(lead.id, 'failed');
                result.leadsProcessed.failed++;
            }
        } catch (error) {
            console.log(`   ❌ Lead ${lead.id}: ${error.message}`);
            await leadsManager.updateLeadStatus(lead.id, 'failed');
            result.leadsProcessed.failed++;
        }
    }

    console.log(`   ✅ 储备池: +${result.leadsProcessed.toReservoir}, ❌ 失败: ${result.leadsProcessed.failed}`);

    // ==========================================
    // Phase 3: 储备池 → 发布
    // ==========================================
    console.log(`\n📤 Phase 3: 储备池 → 发布`);
    const currentGap = await multiSourceGenerator.getContentGap(beijingDate);

    if (currentGap.needsMore) {
        await contentReservoir.purgeExpired();
        const publishResult = await contentReservoir.publishFromReservoir(beijingDate, currentGap.gap + 3);
        result.published = publishResult.published;
        console.log(`   发布: ${publishResult.published} 条`);
    } else {
        console.log(`   配额已满，无需发布`);
    }

    // ==========================================
    // 最终状态
    // ==========================================
    const finalGap = await multiSourceGenerator.getContentGap(beijingDate);
    result.quotaAfter = finalGap.currentCount;
    result.endTime = new Date().toISOString();
    result.quotaPassed = !finalGap.needsMore;

    console.log(`\n🏁 扫描完成: ${result.quotaBefore} → ${result.quotaAfter}`);
    console.log(`   配额状态: ${result.quotaPassed ? '✅ 达标' : '⚠️ 未达标'}`);

    return result;
}

/**
 * 收集 RSS leads (不直接分析)
 */
async function collectRSSLeads(date) {
    const config = await loadConfig();
    const leads = [];

    // 从 tiered-rss-fetcher 获取所有 feeds
    const allFeeds = tieredRSSFetcher.getAllFeeds().slice(0, 20);

    for (const feed of allFeeds) {
        try {
            const items = await tieredRSSFetcher.fetchSingleFeed(feed, 5);

            for (const item of items) {
                leads.push({
                    sourceType: 'rss',
                    sourceUrl: item.link,
                    sourceName: feed.name,
                    title: item.title,
                    snippet: item.content || '',
                    rawData: { source: feed, pubDate: item.pubDate }
                });
            }
        } catch (error) {
            // 静默失败
        }
    }


    console.log(`   RSS leads: ${leads.length} 条`);
    return leads;
}

/**
 * 收集 RSS 候选内容 (不直接发布)
 * @param {string} date - 目标日期
 * @returns {Array} 候选列表
 */
async function collectRSSCandidates(date) {
    const candidates = [];

    // 获取所有 RSS 文章
    const fetchResult = await tieredRSSFetcher.fetchByMissingFreqs([]);
    console.log(`   扫描 ${fetchResult.feedsScanned} 个源，获取 ${fetchResult.articles.length} 篇文章`);

    for (const article of fetchResult.articles) {
        // 跳过已发布的 URL
        const exists = await checkUrlExists(article.link);
        if (exists) continue;

        // 跳过已在储备库的 URL
        const inReservoir = await contentReservoir.isUrlInReservoir(article.link);
        if (inReservoir) continue;

        // 确定目标频段
        const domain = article.source.domains?.[0] || 'T';
        const targetFreq = `${domain}1`;

        try {
            console.log(`   🔍 分析: ${article.title?.substring(0, 40)}...`);

            // AI 分析
            const analyzed = await aiAnalyzer.analyzeRSSArticle({
                title: article.title,
                content: article.content,
                source: article.source.name_cn || article.source.name,
                url: article.link,
                targetFreq
            });

            // 质检: 内容长度
            if (!analyzed || !analyzed.content || analyzed.content.length < 500) {
                console.log(`   ⚠️ 内容不符合要求`);
                continue;
            }

            // 计算优先级
            const priority = contentReservoir.calculatePriority(analyzed, targetFreq);

            candidates.push({
                content: analyzed,
                source: article,
                freq: targetFreq,
                priority,
                sourceType: 'rss',
                sourceUrl: article.link,
                sourceName: article.source.name_cn || article.source.name
            });

            console.log(`   ✅ 候选: ${targetFreq} (优先级 ${priority})`);
        } catch (error) {
            console.log(`   ❌ 分析失败: ${error.message}`);
        }
    }

    return candidates;
}

/**
 * 统一发布候选内容 (单一发布通道)
 * @param {string} date - 目标日期
 * @param {Array} candidates - 排序后的候选列表
 * @param {Object} gap - 配额信息
 * @returns {Object} 发布结果
 */
async function publishCandidates(date, candidates, gap) {
    const result = { published: 0, toReservoir: 0, items: [] };
    const usedFreqs = new Set(gap.usedFreqs || []);
    const maxItems = gap.maxItems || 10;
    let currentCount = gap.currentCount;

    for (const candidate of candidates) {
        // 频段冲突检查
        let targetFreq = candidate.freq;
        if (usedFreqs.has(targetFreq)) {
            // 尝试找替代频段
            const domain = targetFreq.charAt(0);
            const alternatives = [`${domain}2`, `${domain}3`];
            const available = alternatives.find(f => !usedFreqs.has(f));
            if (available) {
                targetFreq = available;
            } else {
                // 无可用频段，存储备
                if (candidate.sourceType === 'rss') {
                    await contentReservoir.addToReservoir(candidate.content, {
                        freq: candidate.freq,
                        sourceUrl: candidate.sourceUrl,
                        sourceName: candidate.sourceName
                    });
                    result.toReservoir++;
                }
                continue;
            }
        }

        // 配额检查
        if (currentCount >= maxItems) {
            // 超配额，存储备
            if (candidate.sourceType === 'rss') {
                await contentReservoir.addToReservoir(candidate.content, {
                    freq: candidate.freq,
                    sourceUrl: candidate.sourceUrl,
                    sourceName: candidate.sourceName
                });
                result.toReservoir++;
            }
            continue;
        }

        // 发布到 radar_items (单一通道)
        try {
            const content = candidate.content;
            await pool.query(`
                INSERT INTO radar_items (date, freq, title, content, tension_question,
                    tension_a, tension_b, source_url, speaker, tti, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            `, [
                date,
                targetFreq,
                content.title,
                content.content,
                content.tension_question || '',
                content.tension_a || '',
                content.tension_b || '',
                candidate.sourceUrl,
                candidate.sourceName,
                content.tti || 50
            ]);

            // 如果来自储备库，标记为已发布
            if (candidate.sourceType === 'reservoir' && candidate.reservoirId) {
                await pool.query(
                    `UPDATE content_reservoir SET status = 'published', published_date = $1, published_at = NOW() WHERE id = $2`,
                    [date, candidate.reservoirId]
                );
            }

            usedFreqs.add(targetFreq);
            currentCount++;
            result.published++;
            result.items.push({ freq: targetFreq, title: content.title?.substring(0, 30) });
            console.log(`   ✅ 发布: ${targetFreq} - ${content.title?.substring(0, 30)}...`);
        } catch (error) {
            console.log(`   ❌ 发布失败: ${error.message}`);
        }
    }

    return result;
}



/**
 * 检查 URL 是否已存在
 */
async function checkUrlExists(url) {
    if (!url) return false;
    const { rows } = await pool.query(
        `SELECT id FROM radar_items WHERE source_url = $1 LIMIT 1`,
        [url]
    );
    return rows.length > 0;
}

// ============================================
// 导出
// ============================================

module.exports = {
    loadConfig,
    getAllRSSSources,
    getYouTubeChannels,
    dailyScan,
    collectRSSCandidates,
    publishCandidates
};
