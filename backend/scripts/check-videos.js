/**
 * 检查有哪些视频符合时长条件
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

function parseDuration(d) {
    if (!d) return 0;
    const match = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const h = parseInt(match[1]) || 0;
    const m = parseInt(match[2]) || 0;
    const s = parseInt(match[3]) || 0;
    return h * 60 + m + s / 60;
}

async function check() {
    try {
        const result = await pool.query('SELECT video_title, duration FROM collection_log WHERE analyzed = false AND duration IS NOT NULL');
        const over20 = result.rows.filter(v => parseDuration(v.duration) >= 20);
        console.log('总未分析视频:', result.rows.length);
        console.log('≥20分钟的视频:', over20.length);
        over20.slice(0, 10).forEach(v => console.log(' ', v.duration, '|', v.video_title?.substring(0, 50)));
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

check();
