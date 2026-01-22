/**
 * 日期规则加载器 (Day Rules Loader)
 * 
 * 根据日期返回对应的发布规则：
 * - 普通日：使用 defaultRules
 * - 主题日：使用 themeDays 中的配置覆盖
 * 
 * 使用方式：
 * const { getRulesForDate, getTodayRules } = require('./day-rules');
 * const rules = getRulesForDate('2026-01-22');
 */

const path = require('path');
const fs = require('fs');

// 配置文件路径
const CONFIG_PATH = path.join(__dirname, 'day-config.json');

/**
 * 加载配置（支持热更新）
 */
function loadConfig() {
    try {
        // 清除缓存以支持热加载
        delete require.cache[require.resolve(CONFIG_PATH)];
        return require(CONFIG_PATH);
    } catch (error) {
        console.error('Failed to load day-config.json:', error.message);
        // 返回安全默认值
        return {
            defaultRules: {
                maxItems: 8,
                minItems: 6,
                freqBalance: true,
                maxPerFreq: 1,
                maxVideos: 2,
                minContentLength: 300
            },
            themeDays: []
        };
    }
}

/**
 * 获取指定日期的发布规则
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {Object} 规则对象
 */
function getRulesForDate(dateStr) {
    const config = loadConfig();

    // 查找是否是主题日
    const themeDay = config.themeDays.find(td =>
        td.dates && td.dates.includes(dateStr)
    );

    if (themeDay) {
        // 主题日：合并默认规则和主题日特定规则
        return {
            isThemeDay: true,
            event: themeDay.event,
            eventEn: themeDay.eventEn || themeDay.event,
            rules: { ...config.defaultRules, ...themeDay.rules },
            focus: themeDay.focus || null
        };
    }

    // 普通日：返回默认规则
    return {
        isThemeDay: false,
        event: null,
        eventEn: null,
        rules: config.defaultRules,
        focus: null
    };
}

/**
 * 获取今日的发布规则（使用北京时区）
 * @returns {Object} 规则对象
 */
function getTodayRules() {
    // 使用北京时区 (UTC+8)
    const now = new Date();
    const beijingOffset = 8 * 60; // 分钟
    const utcOffset = now.getTimezoneOffset(); // 分钟
    const beijingTime = new Date(now.getTime() + (beijingOffset + utcOffset) * 60 * 1000);
    const today = beijingTime.toISOString().split('T')[0];

    return getRulesForDate(today);
}

/**
 * 获取原始配置（用于管理界面）
 * @returns {Object} 完整配置
 */
function getConfig() {
    return loadConfig();
}

/**
 * 验证日期是否可以添加更多内容
 * @param {string} dateStr - 日期
 * @param {number} currentCount - 当前已有内容数
 * @returns {Object} { canAdd: boolean, reason: string|null, remaining: number }
 */
function canAddContent(dateStr, currentCount) {
    const dayRules = getRulesForDate(dateStr);
    const maxItems = dayRules.rules.maxItems;

    if (currentCount >= maxItems) {
        return {
            canAdd: false,
            reason: `已达当日上限 ${maxItems} 条（${dayRules.isThemeDay ? '主题日' : '普通日'}）`,
            remaining: 0
        };
    }

    return {
        canAdd: true,
        reason: null,
        remaining: maxItems - currentCount
    };
}

/**
 * 验证频段是否可以添加更多内容
 * @param {string} dateStr - 日期
 * @param {string} freq - 频段
 * @param {number} freqCount - 该频段当前数量
 * @returns {Object} { canAdd: boolean, reason: string|null }
 */
function canAddToFreq(dateStr, freq, freqCount) {
    const dayRules = getRulesForDate(dateStr);
    const maxPerFreq = dayRules.rules.maxPerFreq;

    // null 表示不限制
    if (maxPerFreq === null) {
        return { canAdd: true, reason: null };
    }

    if (freqCount >= maxPerFreq) {
        return {
            canAdd: false,
            reason: `普通日每频段限 ${maxPerFreq} 条，${freq} 已满`
        };
    }

    return { canAdd: true, reason: null };
}

module.exports = {
    getRulesForDate,
    getTodayRules,
    getConfig,
    canAddContent,
    canAddToFreq
};
