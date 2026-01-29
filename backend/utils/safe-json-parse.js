/**
 * 安全 JSON 解析工具
 * 从 AI 响应中提取并修复 JSON，3 层容错逻辑
 */

/**
 * 安全解析 AI 响应中的 JSON
 * @param {string} text - AI 响应文本
 * @param {object} options - 配置选项
 * @param {boolean} options.isArray - 是否解析数组 (默认 false，解析对象)
 * @param {boolean} options.silent - 是否静默模式 (默认 false)
 * @returns {object|array|null} 解析结果，失败返回 null
 */
function safeParseAiJson(text, options = {}) {
    const { isArray = false, silent = false } = options;
    const pattern = isArray ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const match = text.match(pattern);

    if (!match) {
        if (!silent) console.log('   ⚠️ 响应中未找到 JSON');
        return null;
    }

    const raw = match[0];

    // Layer 1: 直接解析
    try {
        return JSON.parse(raw);
    } catch (e) {
        if (!silent) console.log('   🔧 JSON 解析失败，尝试修复...');
    }

    // Layer 2: 修复常见问题
    let fixed = raw
        // 修复尾随逗号
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        // 修复未转义的换行符
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        // 移除控制字符
        .replace(/[\x00-\x1F\x7F]/g, ' ');

    try {
        const result = JSON.parse(fixed);
        if (!silent) console.log('   ✅ JSON 修复成功 (转义修复)');
        return result;
    } catch (e) {
        // continue to layer 3
    }

    // Layer 3: 移除 markdown 代码块标记
    fixed = raw
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/,\s*]/g, ']')
        .replace(/,\s*}/g, '}')
        .replace(/[\x00-\x1F\x7F]/g, ' ');

    try {
        const result = JSON.parse(fixed);
        if (!silent) console.log('   ✅ JSON 修复成功 (移除代码块)');
        return result;
    } catch (e) {
        // continue to layer 4
    }

    // Layer 4: 尝试提取最内层有效 JSON
    try {
        // 找到第一个 { 或 [ 和对应的闭合
        const startChar = isArray ? '[' : '{';
        const endChar = isArray ? ']' : '}';
        const startIdx = raw.indexOf(startChar);
        const endIdx = raw.lastIndexOf(endChar);

        if (startIdx !== -1 && endIdx > startIdx) {
            const extracted = raw.substring(startIdx, endIdx + 1)
                .replace(/[\x00-\x1F\x7F]/g, ' ')
                .replace(/,\s*]/g, ']')
                .replace(/,\s*}/g, '}');

            const result = JSON.parse(extracted);
            if (!silent) console.log('   ✅ JSON 修复成功 (提取核心块)');
            return result;
        }
    } catch (e) {
        // final failure
    }

    if (!silent) console.log('   ❌ JSON 修复失败，所有方法均无效');
    return null;
}

module.exports = {
    safeParseAiJson
};
