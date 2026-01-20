const { Pool } = require('pg');
require('dotenv').config();

// 支持两种配置方式：
// 1. 生产环境：使用 DATABASE_URL（Railway/Render等提供）
// 2. 本地开发：使用单独的环境变量

let pool;

if (process.env.DATABASE_URL) {
  // 生产环境：使用DATABASE_URL
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} else {
  // 本地开发：使用单独配置
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'thoughts_radar',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
