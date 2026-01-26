#!/usr/bin/env node
/**
 * 更新 YouTube 互动数据 (测试脚本)
 * 
 * 用法:
 *   DATABASE_URL="..." YOUTUBE_API_KEY="..." node backend/scripts/update-youtube-engagement.js
 * 
 * 回滚: 删除此文件和 services/youtube-engagement.js
 */

const path = require('path');
// 尝试从 backend 目录加载 .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { updateAllEngagement, getEngagementStats, getTopByViews } = require('../services/youtube-engagement');
const pool = require('../config/database');

async function main() {
    console.log('🎬 YouTube 互动数据更新工具\n');
    console.log('='.repeat(50));

    // 环境检查
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        console.log(`🔧 数据库: ${dbUrl.substring(0, 30)}...`);
    } else {
        console.error('❌ DATABASE_URL 未配置');
        process.exit(1);
    }

    if (!process.env.YOUTUBE_API_KEY) {
        console.error('❌ YOUTUBE_API_KEY 未配置');
        process.exit(1);
    }
    console.log('✅ YOUTUBE_API_KEY 已配置\n');

    try {
        // 1. 执行更新
        const updateResult = await updateAllEngagement();

        // 2. 显示统计
        console.log('\n📊 整体统计:');
        const stats = await getEngagementStats();
        console.log(`   总内容数: ${stats.total_items}`);
        console.log(`   有互动数据: ${stats.with_engagement}`);
        console.log(`   总观看量: ${parseInt(stats.total_views || 0).toLocaleString()}`);
        console.log(`   平均观看: ${parseInt(stats.avg_views || 0).toLocaleString()}`);
        console.log(`   最高观看: ${parseInt(stats.max_views || 0).toLocaleString()}`);
        console.log(`   总点赞: ${parseInt(stats.total_likes || 0).toLocaleString()}`);
        console.log(`   总评论: ${parseInt(stats.total_comments || 0).toLocaleString()}`);

        // 3. 显示热度排行
        console.log('\n🔥 热度 Top 5:');
        const topItems = await getTopByViews(5);
        topItems.forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.title.substring(0, 40)}...`);
            console.log(`      👁️ ${parseInt(item.yt_view_count).toLocaleString()} | 👍 ${item.yt_like_count} | 💬 ${item.yt_comment_count}`);
        });

        console.log('\n✅ 完成!\n');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
