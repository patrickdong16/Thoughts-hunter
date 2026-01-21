/**
 * 认证路由 - 用户注册/登录/验证
 * Auth Routes - User Registration/Login/Verification
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// JWT密钥（生产环境应使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'thoughts-radar-jwt-secret-2026';
const JWT_EXPIRES_IN = '30d';

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, nickname } = req.body;

        // 验证必填字段
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: '邮箱和密码不能为空'
            });
        }

        // 验证邮箱格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: '邮箱格式不正确'
            });
        }

        // 验证密码长度
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: '密码长度至少6位'
            });
        }

        // 检查邮箱是否已注册
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: '该邮箱已注册'
            });
        }

        // 加密密码
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 生成默认昵称和头像
        const defaultNickname = nickname || email.split('@')[0];
        const defaultAvatar = defaultNickname.substring(0, 2).toUpperCase();

        // 创建用户
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, nickname, avatar) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id, email, nickname, avatar, created_at`,
            [email.toLowerCase(), passwordHash, defaultNickname, defaultAvatar]
        );

        const user = result.rows[0];

        // 生成JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: '注册成功',
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                avatar: user.avatar
            },
            token
        });

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: '注册失败，请稍后重试'
        });
    }
});

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 验证必填字段
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: '邮箱和密码不能为空'
            });
        }

        // 查找用户
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: '邮箱或密码错误'
            });
        }

        const user = result.rows[0];

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: '邮箱或密码错误'
            });
        }

        // 更新最后登录时间
        await pool.query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // 生成JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: '登录成功',
            user: {
                id: user.id,
                email: user.email,
                nickname: user.nickname,
                avatar: user.avatar
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: '登录失败，请稍后重试'
        });
    }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息（需要认证）
 */
router.get('/me', async (req, res) => {
    try {
        // 从header获取token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: '未登录'
            });
        }

        const token = authHeader.substring(7);

        // 验证token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Token无效或已过期'
            });
        }

        // 查找用户
        const result = await pool.query(
            'SELECT id, email, nickname, avatar, created_at, last_login_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: '用户不存在'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: '获取用户信息失败'
        });
    }
});

/**
 * POST /api/auth/migrate-data
 * 迁移游客数据到登录用户（登录时调用）
 */
router.post('/migrate-data', async (req, res) => {
    try {
        const { guestUserId, authUserId } = req.body;

        if (!guestUserId || !authUserId) {
            return res.status(400).json({
                success: false,
                error: '缺少必要参数'
            });
        }

        // 将游客的user_actions数据迁移到登录用户
        const result = await pool.query(
            `UPDATE user_actions 
             SET user_id = $1, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2
             ON CONFLICT (user_id, item_id) DO NOTHING`,
            [`user-${authUserId}`, guestUserId]
        );

        res.json({
            success: true,
            message: '数据迁移成功',
            migratedCount: result.rowCount
        });

    } catch (error) {
        console.error('Migrate data error:', error);
        res.status(500).json({
            success: false,
            error: '数据迁移失败'
        });
    }
});

module.exports = router;
