#!/usr/bin/env node
/**
 * 审计现有内容的来源信息填充情况
 * 用法: DATABASE_URL="postgresql://..." node backend/scripts/audit-source-info.js
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

async function auditSourceInfo() {
    console.log('\n📊 来源信息审计报告\n');
    console.log('='.repeat(60));

    try {
        // 1. 总体统计
        const total = await pool.query('SELECT COUNT(*) as count FROM radar_items');
        const withSource = await pool.query("SELECT COUNT(*) as count FROM radar_items WHERE source IS NOT NULL AND source != ''");
        const withSourceUrl = await pool.query("SELECT COUNT(*) as count FROM radar_items WHERE source_url IS NOT NULL AND source_url != ''");
        const complete = await pool.query("SELECT COUNT(*) as count FROM radar_items WHERE source IS NOT NULL AND source != '' AND source_url IS NOT NULL AND source_url != ''");

        const totalCount = parseInt(total.rows[0].count);
        const sourceCount = parseInt(withSource.rows[0].count);
        const sourceUrlCount = parseInt(withSourceUrl.rows[0].count);
        const completeCount = parseInt(complete.rows[0].count);

        console.log('\n📈 填充率统计:\n');
        console.log(`   总内容数:          ${totalCount} 条`);
        console.log(`   有 source:         ${sourceCount} 条 (${(sourceCount / totalCount * 100).toFixed(1)}%)`);
        console.log(`   有 source_url:     ${sourceUrlCount} 条 (${(sourceUrlCount / totalCount * 100).toFixed(1)}%)`);
        console.log(`   两字段均有:        ${completeCount} 条 (${(completeCount / totalCount * 100).toFixed(1)}%)`);
        console.log(`   需补充 source:     ${totalCount - sourceCount} 条`);
        console.log(`   需补充 source_url: ${totalCount - sourceUrlCount} 条`);

        // 2. 按日期统计
        console.log('\n📅 按日期统计 (最近10天):\n');
        const byDate = await pool.query(`
            SELECT 
                date,
                COUNT(*) as total,
                COUNT(CASE WHEN source IS NOT NULL AND source != '' THEN 1 END) as has_source,
                COUNT(CASE WHEN source_url IS NOT NULL AND source_url != '' THEN 1 END) as has_url
            FROM radar_items 
            GROUP BY date 
            ORDER BY date DESC 
            LIMIT 10
        `);

        console.log('   日期        | 总数 | 有source | 有url');
        console.log('   ' + '-'.repeat(45));
        byDate.rows.forEach(row => {
            console.log(`   ${row.date.toISOString().split('T')[0]} |  ${row.total.toString().padStart(2)}  |    ${row.has_source.toString().padStart(2)}    |   ${row.has_url.toString().padStart(2)}`);
        });

        // 3. 缺失 source_url 的内容列表
        console.log('\n⚠️ 缺失 source_url 的内容 (最多显示10条):\n');
        const missing = await pool.query(`
            SELECT id, date, title, author_name, source, video_id
            FROM radar_items 
            WHERE source_url IS NULL OR source_url = ''
            ORDER BY date DESC
            LIMIT 10
        `);

        if (missing.rows.length === 0) {
            console.log('   ✅ 所有内容都有 source_url');
        } else {
            missing.rows.forEach(row => {
                const videoUrl = row.video_id ? `https://youtube.com/watch?v=${row.video_id}` : '无video_id';
                console.log(`   ID:${row.id} | ${row.date.toISOString().split('T')[0]} | ${row.author_name}`);
                console.log(`      标题: ${row.title.substring(0, 40)}...`);
                console.log(`      可推断URL: ${videoUrl}`);
                console.log('');
            });
        }

        console.log('='.repeat(60));
        console.log('✅ 审计完成\n');

    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await pool.end();
    }
}

auditSourceInfo();
