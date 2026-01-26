/**
 * 统一字符计数工具
 * 
 * 解决问题：后端生成的内容在前端显示时字数"缩水"
 * 原因：JSON转义、换行符、多空格等在显示时被压缩
 * 
 * 使用方法：
 * - 后端：const { countVisibleChars, MIN_CONTENT_LENGTH } = require('./utils/char-count');
 * - 前端：复制此函数到移动端/Web端使用
 * 
 * 统一阈值：500字符（可见字符）
 */

// 最小内容长度（统一标准）
const MIN_CONTENT_LENGTH = 500;

/**
 * 计算可见字符数
 * 
 * 规则：
 * 1. 移除所有换行符（\n, \r）
 * 2. 多个连续空格合并为单个
 * 3. 移除首尾空白
 * 4. 计算剩余字符长度
 * 
 * @param {string} str - 输入字符串
 * @returns {number} - 可见字符数
 */
function countVisibleChars(str) {
    if (!str || typeof str !== 'string') {
        return 0;
    }

    return str
        .replace(/[\r\n]+/g, '')      // 移除所有换行
        .replace(/\s+/g, ' ')          // 多空白合并为单个空格
        .trim()                        // 移除首尾空白
        .length;
}

/**
 * 验证内容长度是否符合要求
 * 
 * @param {string} content - 内容字符串
 * @param {number} minLength - 最小长度（默认使用 MIN_CONTENT_LENGTH）
 * @returns {{ valid: boolean, count: number, required: number, shortage: number }}
 */
function validateContentLength(content, minLength = MIN_CONTENT_LENGTH) {
    const count = countVisibleChars(content);
    const valid = count >= minLength;

    return {
        valid,
        count,
        required: minLength,
        shortage: valid ? 0 : minLength - count
    };
}

/**
 * 格式化验证错误消息
 * 
 * @param {object} validation - validateContentLength 返回的结果
 * @returns {string}
 */
function formatValidationError(validation) {
    if (validation.valid) {
        return null;
    }
    return `内容不足${validation.required}字（当前${validation.count}字，还需${validation.shortage}字）`;
}

module.exports = {
    MIN_CONTENT_LENGTH,
    countVisibleChars,
    validateContentLength,
    formatValidationError
};
