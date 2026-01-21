/**
 * 数据库初始化脚本 - 确保所有必要的表存在
 */

const pool = require('./config/database');

async function initDatabase() {
    console.log('Initializing database...');

    try {
        // 创建users表
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nickname VARCHAR(50),
        avatar VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login_at TIMESTAMP
      )
    `);
        console.log('✓ users table ready');

        // 创建索引
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);
        console.log('✓ users index ready');

        console.log('Database initialization complete!');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

module.exports = initDatabase;
