const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const radarRoutes = require('./routes/radar');
const bandsRoutes = require('./routes/bands');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const sourcesRoutes = require('./routes/sources');
const draftsRoutes = require('./routes/drafts');
const collectionRoutes = require('./routes/collection');
const pushRoutes = require('./routes/push');
const automationRoutes = require('./routes/automation');
const reportRoutes = require('./routes/report');
const wechatRoutes = require('./routes/wechat');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务（API测试工具）
app.use('/tools', express.static('public'));

// 请求日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/radar', radarRoutes);
app.use('/api/bands', bandsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/wechat', wechatRoutes);

// 健康检查 - 详细版本用于调试
const pool = require('./config/database');

app.get('/health', async (req, res) => {
    const startTime = Date.now();
    const checks = {
        server: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PORT: process.env.PORT || 3000,
            DATABASE_URL: process.env.DATABASE_URL ? 'set (hidden)' : 'NOT SET',
        },
        database: 'checking...'
    };

    try {
        // 测试数据库连接
        const dbStart = Date.now();
        const result = await pool.query('SELECT NOW() as time, current_database() as db');
        checks.database = {
            status: 'connected',
            responseTime: `${Date.now() - dbStart}ms`,
            serverTime: result.rows[0].time,
            database: result.rows[0].db
        };
    } catch (dbError) {
        checks.database = {
            status: 'error',
            error: dbError.message,
            code: dbError.code
        };
    }

    checks.totalResponseTime = `${Date.now() - startTime}ms`;

    res.json({
        success: checks.database.status === 'connected',
        message: 'Thoughts Radar API Health Check',
        checks
    });
});

// 根路径
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '思想雷达 API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /health',
            auth_register: 'POST /api/auth/register',
            auth_login: 'POST /api/auth/login',
            auth_me: 'GET /api/auth/me',
            radar_today: 'GET /api/radar/today',
            radar_by_date: 'GET /api/radar/:date',
            radar_item: 'GET /api/radar/item/:id',
            bands: 'GET /api/bands',
            band_detail: 'GET /api/bands/:id',
            user_like: 'POST /api/user/like',
            user_stance: 'POST /api/user/stance',
            user_likes_list: 'GET /api/user/:user_id/likes',
            user_stances_list: 'GET /api/user/:user_id/stances',
            sources_list: 'GET /api/sources',
            sources_detail: 'GET /api/sources/:id',
            sources_create: 'POST /api/sources',
            sources_update: 'PUT /api/sources/:id',
            sources_metrics: 'GET /api/sources/:id/metrics',
            sources_rankings: 'GET /api/sources/rankings/all',
            sources_trending: 'GET /api/sources/people/trending',
            sources_recommendations: 'GET /api/sources/recommendations/pending',
            push_register: 'POST /api/push/register',
            push_send_daily: 'POST /api/push/send-daily',
            push_stats: 'GET /api/push/stats'
        }
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 启动服务器 - 支持两种模式
// 1. 直接运行 (node server.js) - 需要初始化数据库
// 2. 被 start-with-init.js 导入 - 数据库已初始化，只需启动服务器

async function startServer(skipInit = false) {
    console.log('🚀 startServer called, skipInit:', skipInit);

    try {
        if (!skipInit) {
            console.log('📋 Initializing database...');
            const initDatabase = require('./init-database');
            await initDatabase();
        } else {
            console.log('✓ Skipping database init (already done by caller)');
        }

        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════╗
║      思想雷达 API Server              ║
║      Thoughts Radar API               ║
╚═══════════════════════════════════════╝

Server running on: http://localhost:${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Time: ${new Date().toISOString()}

API Endpoints:
→ GET  /health - Detailed health check (use this for debugging)
→ GET  /api/radar/today - Today's radar

Press Ctrl+C to stop
  `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// 只在直接运行时自动启动 (node server.js)
// 被 require 时不自动启动，由调用者控制
if (require.main === module) {
    console.log('📌 Running server.js directly');
    startServer(false);
}

module.exports = { app, startServer };

