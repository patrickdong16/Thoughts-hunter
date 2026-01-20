#!/usr/bin/env node

const pool = require('../config/database');

async function getStats() {
    try {
        console.log('\n📊 思想雷达数据统计\n');

        // 频段统计
        const bandsResult = await pool.query('SELECT COUNT(*) as count FROM bands');
        console.log(`📻 频段总数: ${bandsResult.rows[0].count}`);

        // 雷达条目统计
        const itemsResult = await pool.query('SELECT COUNT(*) as count FROM radar_items');
        console.log(`📝 雷达条目总数: ${itemsResult.rows[0].count}`);

        // 按日期统计
        const byDateResult = await pool.query(`
      SELECT date, COUNT(*) as count
      FROM radar_items
      GROUP BY date
      ORDER BY date DESC
      LIMIT 10
    `);

        console.log('\n📅 最近的内容日期:');
        byDateResult.rows.forEach(row => {
            console.log(`   ${row.date.toISOString().split('T')[0]}: ${row.count}条`);
        });

        // 按频段统计
        const byFreqResult = await pool.query(`
      SELECT ri.freq, b.domain, COUNT(*) as count
      FROM radar_items ri
      JOIN bands b ON ri.freq = b.id
      GROUP BY ri.freq, b.domain
      ORDER BY count DESC
    `);

        console.log('\n📊 按频段统计:');
        byFreqResult.rows.forEach(row => {
            console.log(`   ${row.freq} (${row.domain}): ${row.count}条`);
        });

        // 用户行为统计
        const likesResult = await pool.query(`
      SELECT COUNT(DISTINCT user_id) as users, COUNT(*) as total_likes
      FROM user_actions
      WHERE liked = true
    `);

        const stancesResult = await pool.query(`
      SELECT stance, COUNT(*) as count
      FROM user_actions
      WHERE stance IS NOT NULL
      GROUP BY stance
    `);

        console.log('\n👥 用户行为统计:');
        console.log(`   活跃用户数: ${likesResult.rows[0].users}`);
        console.log(`   总收藏数: ${likesResult.rows[0].total_likes}`);

        if (stancesResult.rows.length > 0) {
            console.log('   立场分布:');
            stancesResult.rows.forEach(row => {
                console.log(`      ${row.stance}极: ${row.count}次`);
            });
        }

        // 查找空白频段
        const emptyFreqResult = await pool.query(`
      SELECT b.id, b.question
      FROM bands b
      LEFT JOIN radar_items ri ON b.id = ri.freq
      WHERE ri.id IS NULL
    `);

        if (emptyFreqResult.rows.length > 0) {
            console.log('\n⚠️  尚未有内容的频段:');
            emptyFreqResult.rows.forEach(row => {
                console.log(`   ${row.id}: ${row.question}`);
            });
        }

        console.log('\n');
    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

getStats();
