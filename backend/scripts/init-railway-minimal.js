const { Pool } = require('pg');

async function init() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Creating bands table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bands (
                id SERIAL PRIMARY KEY,
                freq_id VARCHAR(10) UNIQUE NOT NULL,
                question TEXT NOT NULL,
                side_a TEXT NOT NULL,
                side_b TEXT NOT NULL,
                domain VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('Creating radar_items table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS radar_items (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                author_name VARCHAR(255),
                author_bio TEXT,
                source TEXT,
                freq_id VARCHAR(10),
                stance CHAR(1),
                keywords TEXT[],
                publish_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('Creating user_actions table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_actions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                item_id INTEGER,
                action_type VARCHAR(20) NOT NULL,
                action_value VARCHAR(10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        console.log('✅ Tables created!');
        
        // 添加一条测试数据
        console.log('Adding test data...');
        await pool.query(`
            INSERT INTO bands (freq_id, question, side_a, side_b, domain)
            VALUES ('T1', 'AI是否正在重写社会分层结构？', 'AI普惠化，整体能力上移', 'AI精英化，阶层固化', 'tech')
            ON CONFLICT (freq_id) DO NOTHING;
        `);
        
        console.log('✅ Done!');
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

init();
