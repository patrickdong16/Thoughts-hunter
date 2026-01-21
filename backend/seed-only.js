const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function seedOnly() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🌱 Seeding data...');
        const seedPath = path.join(__dirname, 'database/seed.sql');
        const seed = fs.readFileSync(seedPath, 'utf8');
        await pool.query(seed);
        console.log('✅ Data seeded successfully\n');

        const bandsResult = await pool.query('SELECT COUNT(*) FROM bands');
        const itemsResult = await pool.query('SELECT COUNT(*) FROM radar_items');
        console.log(`Bands: ${bandsResult.rows[0].count}`);
        console.log(`Items: ${itemsResult.rows[0].count}`);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

seedOnly();
