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

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Thoughts Radar API is running',
        timestamp: new Date().toISOString()
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

// 启动服务器（包含数据库初始化）
const initDatabase = require('./init-database');

async function startServer() {
    try {
        // 初始化数据库
        await initDatabase();

        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════╗
║      思想雷达 API Server              ║
║      Thoughts Radar API               ║
╚═══════════════════════════════════════╝

Server running on: http://localhost:${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
Database: ${process.env.DB_NAME || 'thoughts_radar'}

API Documentation:
→ GET  /health                     - Health check
→ POST /api/auth/register          - User registration
→ POST /api/auth/login             - User login
→ GET  /api/auth/me                - Get current user
→ GET  /api/radar/today            - Today's radar
→ GET  /api/radar/:date            - Radar by date
→ GET  /api/radar/item/:id         - Single item
→ GET  /api/bands                  - All bands
→ GET  /api/bands/:id              - Single band
→ POST /api/user/like              - Like/Unlike
→ POST /api/user/stance            - Set stance
→ GET  /api/user/:user_id/likes    - User's likes
→ GET  /api/user/:user_id/stances  - User's stances

Press Ctrl+C to stop
  `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
