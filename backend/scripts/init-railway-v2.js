const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function init() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000,  // 30秒超时
        idleTimeoutMillis: 30000,
        max: 1  // 只用一个连接
    });

    try {
        // 测试连接
        console.log('Testing connection...');
        const testResult = await pool.query('SELECT NOW()');
        console.log('✓ Connected at:', testResult.rows[0].now);
        
        // 读取并执行 schema
        console.log('\nExecuting schema.sql...');
        const schema = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
        
        // 分成多个语句执行
        const statements = schema.split(';').filter(s => s.trim());
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (stmt) {
                console.log(`  Statement ${i+1}/${statements.length}...`);
                try {
                    await pool.query(stmt);
                } catch (err) {
                    if (!err.message.includes('already exists')) {
                        throw err;
                    }
                    console.log('  (already exists, skipping)');
                }
            }
        }
        console.log('✓ Schema done\n');
        
        // 读取并执行 seed
        console.log('Executing seed.sql...');
        const seed = fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8');
        const seedStatements = seed.split(';').filter(s => s.trim());
        
        for (let i = 0; i < seedStatements.length; i++) {
            const stmt = seedStatements[i].trim();
            if (stmt) {
                console.log(`  Statement ${i+1}/${seedStatements.length}...`);
                try {
                    await pool.query(stmt);
                } catch (err) {
                    console.log(`  Error: ${err.message}`);
                }
            }
        }
        console.log('✓ Seed done\n');
        
        // 验证
        const bands = await pool.query('SELECT COUNT(*) FROM bands');
        const items = await pool.query('SELECT COUNT(*) FROM radar_items');
        console.log(`✅ Bands: ${bands.rows[0].count}`);
        console.log(`✅ Items: ${items.rows[0].count}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

init();
