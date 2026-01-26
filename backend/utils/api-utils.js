/**
 * API 工具函数模块
 * API Utilities Module
 * 
 * 提供统一的 timeout、retry 和失败通知功能
 */

/**
 * 为 Promise 添加超时
 * @param {Promise} promise - 原始 Promise
 * @param {number} ms - 超时时间（毫秒）
 * @param {string} errorMessage - 超时错误信息
 * @returns {Promise} 带超时的 Promise
 */
const withTimeout = (promise, ms, errorMessage = '请求超时') => {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`${errorMessage} (${ms}ms)`));
        }, ms);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
};

/**
 * 通用重试包装器
 * @param {Function} fn - 要执行的异步函数
 * @param {Object} options - 重试选项
 * @param {number} options.maxRetries - 最大重试次数（默认 3）
 * @param {number} options.delay - 初始延迟毫秒（默认 1000）
 * @param {number} options.backoff - 退避倍数（默认 2）
 * @param {Function} options.shouldRetry - 判断是否应该重试的函数
 * @param {Function} options.onRetry - 重试时的回调
 * @returns {Promise} 执行结果
 */
const withRetry = async (fn, options = {}) => {
    const {
        maxRetries = 3,
        delay = 1000,
        backoff = 2,
        shouldRetry = () => true,
        onRetry = null
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // 检查是否应该重试
            if (attempt === maxRetries || !shouldRetry(error)) {
                throw error;
            }

            // 计算延迟时间（指数退避）
            const waitTime = delay * Math.pow(backoff, attempt - 1);

            console.log(`⚠️ 重试 ${attempt}/${maxRetries}: ${error.message}, 等待 ${waitTime}ms...`);

            if (onRetry) {
                onRetry(attempt, error, waitTime);
            }

            await new Promise(r => setTimeout(r, waitTime));
        }
    }

    throw lastError;
};

/**
 * 带超时和重试的请求包装器
 * @param {Function} fn - 要执行的异步函数
 * @param {Object} options - 配置选项
 * @param {number} options.timeout - 超时时间（毫秒）
 * @param {number} options.maxRetries - 最大重试次数
 * @param {number} options.delay - 重试延迟
 * @param {string} options.timeoutMessage - 超时错误信息
 * @returns {Promise} 执行结果
 */
const withTimeoutAndRetry = async (fn, options = {}) => {
    const {
        timeout = 30000,
        maxRetries = 3,
        delay = 1000,
        backoff = 2,
        timeoutMessage = '请求超时',
        shouldRetry = (error) => {
            // 默认对超时和网络错误重试
            return error.message.includes('timeout') ||
                error.message.includes('ECONNRESET') ||
                error.message.includes('ETIMEDOUT') ||
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT';
        }
    } = options;

    return withRetry(
        () => withTimeout(fn(), timeout, timeoutMessage),
        { maxRetries, delay, backoff, shouldRetry }
    );
};

/**
 * 失败通知机制
 * @param {string} service - 服务名称
 * @param {Object} details - 错误详情
 * @param {string} details.endpoint - 端点名称
 * @param {Array} details.errors - 错误列表
 * @param {string} details.date - 日期
 */
const notifyFailure = async (service, details) => {
    const timestamp = new Date().toISOString();
    const { endpoint = 'unknown', errors = [], date = '' } = details;

    // 控制台日志（总是记录）
    console.error('═'.repeat(60));
    console.error(`❌ 服务失败通知: ${service}`);
    console.error(`📅 时间: ${timestamp}`);
    console.error(`🔗 端点: ${endpoint}`);
    if (date) console.error(`📆 日期: ${date}`);
    console.error(`❗ 错误数量: ${errors.length}`);
    errors.forEach((err, i) => {
        console.error(`   ${i + 1}. ${typeof err === 'string' ? err : err.message || JSON.stringify(err)}`);
    });
    console.error('═'.repeat(60));

    // 尝试通过邮件服务发送通知（如果可用）
    try {
        const emailService = require('../services/email-service');
        const reportConfig = require('../config/report-config.json');

        if (process.env.SENDGRID_API_KEY && reportConfig.email?.recipient) {
            const subject = `[思想雷达] 服务告警: ${service} - ${endpoint}`;
            const html = `
                <h2>⚠️ 服务失败通知</h2>
                <p><strong>服务:</strong> ${service}</p>
                <p><strong>端点:</strong> ${endpoint}</p>
                <p><strong>时间:</strong> ${timestamp}</p>
                ${date ? `<p><strong>日期:</strong> ${date}</p>` : ''}
                <h3>错误详情:</h3>
                <ul>
                    ${errors.map(e => `<li>${typeof e === 'string' ? e : e.message || JSON.stringify(e)}</li>`).join('')}
                </ul>
            `;

            // 不等待邮件发送完成，避免阻塞
            emailService.sendReportEmail({ date: date || new Date().toISOString().split('T')[0] }, html)
                .catch(emailErr => console.error('发送告警邮件失败:', emailErr.message));

            console.log('📧 已触发告警邮件发送');
        }
    } catch (e) {
        // 邮件服务不可用时静默失败
        console.log('📧 告警邮件服务不可用:', e.message);
    }

    return { logged: true, timestamp };
};

/**
 * 带错误处理的异步函数包装器
 * 确保 async 函数始终有 try-catch
 * @param {Function} fn - 异步函数
 * @param {string} context - 上下文描述
 * @returns {Function} 包装后的函数
 */
const safeAsync = (fn, context = 'unknown') => {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error(`[${context}] 异步操作失败:`, error.message);
            throw error;
        }
    };
};

// 常用超时配置
const TIMEOUTS = {
    CLAUDE_API: 120000,     // Claude API 120秒（长视频分析需要更长时间）
    YOUTUBE_API: 30000,     // YouTube API 30秒
    PUSH_NOTIFICATION: 30000, // 推送通知 30秒
    EMAIL: 30000,           // 邮件发送 30秒
    DATABASE: 10000,        // 数据库操作 10秒
    DEFAULT: 30000          // 默认 30秒
};

// 常用重试配置
const RETRY_CONFIGS = {
    CLAUDE_API: { maxRetries: 3, delay: 3000, backoff: 2 },  // 增加重试次数和延迟
    YOUTUBE_API: { maxRetries: 3, delay: 1000, backoff: 2 },
    PUSH_NOTIFICATION: { maxRetries: 2, delay: 1000, backoff: 2 },
    EMAIL: { maxRetries: 2, delay: 2000, backoff: 2 },
    DEFAULT: { maxRetries: 3, delay: 1000, backoff: 2 }
};


module.exports = {
    withTimeout,
    withRetry,
    withTimeoutAndRetry,
    notifyFailure,
    safeAsync,
    TIMEOUTS,
    RETRY_CONFIGS
};
