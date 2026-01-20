#!/usr/bin/env node

// 内容源发现脚本
// Script to discover new content sources
// 用法: node scripts/discover-sources.js [days]
// 示例: node scripts/discover-sources.js 30

require('dotenv').config();
const sourceDiscovery = require('../services/source-discovery');

async function main() {
    try {
        // 从命令行参数获取扫描天数（可选，默认30天）
        const days = parseInt(process.argv[2]) || 30;

        console.log('='.repeat(50));
        console.log('内容源自动发现');
        console.log('='.repeat(50));
        console.log(`扫描范围: 最近 ${days} 天\n`);

        // 执行源发现
        const recommendations = await sourceDiscovery.discoverNewSources(days);

        console.log('\n' + '='.repeat(50));
        console.log('✓ 发现完成');
        console.log(`  - 创建推荐: ${recommendations.length} 条`);
        console.log('='.repeat(50));

        if (recommendations.length > 0) {
            console.log('\n新推荐列表:');
            recommendations.forEach((rec, index) => {
                console.log(`\n${index + 1}. ${rec.name} (${rec.source_type})`);
                console.log(`   理由: ${rec.reason}`);
                console.log(`   发现自: ${rec.discovered_from}`);
            });
        } else {
            console.log('\n未发现新的推荐来源');
        }

        process.exit(0);
    } catch (error) {
        console.error('\n✗ 错误:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
