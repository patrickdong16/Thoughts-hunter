#!/usr/bin/env node
/**
 * 回滚 YouTube 互动数据功能
 * 
 * 用法:
 *   DATABASE_URL="..." node backend/scripts/rollback-youtube-engagement.js
 */

const pool = require('../config/database');

async function main() {
    console.log('🔙 回滚 YouTube 互动数据功能\n');

    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        console.log(`🔧 数据库: ${dbUrl.substring(0, 30)}...`);
    } else {
        console.error('❌ DATABASE_URL 未配置');
        process.exit(1);
    }

    try {
        // 删除字段
        console.log('删除数据库字段...');
        await pool.query(`
            ALTER TABLE radar_items DROP COLUMN IF EXISTS yt_view_count;
            ALTER TABLE radar_items DROP COLUMN IF EXISTS yt_like_count;
            ALTER TABLE radar_items DROP COLUMN IF EXISTS yt_comment_count;
            ALTER TABLE radar_items DROP COLUMN IF EXISTS yt_updated_at;
        `);

        // 删除索引
        await pool.query(`
            DROP INDEX IF EXISTS idx_radar_items_yt_view_count;
        `);

        console.log('✅ 数据库字段已删除');
        console.log('\n⚠️  记得手动删除以下文件:');
        console.log('   - backend/services/youtube-engagement.js');
        console.log('   - backend/scripts/update-youtube-engagement.js');
        console.log('   - backend/scripts/rollback-youtube-engagement.js (本文件)');
        console.log('   - backend/database/migrations/add_youtube_engagement.sql');

    } catch (error) {
        console.error('❌ 回滚失败:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
