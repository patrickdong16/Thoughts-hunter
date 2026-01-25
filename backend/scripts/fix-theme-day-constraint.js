/**
 * 修复主题日多条目约束问题
 * 删除 radar_items 表上的 (date, freq) 唯一约束
 * 
 * 运行方式: DATABASE_URL="..." node scripts/fix-theme-day-constraint.js
 */

require('dotenv').config();
const pool = require('../config/database');

async function fixConstraint() {
    console.log('🔧 检查并删除 (date, freq) 唯一约束...');

    try {
        // 查找约束名称
        const constraintResult = await pool.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'radar_items' 
            AND constraint_type = 'UNIQUE'
            AND constraint_name LIKE '%date%freq%'
        `);

        if (constraintResult.rows.length === 0) {
            console.log('✅ 未发现 (date, freq) 唯一约束，无需修改');
            return;
        }

        for (const row of constraintResult.rows) {
            const constraintName = row.constraint_name;
            console.log(`📌 发现约束: ${constraintName}`);

            await pool.query(`ALTER TABLE radar_items DROP CONSTRAINT IF EXISTS ${constraintName}`);
            console.log(`✅ 已删除约束: ${constraintName}`);
        }

        // 验证
        const verifyResult = await pool.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'radar_items' 
            AND constraint_type = 'UNIQUE'
        `);

        console.log('\n📊 当前 radar_items 表的唯一约束:');
        if (verifyResult.rows.length === 0) {
            console.log('   (无唯一约束)');
        } else {
            verifyResult.rows.forEach(r => console.log(`   - ${r.constraint_name}`));
        }

        console.log('\n✨ 完成! 现在主题日可以同一频段发布多条内容了');

    } catch (error) {
        console.error('❌ 修复失败:', error.message);
        throw error;
    }
}

fixConstraint()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
