/**
 * 更新 Railway 数据库中内容源的 YouTube URL
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const YOUTUBE_URLS = {
    'World Economic Forum': 'https://www.youtube.com/@worldeconomicforum',
    'Bloomberg': 'https://www.youtube.com/@BloombergTelevision',
    'CNBC': 'https://www.youtube.com/@CNBCtelevision',
    'Lex Fridman Podcast': 'https://www.youtube.com/@lexfridman',
    'Dwarkesh Podcast': 'https://www.youtube.com/@DwarkeshPatel',
    'a16z': 'https://www.youtube.com/@a16z',
    'Foreign Affairs': 'https://www.youtube.com/@ForeignAffairsMagazine',
    'Council on Foreign Relations': 'https://www.youtube.com/@cfr',
    'Bridgewater': 'https://www.youtube.com/@Bridgewater'
};

async function updateUrls() {
    console.log('🔧 更新内容源 YouTube URL...\n');

    try {
        for (const [name, url] of Object.entries(YOUTUBE_URLS)) {
            const result = await pool.query(
                'UPDATE content_sources SET url = $1 WHERE name = $2 RETURNING id, name',
                [url, name]
            );
            if (result.rows.length > 0) {
                console.log(`✅ ${name} → ${url}`);
            } else {
                console.log(`⚠️ ${name} 未找到`);
            }
        }

        console.log('\n📊 验证更新结果:');
        const check = await pool.query(
            "SELECT name, url FROM content_sources WHERE type = 'channel' AND url IS NOT NULL"
        );
        check.rows.forEach(r => console.log(`   ${r.name}: ${r.url}`));

        console.log('\n✅ URL 更新完成！');

    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await pool.end();
    }
}

updateUrls();
