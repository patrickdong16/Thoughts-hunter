/**
 * 统一字符计数工具 (移动端版本)
 * 
 * 与后端 backend/utils/char-count.js 保持完全一致
 * 确保前后端字数验证标准统一
 */

// 最小内容长度（统一标准）
export const MIN_CONTENT_LENGTH = 500;

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
export function countVisibleChars(str) {
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
export function validateContentLength(content, minLength = MIN_CONTENT_LENGTH) {
    const count = countVisibleChars(content);
    const valid = count >= minLength;

    return {
        valid,
        count,
        required: minLength,
        shortage: valid ? 0 : minLength - count
    };
}
