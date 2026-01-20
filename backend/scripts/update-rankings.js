#!/usr/bin/env node

// 内容源排名更新脚本
// Script to update source rankings
// 用法: node scripts/update-rankings.js [month]
// 示例: node scripts/update-rankings.js 2026-01-01

require('dotenv').config();
const sourceRanker = require('../services/source-ranker');

async function main() {
    try {
        // 从命令行参数获取月份（可选）
        const month = process.argv[2] || null;

        console.log('='.repeat(50));
        console.log('内容源排名更新');
        console.log('='.repeat(50));

        if (month) {
            console.log(`指定月份: ${month}`);
        } else {
            console.log('使用当前月份');
        }

        // 执行排名更新
        const result = await sourceRanker.updateAllRankings(month);

        console.log('\n✓ 更新完成');
        console.log(`  - 成功更新: ${result.updated} 个来源`);
        console.log(`  - 失败: ${result.failed} 个来源`);
        console.log(`  - 月份: ${result.month}`);

        process.exit(0);
    } catch (error) {
        console.error('\n✗ 错误:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
