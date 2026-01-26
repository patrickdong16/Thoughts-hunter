#!/usr/bin/env node
/**
 * 删除虚构的达沃斯内容
 * 删除 2026-01-23 和 2026-01-24 中所有 source 包含 weforum.org 的条目
 */

const https = require('https');
const API_HOST = 'thoughts-radar-backend-production.up.railway.app';

function deleteItem(id) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: API_HOST,
            path: `/api/radar/${id}`,
            method: 'DELETE'
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve({ status: res.statusCode, id }));
        });
        req.on('error', reject);
        req.end();
    });
}

function getAllContent() {
    return new Promise((resolve, reject) => {
        https.get(`https://${API_HOST}/api/radar/all/grouped`, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('='.repeat(50));
    console.log('🗑️  删除虚构达沃斯内容');
    console.log('='.repeat(50));

    const data = await getAllContent();

    // 找出 2026-01-23 和 2026-01-24 中来源为 weforum.org 的条目
    const toDelete = [];
    const targetDates = ['2026-01-23', '2026-01-24'];

    for (const date of targetDates) {
        const items = data.grouped?.[date] || [];
        console.log(`\n📅 ${date}: ${items.length} 条`);

        for (const item of items) {
            if (item.source && item.source.includes('weforum.org')) {
                console.log(`   🔴 [${item.id}] ${item.author_name}: ${item.title?.substring(0, 30)}...`);
                toDelete.push(item.id);
            } else {
                console.log(`   ✅ [${item.id}] ${item.author_name}: 保留 (非WEF来源)`);
            }
        }
    }

    console.log(`\n待删除: ${toDelete.length} 条`);

    if (toDelete.length === 0) {
        console.log('没有需要删除的内容');
        return;
    }

    console.log('\n开始删除...');
    let deleted = 0, failed = 0;

    for (const id of toDelete) {
        try {
            const result = await deleteItem(id);
            if (result.status === 200 || result.status === 204) {
                console.log(`   ✅ 删除 ID ${id}`);
                deleted++;
            } else {
                console.log(`   ❌ 失败 ID ${id}: ${result.status}`);
                failed++;
            }
        } catch (e) {
            console.log(`   ❌ 错误 ID ${id}: ${e.message}`);
            failed++;
        }
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ 删除成功: ${deleted}`);
    console.log(`❌ 删除失败: ${failed}`);
    console.log('='.repeat(50));
}

main().catch(console.error);
