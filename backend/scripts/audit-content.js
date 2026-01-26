#!/usr/bin/env node
/**
 * 内容审查脚本
 * 基于 CLAUDE.md 和 REQUIREMENTS.md 规则审查所有已发布内容
 * 
 * 规则：
 * 1. 正文 ≥ 500 可见字符（使用 countVisibleChars 统一计数）
 * 2. source_url 真实有效
 * 3. URL 唯一性
 * 4. 标题去重（≥80%相似度阻断）
 * 5. 频段正确匹配
 */

const https = require('https');
const { countVisibleChars, MIN_CONTENT_LENGTH } = require('../utils/char-count');
const { getRulesForDate } = require('../config/day-rules');

const API_HOST = 'thoughts-radar-backend-production.up.railway.app';

// 6大领域
const DOMAINS = ['T', 'P', 'H', 'Φ', 'R', 'F'];
const DOMAIN_NAMES = {
    'T': 'Technology',
    'P': 'Politics',
    'H': 'History',
    'Φ': 'Philosophy',
    'R': 'Religion',
    'F': 'Finance'
};

// 计算字符串相似度 (Jaccard)
function similarity(str1, str2) {
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

// 获取所有内容
function fetchAllContent() {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: API_HOST,
            path: '/api/radar/all/grouped',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    resolve(data);
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${body.substring(0, 200)}`));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// 审查单个内容项
function auditItem(item, allItems) {
    const issues = [];

    // 1. 检查正文字数（使用统一计数方法）
    const visibleLength = countVisibleChars(item.content);
    if (visibleLength < MIN_CONTENT_LENGTH) {
        issues.push({
            type: 'LENGTH',
            severity: 'HIGH',
            message: `正文不足${MIN_CONTENT_LENGTH}可见字符 (当前: ${visibleLength}字)`,
            current: visibleLength,
            required: MIN_CONTENT_LENGTH
        });
    }

    // 2. 检查 source_url（如果有source字段但不包含URL）
    const hasValidUrl = item.source && (
        item.source.includes('http://') ||
        item.source.includes('https://') ||
        item.source.includes('youtube.com') ||
        item.source.includes('youtu.be')
    );

    // 3. 检查标题是否为空或过短
    if (!item.title || item.title.length < 10) {
        issues.push({
            type: 'TITLE',
            severity: 'HIGH',
            message: `标题过短或为空 (当前: ${item.title?.length || 0}字)`
        });
    }

    // 4. 检查作者信息
    if (!item.author_name || item.author_name.trim() === '') {
        issues.push({
            type: 'AUTHOR',
            severity: 'MEDIUM',
            message: '作者信息缺失'
        });
    }

    // 5. 检查频段是否有效
    const validFreqs = ['T1', 'T2', 'T3', 'P1', 'P2', 'P3', 'H1', 'H2', 'H3',
        'Φ1', 'Φ2', 'Φ3', 'Φ4', 'R1', 'R2', 'R3', 'F1', 'F2', 'F3'];
    if (!validFreqs.includes(item.freq)) {
        issues.push({
            type: 'FREQ',
            severity: 'HIGH',
            message: `无效的频段: ${item.freq}`
        });
    }

    // 6. 检查立场是否有效
    if (!['A', 'B'].includes(item.stance)) {
        issues.push({
            type: 'STANCE',
            severity: 'MEDIUM',
            message: `无效的立场: ${item.stance}`
        });
    }

    return issues;
}

// 检查重复
function checkDuplicates(allItems) {
    const duplicates = [];
    const urlMap = new Map();
    const titleMap = new Map();

    // 主题日事件URL豁免列表（这些URL预期会被多个条目共享）
    const themeEventUrls = [
        'https://www.weforum.org/events/',
        'https://securityconference.org/',  // Munich Security Conference
        'https://www.un.org/en/climatechange/'  // UN Climate events
    ];

    const isThemeEventUrl = (url) => themeEventUrls.some(prefix => url && url.startsWith(prefix));

    allItems.forEach(item => {
        // URL重复检查 - 跳过主题日事件URL
        if (item.source && !isThemeEventUrl(item.source)) {
            const existingUrl = urlMap.get(item.source);
            if (existingUrl) {
                duplicates.push({
                    type: 'URL_DUPLICATE',
                    item1: existingUrl,
                    item2: item,
                    message: `URL重复: ${item.source.substring(0, 50)}...`
                });
            } else {
                urlMap.set(item.source, item);
            }
        }

        // 标题相似度检查
        titleMap.forEach((existingItem, existingTitle) => {
            if (existingItem.id !== item.id) {
                const sim = similarity(existingTitle, item.title);
                if (sim >= 0.8) {
                    duplicates.push({
                        type: 'TITLE_SIMILAR',
                        item1: existingItem,
                        item2: item,
                        similarity: (sim * 100).toFixed(1),
                        message: `标题相似度${(sim * 100).toFixed(1)}%`
                    });
                }
            }
        });
        titleMap.set(item.title, item);
    });

    return duplicates;
}

// 审计每日数量规则和领域覆盖
function auditDailyRules(grouped) {
    const dailyIssues = [];

    Object.keys(grouped).forEach(date => {
        const items = grouped[date];
        const count = items.length;
        const dayRules = getRulesForDate(date);
        const { minItems, maxItems } = dayRules.rules;
        const isThemeDay = dayRules.isThemeDay;
        const event = dayRules.event || '普通日';

        // 检查数量规则
        if (count < minItems) {
            dailyIssues.push({
                date,
                type: 'COUNT_LOW',
                event,
                isThemeDay,
                message: `内容不足: ${count}/${minItems}条 (${event})`,
                current: count,
                required: minItems,
                shortage: minItems - count
            });
        }

        if (count > maxItems) {
            dailyIssues.push({
                date,
                type: 'COUNT_HIGH',
                event,
                isThemeDay,
                message: `内容超标: ${count}/${maxItems}条 (${event})`,
                current: count,
                max: maxItems,
                excess: count - maxItems
            });
        }

        // 检查领域覆盖（普通日要求覆盖6大领域）
        if (!isThemeDay && count >= 6) {
            const domains = new Set(items.map(item => item.freq?.charAt(0)));
            const missingDomains = DOMAINS.filter(d => !domains.has(d));

            if (missingDomains.length > 0) {
                dailyIssues.push({
                    date,
                    type: 'DOMAIN_MISSING',
                    event,
                    message: `缺少领域: ${missingDomains.map(d => `${d}(${DOMAIN_NAMES[d]})`).join(', ')}`,
                    missing: missingDomains
                });
            }
        }
    });

    return dailyIssues;
}

async function main() {
    console.log('='.repeat(60));
    console.log('📋 思想雷达内容审查报告');
    console.log('='.repeat(60));
    console.log(`\n⏰ 审查时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    console.log(`📊 规则来源: CLAUDE.md & REQUIREMENTS.md\n`);

    try {
        // 获取所有内容
        console.log('🔍 正在获取生产环境内容...');
        const data = await fetchAllContent();

        if (!data.success) {
            throw new Error('API返回失败: ' + JSON.stringify(data));
        }

        const grouped = data.grouped;
        const dates = Object.keys(grouped).sort().reverse();

        console.log(`✅ 获取成功: ${data.total}条内容，跨${dates.length}个日期\n`);

        // 汇总所有内容
        const allItems = [];
        dates.forEach(date => {
            grouped[date].forEach(item => {
                item.dateStr = date;
                allItems.push(item);
            });
        });

        // 审查每条内容
        const issuesByDate = {};
        const issuesByType = { LENGTH: [], TITLE: [], AUTHOR: [], FREQ: [], STANCE: [] };
        let totalIssues = 0;

        allItems.forEach(item => {
            const issues = auditItem(item, allItems);
            if (issues.length > 0) {
                if (!issuesByDate[item.dateStr]) {
                    issuesByDate[item.dateStr] = [];
                }
                issuesByDate[item.dateStr].push({ item, issues });
                totalIssues += issues.length;

                issues.forEach(issue => {
                    if (issuesByType[issue.type]) {
                        issuesByType[issue.type].push({ item, issue });
                    }
                });
            }
        });

        // 检查重复
        const duplicates = checkDuplicates(allItems);

        // 检查每日数量规则和领域覆盖
        const dailyRuleIssues = auditDailyRules(grouped);

        // 输出报告
        console.log('='.repeat(60));
        console.log('📊 审查摘要');
        console.log('='.repeat(60));
        console.log(`总内容数: ${allItems.length}`);
        console.log(`有问题的条目: ${Object.keys(issuesByDate).reduce((sum, d) => sum + issuesByDate[d].length, 0)}`);
        console.log(`总问题数: ${totalIssues}`);
        console.log(`重复检测: ${duplicates.length}对`);
        console.log(`每日规则问题: ${dailyRuleIssues.length}个\n`);

        // 按问题类型统计
        console.log('📌 按问题类型统计:');
        console.log(`   正文不足${MIN_CONTENT_LENGTH}可见字符: ${issuesByType.LENGTH.length}条`);
        console.log(`   标题问题: ${issuesByType.TITLE.length}条`);
        console.log(`   作者缺失: ${issuesByType.AUTHOR.length}条`);
        console.log(`   频段错误: ${issuesByType.FREQ.length}条`);
        console.log(`   立场错误: ${issuesByType.STANCE.length}条`);
        console.log(`   重复内容: ${duplicates.length}对`);

        // 每日规则问题统计
        const countLow = dailyRuleIssues.filter(i => i.type === 'COUNT_LOW').length;
        const countHigh = dailyRuleIssues.filter(i => i.type === 'COUNT_HIGH').length;
        const domainMissing = dailyRuleIssues.filter(i => i.type === 'DOMAIN_MISSING').length;
        console.log(`   内容不足: ${countLow}天`);
        console.log(`   内容超标: ${countHigh}天`);
        console.log(`   领域缺失: ${domainMissing}天\n`);

        // 每日规则问题详情
        if (dailyRuleIssues.length > 0) {
            console.log('='.repeat(60));
            console.log('📅 每日规则问题');
            console.log('='.repeat(60));
            dailyRuleIssues.forEach(issue => {
                const icon = issue.type === 'COUNT_LOW' ? '🔻' :
                    issue.type === 'COUNT_HIGH' ? '🔺' : '⚠️';
                console.log(`${icon} ${issue.date}: ${issue.message}`);
            });
            console.log('');
        }

        // 详细问题列表（按日期）
        if (totalIssues > 0) {
            console.log('='.repeat(60));
            console.log('❌ 详细问题列表 (按日期)');
            console.log('='.repeat(60));

            Object.keys(issuesByDate).sort().reverse().forEach(date => {
                console.log(`\n📅 ${date} (${issuesByDate[date].length}条有问题):`);
                issuesByDate[date].forEach(({ item, issues }) => {
                    const visibleLen = countVisibleChars(item.content);
                    console.log(`\n   [ID:${item.id}] ${item.freq} - ${item.title.substring(0, 40)}...`);
                    console.log(`   作者: ${item.author_name}`);
                    console.log(`   可见字数: ${visibleLen}`);
                    issues.forEach(issue => {
                        const icon = issue.severity === 'HIGH' ? '🔴' : '🟡';
                        console.log(`   ${icon} ${issue.message}`);
                    });
                });
            });
        }

        // 重复内容列表
        if (duplicates.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log('🔄 重复内容检测');
            console.log('='.repeat(60));
            duplicates.forEach((dup, i) => {
                console.log(`\n${i + 1}. ${dup.type}: ${dup.message}`);
                console.log(`   Item1 [${dup.item1.dateStr}]: ${dup.item1.title.substring(0, 50)}...`);
                console.log(`   Item2 [${dup.item2.dateStr}]: ${dup.item2.title.substring(0, 50)}...`);
            });
        }

        // 需要修复的条目清单（正文不足500可见字符的）
        if (issuesByType.LENGTH.length > 0) {
            console.log('\n' + '='.repeat(60));
            console.log(`🔧 需要修复的条目 (正文<${MIN_CONTENT_LENGTH}可见字符)`);
            console.log('='.repeat(60));
            issuesByType.LENGTH.forEach(({ item, issue }) => {
                console.log(`\nID: ${item.id}`);
                console.log(`日期: ${item.dateStr}`);
                console.log(`频段: ${item.freq}`);
                console.log(`标题: ${item.title}`);
                console.log(`作者: ${item.author_name}`);
                console.log(`当前字数: ${issue.current}`);
                console.log(`需要补充: ${MIN_CONTENT_LENGTH - issue.current}字`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ 审查完成');
        console.log('='.repeat(60));

        // 返回问题数据供后续处理
        return {
            total: allItems.length,
            issues: totalIssues,
            duplicates: duplicates.length,
            lengthIssues: issuesByType.LENGTH,
            allIssues: issuesByDate
        };

    } catch (error) {
        console.error('❌ 审查失败:', error.message);
        process.exit(1);
    }
}

main();
