#!/usr/bin/env node
/**
 * 批量填充 source_url 字段
 * 从 video_id 推断 YouTube URL
 * 用法: DATABASE_URL="postgresql://..." node backend/scripts/fill-source-urls.js
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('❌ 请设置 DATABASE_URL 环境变量');
    process.exit(1);
}

console.log(`🔧 环境: ${DATABASE_URL.substring(0, 30)}...`);

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fillSourceUrls() {
    console.log('\n🔧 批量填充 source_url 字段\n');

    try {
        // 查找有 video_id 但没有 source_url 的内容
        const missing = await pool.query(`
            SELECT id, title, video_id
            FROM radar_items 
            WHERE video_id IS NOT NULL 
              AND video_id != ''
              AND (source_url IS NULL OR source_url = '')
        `);

        console.log(`📊 找到 ${missing.rows.length} 条需要填充的内容\n`);

        if (missing.rows.length === 0) {
            console.log('✅ 所有有 video_id 的内容都已有 source_url');
            return;
        }

        let updated = 0;
        for (const row of missing.rows) {
            const youtubeUrl = `https://www.youtube.com/watch?v=${row.video_id}`;

            await pool.query(
                'UPDATE radar_items SET source_url = $1 WHERE id = $2',
                [youtubeUrl, row.id]
            );

            console.log(`✅ ID:${row.id} → ${youtubeUrl}`);
            updated++;
        }

        console.log(`\n📈 已更新 ${updated} 条记录`);
        console.log('✅ 完成\n');

    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await pool.end();
    }
}

fillSourceUrls();
