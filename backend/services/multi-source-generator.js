/**
 * 多来源内容生成器
 * Multi-Source Content Generator
 * 
 * 支持3种内容来源：
 * 1. 实时Web搜索 - 思想圈主流网站/刊物/会议
 * 2. YouTube搜索 - 目标频道和人物
 * 3. RSS/HN订阅 - 主流杂志和核心人物博客
 * 
 * 注意：此服务不直接调用MCP，而是准备搜索查询
 * 实际的MCP调用由automation路由通过Claude完成
 */

const pool = require('../config/database');
const { getRulesForDate } = require('../config/day-rules');
const automationConfig = require('../config/automation');

/**
 * 计算当日内容缺口 (v2.0)
 * @param {string} date - YYYY-MM-DD格式日期
 * @returns {Promise<Object>} 缺口信息
 */
async function getContentGap(date) {
    const dayRules = getRulesForDate(date);
    const rules = dayRules.rules || {};

    // 获取当日所有内容
    const { rows: items } = await pool.query(
        `SELECT id, freq, source_url FROM radar_items WHERE date = $1`,
        [date]
    );

    const currentCount = items.length;

    // 统计视频和非视频内容
    const videoItems = items.filter(item =>
        item.source_url && (
            item.source_url.includes('youtube.com') ||
            item.source_url.includes('youtu.be')
        )
    );
    const nonVideoItems = items.filter(item =>
        !item.source_url || !(
            item.source_url.includes('youtube.com') ||
            item.source_url.includes('youtu.be')
        )
    );

    // 获取已占用的频段
    const usedFreqs = new Set(items.map(r => r.freq));

    // 所有19个频段
    const allFreqs = [
        'T1', 'T2', 'T3',
        'P1', 'P2', 'P3',
        'H1', 'H2', 'H3',
        'Φ1', 'Φ2', 'Φ3',
        'R1', 'R2',
        'F1', 'F2',
        'X1', 'X2', 'X3'
    ];

    // 核心频段 (6个领域各一个)
    const coreFreqs = ['T1', 'P1', 'H1', 'Φ1', 'F1', 'R1'];
    const missingCoreFreqs = coreFreqs.filter(f => !usedFreqs.has(f));

    const availableFreqs = allFreqs.filter(f => !usedFreqs.has(f));

    // v2.0 配额计算
    const minItems = rules.minItems || automationConfig.dailyQuota.minTotal;
    const maxItems = rules.maxItems || automationConfig.dailyQuota.maxTotal;
    const minNonVideoItems = rules.minNonVideoItems || 5;
    const minVideoItems = rules.minVideoItems || 1;
    const minPerFrequency = rules.minPerFrequency || 1;

    // 计算各类型缺口
    const nonVideoGap = Math.max(0, minNonVideoItems - nonVideoItems.length);
    const videoGap = Math.max(0, minVideoItems - videoItems.length);
    const totalGap = Math.max(0, minItems - currentCount);
    const frequencyGap = rules.frequencyFlex ? 0 : missingCoreFreqs.length;

    return {
        date,
        isThemeDay: dayRules.isThemeDay,
        event: dayRules.event || null,

        // 总体统计
        currentCount,
        minItems,
        maxItems,
        gap: totalGap,
        needsMore: currentCount < minItems,

        // v2.0 详细统计
        stats: {
            video: {
                count: videoItems.length,
                min: minVideoItems,
                gap: videoGap
            },
            nonVideo: {
                count: nonVideoItems.length,
                min: minNonVideoItems,
                max: rules.maxNonVideoItems || 7,
                gap: nonVideoGap
            },
            frequency: {
                used: [...usedFreqs],
                missing: missingCoreFreqs,
                gap: frequencyGap
            }
        },

        // 配额灵活性
        flex: {
            contentType: rules.contentTypeFlex || false,
            frequency: rules.frequencyFlex || false
        },

        usedFreqs: [...usedFreqs],
        availableFreqs
    };
}

/**
 * 生成Web搜索查询列表
 * 基于核心人物和主题生成搜索查询
 * @param {Object} gap - 内容缺口信息
 * @returns {Array} 搜索查询列表
 */
function generateWebSearchQueries(gap) {
    const queries = [];
    const speakers = automationConfig.targetSpeakers || [];

    // 根据可用频段选择对应领域的人物
    const domainMapping = {
        'T': 'tech',
        'P': 'politics',
        'H': 'history',
        'Φ': 'philosophy',
        'R': 'religion',
        'F': 'finance'
    };

    for (const freq of gap.availableFreqs.slice(0, gap.gap + 2)) {
        const domain = domainMapping[freq[0]];
        if (!domain) continue;

        // 找该领域的高优先级人物
        const domainSpeakers = speakers
            .filter(s => s.domain === domain)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0))
            .slice(0, 3);

        for (const speaker of domainSpeakers) {
            queries.push({
                query: `${speaker.name} interview speech 2026 OR 2025`,
                speaker: speaker.name,
                domain,
                freq,
                type: 'web'
            });
        }
    }

    // 主题日特殊查询
    if (gap.isThemeDay && gap.event) {
        queries.unshift({
            query: `${gap.event} keynote speech highlights`,
            domain: 'event',
            freq: null,
            type: 'web'
        });
    }

    return queries.slice(0, 10); // 限制查询数量
}

/**
 * 生成YouTube搜索查询列表
 * @param {Object} gap - 内容缺口信息
 * @returns {Array} YouTube搜索查询列表
 */
function generateYouTubeQueries(gap) {
    const queries = [];
    const channels = automationConfig.targetChannels || [];
    const speakers = automationConfig.targetSpeakers || [];

    const domainMapping = {
        'T': 'tech',
        'P': 'politics',
        'H': 'history',
        'Φ': 'philosophy',
        'R': 'religion',
        'F': 'finance'
    };

    for (const freq of gap.availableFreqs.slice(0, gap.gap)) {
        const domain = domainMapping[freq[0]];
        if (!domain) continue;

        // 该领域的频道
        const domainChannels = channels
            .filter(c => c.defaultDomain === domain)
            .slice(0, 2);

        for (const channel of domainChannels) {
            queries.push({
                query: `${channel.name} latest`,
                channel: channel.name,
                channelId: channel.channelId,
                domain,
                freq,
                type: 'youtube'
            });
        }

        // 该领域的人物
        const domainSpeakers = speakers
            .filter(s => s.domain === domain)
            .slice(0, 2);

        for (const speaker of domainSpeakers) {
            queries.push({
                query: `${speaker.name} interview 2026`,
                speaker: speaker.name,
                domain,
                freq,
                type: 'youtube'
            });
        }
    }

    return queries.slice(0, 8);
}

/**
 * 生成RSS订阅源列表
 * @returns {Array} RSS源列表
 */
function getRSSSources() {
    // 思想类杂志和博客的RSS源
    return [
        // 政治/国际
        { name: 'Foreign Affairs', url: 'https://www.foreignaffairs.com/rss.xml', domain: 'politics' },
        { name: 'The Atlantic', url: 'https://www.theatlantic.com/feed/all/', domain: 'politics' },
        { name: 'Project Syndicate', url: 'https://www.project-syndicate.org/rss', domain: 'politics' },

        // 技术/AI
        { name: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', domain: 'tech' },
        { name: 'Wired', url: 'https://www.wired.com/feed/rss', domain: 'tech' },

        // 经济/金融
        { name: 'The Economist', url: 'https://www.economist.com/rss', domain: 'finance' },
        { name: 'Financial Times', url: 'https://www.ft.com/rss/home', domain: 'finance' },

        // 哲学/思想
        { name: 'Aeon', url: 'https://aeon.co/feed.rss', domain: 'philosophy' },
        { name: 'The New Yorker', url: 'https://www.newyorker.com/feed/everything', domain: 'philosophy' }
    ];
}

/**
 * 生成HN搜索查询
 * @param {Object} gap - 内容缺口信息
 * @returns {Array} HN搜索查询
 */
function generateHNQueries(gap) {
    const queries = [];

    const topicsByDomain = {
        tech: ['artificial intelligence', 'machine learning', 'AGI', 'AI safety'],
        politics: ['democracy', 'geopolitics', 'international relations'],
        philosophy: ['consciousness', 'ethics', 'meaning'],
        finance: ['economy', 'cryptocurrency', 'markets']
    };

    const domainMapping = {
        'T': 'tech',
        'P': 'politics',
        'H': 'philosophy', // history often discussed in philosophy context on HN
        'Φ': 'philosophy',
        'F': 'finance'
    };

    for (const freq of gap.availableFreqs.slice(0, 3)) {
        const domain = domainMapping[freq[0]];
        if (!domain || !topicsByDomain[domain]) continue;

        const topics = topicsByDomain[domain];
        queries.push({
            query: topics[Math.floor(Math.random() * topics.length)],
            domain,
            freq,
            type: 'hackernews'
        });
    }

    return queries;
}

/**
 * 获取完整的多来源搜索计划
 * @param {string} date - YYYY-MM-DD格式日期
 * @returns {Promise<Object>} 搜索计划
 */
async function getSearchPlan(date) {
    const gap = await getContentGap(date);

    if (!gap.needsMore) {
        return {
            success: true,
            message: '今日内容已达标，无需搜索',
            gap,
            searches: []
        };
    }

    const webQueries = generateWebSearchQueries(gap);
    const youtubeQueries = generateYouTubeQueries(gap);
    const rssSources = getRSSSources();
    const hnQueries = generateHNQueries(gap);

    return {
        success: true,
        date,
        gap,
        searches: {
            web: webQueries,
            youtube: youtubeQueries,
            rss: rssSources,
            hackernews: hnQueries
        },
        totalQueries: webQueries.length + youtubeQueries.length + rssSources.length + hnQueries.length
    };
}

/**
 * 从视频采集队列获取待处理视频
 * (保留现有逻辑的兼容接口)
 * @returns {Promise<Array>} 待处理视频列表
 */
async function getFromVideoQueue() {
    const beijingDate = new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Shanghai'
    });
    const dayRules = getRulesForDate(beijingDate);
    const minDuration = dayRules.rules?.minDuration || 40;

    const { rows: pendingVideos } = await pool.query(`
        SELECT cl.*, cs.name as source_name, cs.default_domain
        FROM collection_log cl
        LEFT JOIN content_sources cs ON cl.source_id = cs.id
        WHERE cl.analyzed = false
        ORDER BY cl.checked_at DESC
        LIMIT 50
    `);

    // 按时长筛选
    const eligible = pendingVideos.filter(video => {
        const durationMatch = video.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!durationMatch) return false;
        const hours = parseInt(durationMatch[1]) || 0;
        const minutes = parseInt(durationMatch[2]) || 0;
        const totalMinutes = hours * 60 + minutes;
        return totalMinutes >= minDuration;
    });

    return eligible;
}

module.exports = {
    getContentGap,
    generateWebSearchQueries,
    generateYouTubeQueries,
    getRSSSources,
    generateHNQueries,
    getSearchPlan,
    getFromVideoQueue
};
