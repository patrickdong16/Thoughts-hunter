/**
 * 紧急发布 WEF 草稿内容到 radar_items
 * Emergency script to publish WEF draft content
 * 
 * 问题: 草稿状态为 approved 但未实际发布 (reviewed_at: null)
 * 解决方案: 直接从草稿中提取内容并插入到 radar_items
 */

require('dotenv').config();
const pool = require('../config/database');

const TARGET_DATE = '2026-01-23';

// WEF 草稿 ID 列表 (已验证为 WEF 来源)
const WEF_DRAFT_IDS = [76, 71, 70, 68, 67, 19, 18, 16, 12];

async function getExistingFreqs() {
    const result = await pool.query(
        `SELECT freq FROM radar_items WHERE date = $1`,
        [TARGET_DATE]
    );
    return new Set(result.rows.map(r => r.freq));
}

async function publishDrafts() {
    console.log('🚀 开始发布 WEF 草稿内容...');
    console.log(`📅 目标日期: ${TARGET_DATE}`);

    const existingFreqs = await getExistingFreqs();
    console.log(`📊 已存在频段: ${[...existingFreqs].join(', ') || '无'}`);

    let publishedCount = 0;
    let skippedCount = 0;
    const publishedItems = [];

    for (const draftId of WEF_DRAFT_IDS) {
        try {
            // 获取草稿内容
            const draftResult = await pool.query(
                `SELECT generated_items, source_id FROM drafts WHERE id = $1`,
                [draftId]
            );

            if (draftResult.rows.length === 0) {
                console.log(`⚠️  草稿 ${draftId} 不存在`);
                continue;
            }

            const draft = draftResult.rows[0];
            let items = draft.generated_items;

            if (typeof items === 'string') {
                items = JSON.parse(items);
            }

            if (!items || items.length === 0) {
                console.log(`⚠️  草稿 ${draftId} 没有内容`);
                continue;
            }

            // 发布每个 item
            for (const item of items) {
                // 检查频段是否已存在
                if (existingFreqs.has(item.freq)) {
                    console.log(`⏭️  跳过 [${item.freq}] ${item.title?.substring(0, 25)}... (频段已存在)`);
                    skippedCount++;
                    continue;
                }

                try {
                    const insertResult = await pool.query(`
                        INSERT INTO radar_items (
                            date, freq, stance, title, author_name, author_avatar,
                            author_bio, source, content, tension_q, tension_a, tension_b, keywords
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        ON CONFLICT (date, freq) DO NOTHING
                        RETURNING id, freq, title
                    `, [
                        item.date || TARGET_DATE,
                        item.freq,
                        item.stance || 'A',
                        item.title,
                        item.author_name,
                        item.author_avatar || item.author_name?.substring(0, 2).toUpperCase() || 'XX',
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
                        console.log(`✅ 发布: [${inserted.freq}] ${inserted.title?.substring(0, 30)}... (ID: ${inserted.id})`);
                        publishedItems.push(inserted);
                        existingFreqs.add(item.freq);
                        publishedCount++;
                    } else {
                        console.log(`⏭️  跳过 [${item.freq}] (冲突)`);
                        skippedCount++;
                    }
                } catch (insertError) {
                    console.error(`❌ 发布失败 [${item.freq}]: ${insertError.message}`);
                }
            }

            // 更新草稿状态
            await pool.query(
                `UPDATE drafts SET reviewed_at = CURRENT_TIMESTAMP, reviewed_by = 'emergency_script' WHERE id = $1`,
                [draftId]
            );

        } catch (error) {
            console.error(`❌ 处理草稿 ${draftId} 失败:`, error.message);
        }
    }

    console.log('\n📊 发布统计:');
    console.log(`   ✅ 成功发布: ${publishedCount} 条`);
    console.log(`   ⏭️  跳过: ${skippedCount} 条`);

    // 获取最终统计
    const finalResult = await pool.query(
        `SELECT COUNT(*) as count FROM radar_items WHERE date = $1`,
        [TARGET_DATE]
    );
    console.log(`   📅 今日总内容: ${finalResult.rows[0].count} 条`);

    return { publishedCount, skippedCount, publishedItems };
}

publishDrafts()
    .then(result => {
        console.log('\n✨ 完成!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 执行失败:', error);
        process.exit(1);
    });
