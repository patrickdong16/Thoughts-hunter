const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'thoughts_radar',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    });

    try {
        console.log('🔄 Initializing database...\n');

        // 执行schema.sql
        console.log('📋 Creating tables...');
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('✅ Tables created successfully\n');

        // 执行seed.sql
        console.log('🌱 Seeding data...');
        const seedPath = path.join(__dirname, '../database/seed.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');
        await pool.query(seed);
        console.log('✅ Data seeded successfully\n');

        // 验证数据
        const bandsResult = await pool.query('SELECT COUNT(*) FROM bands');
        const itemsResult = await pool.query('SELECT COUNT(*) FROM radar_items');

        console.log('📊 Database Statistics:');
        console.log(`   - Bands: ${bandsResult.rows[0].count}`);
        console.log(`   - Radar Items: ${itemsResult.rows[0].count}`);
        console.log('\n✨ Database initialization completed!\n');

    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

initDatabase();
