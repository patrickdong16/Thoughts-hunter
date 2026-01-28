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
 * 每日雷达扫描主函数
 * @param {string} date - YYYY-MM-DD 格式日期
 * @returns {Object} 扫描结果
 */
async function dailyScan(date) {
    const beijingDate = date || new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai'
    });

    console.log(`\n🛰️ ========== 每日雷达扫描 ${beijingDate} ==========\n`);

    // 1. 获取当前配额状态
    const gap = await multiSourceGenerator.getContentGap(beijingDate);
    console.log(`📊 当前配额: ${gap.currentCount}/${gap.minItems} (缺 ${gap.gap})`);
    console.log(`   缺失频段: ${gap.stats.frequency.missing.join(', ') || '无'}`);

    const result = {
        date: beijingDate,
        startTime: new Date().toISOString(),
        rss: { scanned: 0, articles: 0, inserted: 0 },
        youtube: { scanned: 0, videos: 0, queued: 0 },
        quotaBefore: gap.currentCount,
        quotaAfter: gap.currentCount,
        missingFreqs: gap.stats.frequency.missing
    };

    // 2. RSS 全量扫描 (配额检查后置)
    // v4.0: 始终扫描所有 RSS 源，分析后再决定发布/储备
    console.log(`\n📰 Phase 1: RSS 全量扫描 (配额检查后置)`);
    const rssResult = await scanRSSFeeds(beijingDate, gap, { unlimited: true });
    result.rss = rssResult;

    // 3. 刷新配额状态
    const midGap = await multiSourceGenerator.getContentGap(beijingDate);

    // 4. YouTube 扫描 (视频内容)
    if (midGap.stats.video.gap > 0) {
        console.log(`\n🎬 Phase 2: YouTube 扫描 (视频优先)`);
        // YouTube 扫描由 video-scanner.js 处理
        // 这里只返回建议
        result.youtube.suggestion = '调用 /api/automation/scan-channels 进行视频扫描';
    } else {
        console.log(`\n✅ 视频内容已达标，跳过 YouTube 扫描`);
    }

    // 5. 自动从储备库补充 (v4.0)
    const preReservoirGap = await multiSourceGenerator.getContentGap(beijingDate);
    if (preReservoirGap.gap > 0) {
        console.log(`\n📦 Phase 3: 从储备库补充 (缺口: ${preReservoirGap.gap})`);
        await contentReservoir.purgeExpired(); // 先清理过期
        const reservoirResult = await contentReservoir.publishFromReservoir(beijingDate, preReservoirGap);
        result.reservoir = {
            published: reservoirResult.published,
            items: reservoirResult.items
        };
    } else {
        console.log(`\n✅ 配额已满，跳过储备库补充`);
        result.reservoir = { published: 0, items: [] };
    }

    // 6. 最终配额状态
    const finalGap = await multiSourceGenerator.getContentGap(beijingDate);
    result.quotaAfter = finalGap.currentCount;
    result.endTime = new Date().toISOString();
    result.quotaPassed = !finalGap.needsMore;

    console.log(`\n🏁 扫描完成: ${result.quotaBefore} → ${result.quotaAfter}`);
    console.log(`   配额状态: ${result.quotaPassed ? '✅ 达标' : '⚠️ 未达标'}`);

    return result;
}

/**
 * 扫描 RSS 订阅源 (v4.0 全量扫描)
 * @param {string} date - 目标日期
 * @param {Object} gap - 配额缺口信息
 * @param {Object} options - 扫描选项
 */
async function scanRSSFeeds(date, gap, options = {}) {
    const result = { scanned: 0, articles: 0, inserted: 0, reserved: 0, sources: [] };

    // v4.0: 全量扫描所有源，不再限制
    console.log(`   扫描所有 RSS 源 (全量模式)`);

    // 使用 tiered-rss-fetcher 抓取所有源
    const fetchResult = await tieredRSSFetcher.fetchByMissingFreqs(
        options.unlimited ? [] : gap.stats.frequency.missing
    );
    result.scanned = fetchResult.feedsScanned;
    result.articles = fetchResult.articles.length;

    console.log(`   扫描 ${result.scanned} 个源，获取 ${result.articles} 篇文章`);

    // 处理文章 (AI 分析 + 入库/储备)
    if (fetchResult.articles.length > 0) {
        const insertResult = await processRSSArticles(fetchResult.articles, date, gap, options);
        result.inserted = insertResult.inserted;
        result.reserved = insertResult.reserved;
        result.sources = insertResult.sources;
    }

    return result;
}

/**
 * 处理 RSS 文章 (v4.0 全量处理 + 储备)
 * @param {Array} articles - 文章列表
 * @param {string} date - 目标日期
 * @param {Object} gap - 配额缺口
 * @param {Object} options - 处理选项
 */
async function processRSSArticles(articles, date, gap, options = {}) {
    const result = { inserted: 0, reserved: 0, sources: [] };
    const usedFreqs = new Set(gap.usedFreqs);
    const maxItems = gap.maxItems || 10;
    let currentCount = gap.currentCount;

    // v4.0: 处理所有文章，不再限制数量
    const maxToProcess = options.unlimited ? articles.length : Math.min(articles.length, gap.gap + 5);
    console.log(`   处理 ${maxToProcess} 篇文章 (全量模式: ${options.unlimited})`);

    for (const article of articles.slice(0, maxToProcess)) {
        // 跳过已处理的 URL
        const exists = await checkUrlExists(article.link);
        if (exists) {
            continue; // 静默跳过
        }

        // 检查是否已在储备库
        const inReservoir = await contentReservoir.isUrlInReservoir(article.link);
        if (inReservoir) {
            continue;
        }

        // 确定目标频段 (基于源的 domains)
        const domain = article.source.domains?.[0] || 'T';
        const potentialFreqs = [`${domain}1`, `${domain}2`, `${domain}3`];
        const availableFreq = potentialFreqs.find(f => !usedFreqs.has(f));
        const targetFreq = availableFreq || potentialFreqs[0];

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

            if (!analyzed || !analyzed.content || analyzed.content.length < 500) {
                console.log(`   ⚠️ 内容不符合要求`);
                continue;
            }

            // v4.0 配额检查后置: 决定发布还是储备
            const canPublish = currentCount < maxItems &&
                !usedFreqs.has(targetFreq);

            if (canPublish) {
                // 直接发布
                await pool.query(`
                    INSERT INTO radar_items (date, freq, title, content, tension_question, 
                        tension_a, tension_b, source_url, speaker, tti, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                `, [
                    date,
                    targetFreq,
                    analyzed.title,
                    analyzed.content,
                    analyzed.tension_question || '',
                    analyzed.tension_a || '',
                    analyzed.tension_b || '',
                    article.link,
                    article.source.name_cn || article.source.name,
                    analyzed.tti || 50
                ]);

                usedFreqs.add(targetFreq);
                currentCount++;
                result.inserted++;
                result.sources.push(article.source.name);
                console.log(`   ✅ 发布: ${targetFreq}`);
            } else {
                // 存入储备库
                const reserveResult = await contentReservoir.addToReservoir({
                    ...analyzed,
                    source_url: article.link,
                    source_name: article.source.name_cn || article.source.name
                }, {
                    freq: targetFreq,
                    sourceUrl: article.link,
                    sourceName: article.source.name_cn || article.source.name
                });

                if (reserveResult.success) {
                    result.reserved++;
                    console.log(`   📦 储备: ${targetFreq} (优先级 ${reserveResult.priority})`);
                }
            }
        } catch (error) {
            console.log(`   ❌ 处理失败: ${error.message}`);
        }
    }

    console.log(`   📊 结果: 发布 ${result.inserted}, 储备 ${result.reserved}`);
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
    scanRSSFeeds,
    processRSSArticles
};
