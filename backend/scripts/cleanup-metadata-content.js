/**
 * 清理违反 AHR 规则的内容
 * 删除标注为 "基于元数据推断" 的内容
 * 
 * 运行方式: DATABASE_URL="..." node scripts/cleanup-metadata-content.js
 */

require('dotenv').config();
const pool = require('../config/database');

const TARGET_DATE = process.argv[2] || new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Shanghai'
});

// 识别元数据推断内容的特征
const METADATA_PATTERNS = [
    { field: 'author_name', pattern: '基于%推断' },
    { field: 'author_name', pattern: '基于元数据%' },
    { field: 'content', pattern: '%基于元数据推断%' },
    { field: 'author_bio', pattern: '基于元数据%' },
    { field: 'author_avatar', pattern: '基于' }
];

async function findViolatingItems() {
    console.log(`🔍 查找违反 AHR 规则的内容 (日期: ${TARGET_DATE})...`);

    const conditions = METADATA_PATTERNS.map((p, i) =>
        `${p.field} LIKE $${i + 2}`
    ).join(' OR ');

    const params = [TARGET_DATE, ...METADATA_PATTERNS.map(p => p.pattern)];

    const query = `
        SELECT id, freq, title, author_name, author_bio, 
               LEFT(content, 100) as content_preview
        FROM radar_items
        WHERE date = $1 AND (${conditions})
        ORDER BY id
    `;

    const result = await pool.query(query, params);
    return result.rows;
}

async function deleteViolatingItems(items, dryRun = true) {
    if (items.length === 0) {
        console.log('✅ 未发现违规内容');
        return { deleted: 0 };
    }

    console.log(`\n⚠️  发现 ${items.length} 条违规内容:`);
    items.forEach(item => {
        console.log(`   [${item.id}] [${item.freq}] ${item.title?.substring(0, 30)}...`);
        console.log(`      作者: ${item.author_name}`);
    });

    if (dryRun) {
        console.log('\n📋 [DRY RUN] 未执行删除。使用 --execute 参数执行删除。');
        return { deleted: 0, dryRun: true, items };
    }

    // 执行删除
    const ids = items.map(i => i.id);
    await pool.query(`DELETE FROM radar_items WHERE id = ANY($1)`, [ids]);

    console.log(`\n🗑️  已删除 ${ids.length} 条违规内容`);
    return { deleted: ids.length, items };
}

async function getStats() {
    const result = await pool.query(`
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE author_name LIKE '%基于%') as metadata_inferred,
            COUNT(*) FILTER (WHERE content LIKE '%基于元数据推断%') as content_marked
        FROM radar_items
        WHERE date = $1
    `, [TARGET_DATE]);

    return result.rows[0];
}

async function main() {
    const execute = process.argv.includes('--execute');

    console.log('🧹 AHR 违规内容清理工具\n');
    console.log(`📅 目标日期: ${TARGET_DATE}`);
    console.log(`🔧 模式: ${execute ? '执行删除' : '预览 (Dry Run)'}\n`);

    try {
        // 显示统计
        const stats = await getStats();
        console.log('📊 当前统计:');
        console.log(`   总内容: ${stats.total} 条`);
        console.log(`   元数据推断 (作者): ${stats.metadata_inferred} 条`);
        console.log(`   元数据推断 (内容): ${stats.content_marked} 条`);

        // 查找违规内容
        const items = await findViolatingItems();

        // 删除
        const result = await deleteViolatingItems(items, !execute);

        // 最终统计
        if (execute) {
            const finalStats = await getStats();
            console.log('\n📊 清理后统计:');
            console.log(`   总内容: ${finalStats.total} 条`);
        }

        return result;
    } catch (error) {
        console.error('❌ 错误:', error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
