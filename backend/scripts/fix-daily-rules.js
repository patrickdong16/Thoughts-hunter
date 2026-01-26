#!/usr/bin/env node
/**
 * 修复每日规则违规问题
 * 
 * 1. 2026-01-22: 删除超标内容（34→8条）
 * 2. 2026-01-23/24: 补充达沃斯主题日内容（8→20条）
 * 3. 清理重复内容
 */

const https = require('https');
const { countVisibleChars, MIN_CONTENT_LENGTH } = require('../utils/char-count');

const API_HOST = 'thoughts-radar-backend-production.up.railway.app';

// 删除内容
function deleteItem(id) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: API_HOST,
            path: `/api/radar/${id}`,
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ success: res.statusCode === 200, status: res.statusCode }));
        });
        req.on('error', reject);
        req.end();
    });
}

// 获取指定日期内容
function fetchDayContent(date) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: API_HOST,
            path: `/api/radar/${date}`,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function fix20260122() {
    console.log('\n📅 修复 2026-01-22 (普通日: 需要8条，覆盖6领域)');
    console.log('='.repeat(50));

    const data = await fetchDayContent('2026-01-22');
    const items = data.items;
    console.log(`当前: ${items.length}条\n`);

    // 按频段分组
    const byFreq = {};
    items.forEach(item => {
        if (!byFreq[item.freq]) byFreq[item.freq] = [];
        byFreq[item.freq].push(item);
    });

    // 每个领域保留1条（优先ID较小的，通常内容质量更好）
    // 目标: T1, T2, P1, P2, H1, Φ2, R2, F1 = 8条
    const keepFreqs = ['T1', 'P1', 'H1', 'Φ2', 'R2', 'F1', 'T2', 'P2'];
    const toKeep = [];
    const toDelete = [];

    keepFreqs.forEach(freq => {
        if (byFreq[freq] && byFreq[freq].length > 0) {
            // 保留ID最小的那条（通常是原始内容）
            const sorted = byFreq[freq].sort((a, b) => a.id - b.id);
            toKeep.push(sorted[0]);
            // 其余标记删除
            sorted.slice(1).forEach(item => toDelete.push(item));
        }
    });

    // 其他频段全部删除
    Object.keys(byFreq).forEach(freq => {
        if (!keepFreqs.includes(freq)) {
            byFreq[freq].forEach(item => toDelete.push(item));
        }
    });

    console.log('✅ 保留的内容:');
    toKeep.forEach(item => {
        console.log(`   [${item.id}] ${item.freq} - ${item.title.substring(0, 40)}...`);
    });

    console.log(`\n❌ 需要删除: ${toDelete.length}条`);

    // 执行删除
    let deleted = 0;
    for (const item of toDelete) {
        console.log(`   删除 [${item.id}] ${item.freq} - ${item.title.substring(0, 30)}...`);
        try {
            const result = await deleteItem(item.id);
            if (result.success) {
                deleted++;
            } else {
                console.log(`      ⚠️ 删除失败: ${result.status}`);
            }
        } catch (e) {
            console.log(`      ⚠️ 错误: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`\n✅ 成功删除: ${deleted}/${toDelete.length}条`);
    console.log(`📊 2026-01-22 现在应有: ${toKeep.length}条`);
}

async function main() {
    console.log('='.repeat(60));
    console.log('🔧 修复每日规则违规');
    console.log('='.repeat(60));

    try {
        // 第一步: 修复2026-01-22超标问题
        await fix20260122();

        console.log('\n' + '='.repeat(60));
        console.log('✅ 修复完成');
        console.log('='.repeat(60));
        console.log('\n下一步: 为达沃斯主题日(2026-01-23/24)补充内容');

    } catch (error) {
        console.error('❌ 执行失败:', error.message);
        process.exit(1);
    }
}

main();
