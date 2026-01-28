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

    // 2. RSS 优先扫描 (非视频内容)
    if (gap.stats.nonVideo.gap > 0 || gap.stats.frequency.gap > 0) {
        console.log(`\n📰 Phase 1: RSS 扫描 (非视频优先)`);
        const rssResult = await scanRSSFeeds(beijingDate, gap);
        result.rss = rssResult;
    } else {
        console.log(`\n✅ 非视频内容已达标，跳过 RSS 扫描`);
    }

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

    // 5. 最终配额状态
    const finalGap = await multiSourceGenerator.getContentGap(beijingDate);
    result.quotaAfter = finalGap.currentCount;
    result.endTime = new Date().toISOString();
    result.quotaPassed = !finalGap.needsMore;

    console.log(`\n🏁 扫描完成: ${result.quotaBefore} → ${result.quotaAfter}`);
    console.log(`   配额状态: ${result.quotaPassed ? '✅ 达标' : '⚠️ 未达标'}`);

    return result;
}

/**
 * 扫描 RSS 订阅源
 * @param {string} date - 目标日期
 * @param {Object} gap - 配额缺口信息
 */
async function scanRSSFeeds(date, gap) {
    const result = { scanned: 0, articles: 0, inserted: 0, sources: [] };

    // 获取缺失的频段前缀
    const missingDomains = [...new Set(gap.stats.frequency.missing.map(f => f[0]))];
    console.log(`   目标频段: ${missingDomains.join(', ') || '全部'}`);

    // 使用 tiered-rss-fetcher 按优先级抓取
    const fetchResult = await tieredRSSFetcher.fetchByMissingFreqs(gap.stats.frequency.missing);
    result.scanned = fetchResult.feedsScanned;
    result.articles = fetchResult.articles.length;

    console.log(`   扫描 ${result.scanned} 个源，获取 ${result.articles} 篇文章`);

    // 处理文章 (AI 分析 + 入库)
    if (fetchResult.articles.length > 0) {
        const insertResult = await processRSSArticles(fetchResult.articles, date, gap);
        result.inserted = insertResult.inserted;
        result.sources = insertResult.sources;
    }

    return result;
}

/**
 * 处理 RSS 文章 (AI 分析 + 入库)
 * @param {Array} articles - 文章列表
 * @param {string} date - 目标日期
 * @param {Object} gap - 配额缺口
 */
async function processRSSArticles(articles, date, gap) {
    const result = { inserted: 0, sources: [] };
    const usedFreqs = new Set(gap.usedFreqs);

    // 按优先级处理文章
    for (const article of articles.slice(0, gap.gap + 2)) {
        // 跳过已处理的 URL
        const exists = await checkUrlExists(article.link);
        if (exists) {
            console.log(`   ⏭️ 跳过已存在: ${article.title?.substring(0, 30)}...`);
            continue;
        }

        // 确定频段 (基于源的 domains)
        const availableDomains = article.source.domains.filter(d => {
            const freqs = [`${d}1`, `${d}2`, `${d}3`];
            return freqs.some(f => !usedFreqs.has(f));
        });

        if (availableDomains.length === 0) {
            console.log(`   ⏭️ 无可用频段: ${article.title?.substring(0, 30)}...`);
            continue;
        }

        // 选择一个可用频段
        const domain = availableDomains[0];
        const availableFreqs = [`${domain}1`, `${domain}2`, `${domain}3`]
            .filter(f => !usedFreqs.has(f));
        const targetFreq = availableFreqs[0];

        try {
            console.log(`   🔍 分析: ${article.title?.substring(0, 40)}... → ${targetFreq}`);

            // AI 分析
            const analyzed = await aiAnalyzer.analyzeRSSArticle({
                title: article.title,
                content: article.content,
                source: article.source.name_cn || article.source.name,
                url: article.link,
                targetFreq
            });

            if (analyzed && analyzed.content && analyzed.content.length >= 500) {
                // 入库
                await pool.query(`
                    INSERT INTO radar_items (date, freq, title, content, tension_question, 
                        tension_a, tension_b, source_url, speaker, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                `, [
                    date,
                    targetFreq,
                    analyzed.title,
                    analyzed.content,
                    analyzed.tension_question || '',
                    analyzed.tension_a || '',
                    analyzed.tension_b || '',
                    article.link,
                    article.source.name_cn || article.source.name
                ]);

                usedFreqs.add(targetFreq);
                result.inserted++;
                result.sources.push(article.source.name);
                console.log(`   ✅ 入库成功: ${targetFreq}`);
            } else {
                console.log(`   ⚠️ 内容不符合要求 (长度: ${analyzed?.content?.length || 0})`);
            }
        } catch (error) {
            console.log(`   ❌ 处理失败: ${error.message}`);
        }

        // 检查是否已达标
        if (result.inserted >= gap.gap) {
            console.log(`   🎯 已填补缺口，停止处理`);
            break;
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
    scanRSSFeeds,
    processRSSArticles
};
