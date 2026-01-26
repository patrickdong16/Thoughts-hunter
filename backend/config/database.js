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
    connectionTimeoutMillis: 10000,  // 增加到 10 秒，Railway 冷启动需要更长时间
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
    connectionTimeoutMillis: 10000,  // 增加到 10 秒
  });
}

// 处理连接池错误 - 不要退出进程，让连接池自动恢复
pool.on('error', (err) => {
  console.error('Database pool error (will attempt to recover):', err.message);
  // 不再调用 process.exit(-1)，让连接池自动重新建立连接
});

module.exports = pool;
