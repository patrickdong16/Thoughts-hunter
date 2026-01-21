const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Initializing Railway database...\n');

        // DROP 已存在的索引
        console.log('🗑️  Dropping existing indexes...');
        await pool.query('DROP INDEX IF EXISTS idx_radar_items_date CASCADE;').catch(() => {});
        
        // 执行schema.sql
        console.log('📋 Creating tables...');
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('✅ Tables created\n');

        // 执行seed.sql
        console.log('🌱 Seeding data...');
        const seedPath = path.join(__dirname, '../database/seed.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');
        await pool.query(seed);
        console.log('✅ Data seeded\n');

        // 验证
        const bandsResult = await pool.query('SELECT COUNT(*) FROM bands');
        const itemsResult = await pool.query('SELECT COUNT(*) FROM radar_items');
        console.log(`✨ Bands: ${bandsResult.rows[0].count}`);
        console.log(`✨ Items: ${itemsResult.rows[0].count}\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

initDatabase();
