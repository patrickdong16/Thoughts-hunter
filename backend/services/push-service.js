// 推送通知服务
// Push Notification Service using Expo Push API

const { Expo } = require('expo-server-sdk');
const pool = require('../config/database');

// 创建 Expo SDK 客户端
const expo = new Expo();

/**
 * 发送推送通知到所有活跃设备
 * @param {Object} notification - 通知内容
 * @param {string} notification.title - 标题
 * @param {string} notification.body - 正文
 * @param {Object} notification.data - 附加数据
 * @returns {Promise<Object>} 发送结果统计
 */
const sendToAllDevices = async ({ title, body, data = {} }) => {
    try {
        // 获取所有活跃的推送令牌
        const result = await pool.query(
            'SELECT token FROM push_tokens WHERE is_active = true'
        );

        const tokens = result.rows.map(row => row.token);

        if (tokens.length === 0) {
            console.log('没有活跃的推送令牌');
            return { success: true, totalTokens: 0, sent: 0, failed: 0 };
        }

        console.log(`准备发送推送到 ${tokens.length} 个设备`);

        // 构建消息
        const messages = [];
        for (const pushToken of tokens) {
            // 验证是否是有效的 Expo Push Token
            if (!Expo.isExpoPushToken(pushToken)) {
                console.warn(`无效的推送令牌: ${pushToken}`);
                continue;
            }

            messages.push({
                to: pushToken,
                sound: 'default',
                title,
                body,
                data,
                priority: 'high',
            });
        }

        // 分批发送（Expo 限制每批最多 100 条）
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('发送推送批次失败:', error);
            }
        }

        // 统计结果
        let successCount = 0;
        let failureCount = 0;

        for (const ticket of tickets) {
            if (ticket.status === 'ok') {
                successCount++;
            } else {
                failureCount++;
                // 如果令牌无效，标记为不活跃
                if (ticket.details?.error === 'DeviceNotRegistered') {
                    await markTokenInactive(ticket.details.expoPushToken);
                }
            }
        }

        // 记录推送日志
        await pool.query(
            `INSERT INTO push_log (title, body, data, total_tokens, success_count, failure_count)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [title, body, JSON.stringify(data), tokens.length, successCount, failureCount]
        );

        console.log(`推送完成: 成功 ${successCount}, 失败 ${failureCount}`);
        return {
            success: true,
            totalTokens: tokens.length,
            sent: successCount,
            failed: failureCount
        };
    } catch (error) {
        console.error('发送推送通知失败:', error);
        throw error;
    }
};

/**
 * 注册或更新推送令牌
 * @param {string} token - Expo Push Token
 * @param {string} userId - 用户ID（可选）
 * @param {string} platform - 平台 (ios/android/web)
 * @param {string} deviceName - 设备名称（可选）
 */
const registerToken = async (token, userId = null, platform = 'ios', deviceName = null) => {
    try {
        // 验证令牌格式
        if (!Expo.isExpoPushToken(token)) {
            throw new Error('无效的 Expo Push Token');
        }

        // 使用 UPSERT 更新或插入
        const query = `
            INSERT INTO push_tokens (token, user_id, platform, device_name, last_used_at, is_active)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, true)
            ON CONFLICT (token) 
            DO UPDATE SET 
                user_id = COALESCE($2, push_tokens.user_id),
                platform = $3,
                device_name = COALESCE($4, push_tokens.device_name),
                last_used_at = CURRENT_TIMESTAMP,
                is_active = true
            RETURNING *
        `;

        const result = await pool.query(query, [token, userId, platform, deviceName]);
        console.log(`推送令牌已注册: ${token.substring(0, 30)}...`);
        return result.rows[0];
    } catch (error) {
        console.error('注册推送令牌失败:', error);
        throw error;
    }
};

/**
 * 标记令牌为不活跃
 * @param {string} token - 推送令牌
 */
const markTokenInactive = async (token) => {
    try {
        await pool.query(
            'UPDATE push_tokens SET is_active = false WHERE token = $1',
            [token]
        );
        console.log(`令牌已标记为不活跃: ${token.substring(0, 30)}...`);
    } catch (error) {
        console.error('标记令牌失败:', error);
    }
};

/**
 * 发送每日内容更新推送
 * @param {number} itemCount - 新内容数量
 */
const sendDailyUpdateNotification = async (itemCount = 0) => {
    const today = new Date().toLocaleDateString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        month: 'long',
        day: 'numeric'
    });

    return sendToAllDevices({
        title: '📡 思想雷达 · 今日更新',
        body: itemCount > 0
            ? `${today}，${itemCount} 条新观点已上线`
            : `${today}，今日观点已更新`,
        data: {
            type: 'daily_update',
            date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
        }
    });
};

module.exports = {
    sendToAllDevices,
    registerToken,
    markTokenInactive,
    sendDailyUpdateNotification
};
