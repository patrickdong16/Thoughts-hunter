const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function init() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL_PUBLIC,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to public endpoint...');
        const test = await pool.query('SELECT NOW()');
        console.log('✓ Connected:', test.rows[0].now);
        
        console.log('Creating tables...');
        const schema = fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf8');
        await pool.query(schema);
        console.log('✓ Tables created');
        
        console.log('Seeding data...');
        const seed = fs.readFileSync(path.join(__dirname, 'database/seed.sql'), 'utf8');
        await pool.query(seed);
        console.log('✓ Data seeded');
        
        const count = await pool.query('SELECT COUNT(*) FROM bands');
        console.log('✅ Success! Bands:', count.rows[0].count);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

init();
