/**
 * 补充 2026-01-24 内容
 * Backfill content for Jan 24, 2026 (originally missed due to automation timeout)
 */

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const TARGET_DATE = '2026-01-24';

async function backfillContent() {
    console.log(`🚀 补充 ${TARGET_DATE} 内容...\n`);

    try {
        await pool.query('SELECT 1');
        console.log('✅ 数据库连接成功\n');

        // 1. 检查现有内容
        const { rows: existing } = await pool.query(
            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
            [TARGET_DATE]
        );
        console.log(`📊 ${TARGET_DATE} 现有内容: ${existing[0].count} 条\n`);

        // 2. 从已批准的草稿中获取可发布内容
        const { rows: drafts } = await pool.query(`
            SELECT d.*, cs.name as source_name
            FROM drafts d
            LEFT JOIN content_sources cs ON d.source_id = cs.id
            WHERE d.status = 'approved'
            AND d.generated_items IS NOT NULL
            AND jsonb_array_length(d.generated_items) > 0
            ORDER BY d.created_at DESC
            LIMIT 30
        `);

        console.log(`📝 找到 ${drafts.length} 个已批准草稿\n`);

        // 已使用的频段
        const { rows: usedFreqs } = await pool.query(
            `SELECT freq FROM radar_items WHERE date = $1`,
            [TARGET_DATE]
        );
        const usedSet = new Set(usedFreqs.map(r => r.freq));

        let published = 0;
        const targetCount = 8; // 目标内容数

        for (const draft of drafts) {
            if (published >= targetCount) break;

            let items = draft.generated_items;
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    continue;
                }
            }

            if (!items || !Array.isArray(items) || items.length === 0) continue;

            for (const item of items) {
                if (published >= targetCount) break;

                // 跳过已使用的频段
                if (usedSet.has(item.freq)) continue;

                // 质量检查
                if (!item.content || item.content.length < 300) continue;
                if (!item.title || !item.author_name) continue;

                try {
                    const insertResult = await pool.query(`
                        INSERT INTO radar_items (
                            date, freq, stance, title, 
                            author_name, author_avatar, author_bio,
                            source, content, 
                            tension_q, tension_a, tension_b, keywords
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        RETURNING id, freq, title
                    `, [
                        TARGET_DATE,
                        item.freq,
                        item.stance || 'A',
                        item.title,
                        item.author_name,
                        item.author_avatar || item.author_name?.substring(0, 2) || 'XX',
                        item.author_bio || '',
                        item.source || '',
                        item.content,
                        item.tension_q || '',
                        item.tension_a || '',
                        item.tension_b || '',
                        item.keywords || []
                    ]);

                    if (insertResult.rows.length > 0) {
                        const inserted = insertResult.rows[0];
                        console.log(`✅ [${inserted.freq}] ${inserted.title?.substring(0, 40)}...`);
                        usedSet.add(item.freq);
                        published++;
                    }
                } catch (insertError) {
                    // Skip duplicates silently
                    if (!insertError.message.includes('duplicate')) {
                        console.error(`❌ [${item.freq}]: ${insertError.message}`);
                    }
                }
            }
        }

        // 最终统计
        const { rows: finalCount } = await pool.query(
            `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
            [TARGET_DATE]
        );

        console.log(`\n🎉 完成！新增 ${published} 条内容`);
        console.log(`📊 ${TARGET_DATE} 最终内容数: ${finalCount[0].count} 条`);

    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await pool.end();
    }
}

backfillContent();
