const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initIfNeeded() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    try {
        // 检查表是否存在
        const check = await pool.query("SELECT to_regclass('public.bands')");
        
        if (!check.rows[0].to_regclass) {
            console.log('📋 Tables not found, initializing database...');
            
            const schema = fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf8');
            await pool.query(schema);
            console.log('✓ Tables created');
            
            const seed = fs.readFileSync(path.join(__dirname, 'database/seed.sql'), 'utf8');
            await pool.query(seed);
            console.log('✓ Data seeded');
            
            console.log('✅ Database initialized successfully!');
        } else {
            console.log('✓ Database already initialized');
        }
    } catch (e) {
        console.log('⚠️  Init check failed:', e.message);
        console.log('   (Will try to start server anyway)');
    } finally {
        await pool.end();
    }
}

// 初始化后启动服务器
initIfNeeded().then(() => {
    require('./server.js');
}).catch(err => {
    console.error('Failed to initialize:', err);
    process.exit(1);
});
