/**
 * 清理今天的低质量英文内容
 * Run: node backend/scripts/cleanup-today-content.js
 */
require('dotenv').config();
const { Pool } = require('pg');

// Railway Postgres 不需要 SSL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    const date = '2026-01-28';

    console.log(`🔍 检查 ${date} 内容...`);
    console.log(`📌 数据库: ${process.env.DATABASE_URL?.substring(0, 30)}...`);

    // 查看当前内容
    const { rows: existing } = await pool.query(
        'SELECT id, title, author_name, freq FROM radar_items WHERE date = $1',
        [date]
    );

    console.log(`\n📊 当前 ${existing.length} 条内容:`);
    existing.forEach(r => {
        console.log(`  [${r.freq}] ${r.author_name}: ${r.title?.substring(0, 40)}...`);
    });

    if (existing.length === 0) {
        console.log('✅ 无内容需要清理');
        process.exit(0);
    }

    // 删除所有今天的内容
    const { rowCount } = await pool.query(
        'DELETE FROM radar_items WHERE date = $1',
        [date]
    );

    console.log(`\n🗑️ 已删除 ${rowCount} 条内容`);

    await pool.end();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
