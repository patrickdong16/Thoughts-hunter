// 手动添加达沃斯视频到 collection_log 进行分析
// 这些是真实的达沃斯 2026 视频
// 用法: DATABASE_URL="..." node backend/scripts/add-davos-videos.js

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    console.error('❌ 请设置 DATABASE_URL 环境变量');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const davosVideos = [
    {
        videoId: 'FnpBUWhvtTs',
        title: 'Canada PM Mark Carney At Davos 2026',
        channelTitle: 'India Today',
        duration: 'PT2M',  // 约2分钟
        publishedAt: '2026-01-22T22:02:33Z'
    },
    {
        videoId: 'TqErjwwcWkY',
        title: 'Israeli President Isaac Herzog Speaks at World Economic Forum | Davos 2026',
        channelTitle: 'DWS News',
        duration: 'PT15M',  // 约15分钟
        publishedAt: '2026-01-22T20:38:48Z'
    },
    {
        videoId: 'LniAOyHfGbM',
        title: 'Ukraine President Zelenskyy At WEF',
        channelTitle: 'CNBC-TV18',
        duration: 'PT30M',  // 约30分钟
        publishedAt: '2026-01-22T18:15:12Z'
    },
    {
        videoId: 'b5fqGe3B4HM',
        title: 'California Governor Gavin Newson at World Economic Forum',
        channelTitle: 'Firstpost',
        duration: 'PT25M',  // 约25分钟
        publishedAt: '2026-01-22T20:14:59Z'
    }
];

async function addDavosVideos() {
    console.log('添加达沃斯视频到 collection_log...\n');

    for (const video of davosVideos) {
        try {
            // 检查是否已存在
            const existing = await pool.query(
                'SELECT id FROM collection_log WHERE video_id = $1',
                [video.videoId]
            );

            if (existing.rows.length > 0) {
                // 重置分析状态
                await pool.query(
                    'UPDATE collection_log SET analyzed = false WHERE video_id = $1',
                    [video.videoId]
                );
                console.log(`🔄 重置: ${video.title}`);
            } else {
                // 插入新记录
                await pool.query(`
                    INSERT INTO collection_log (source_id, video_id, video_title, duration, published_at, analyzed)
                    VALUES (1, $1, $2, $3, $4, false)
                `, [video.videoId, video.title, video.duration, video.publishedAt]);
                console.log(`✅ 添加: ${video.title}`);
            }
        } catch (error) {
            console.error(`❌ 失败 ${video.title}: ${error.message}`);
        }
    }

    // 查询待处理数量
    const count = await pool.query('SELECT COUNT(*) FROM collection_log WHERE analyzed = false');
    console.log(`\n待处理视频总数: ${count.rows[0].count}`);

    await pool.end();
}

addDavosVideos().catch(console.error);
