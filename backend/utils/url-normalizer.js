/**
 * URL 标准化工具
 * 用于去重校验时统一 URL 格式，防止变体绕过检测
 */

/**
 * 标准化 URL，移除干扰因素
 * @param {string} url - 原始 URL
 * @returns {string} 标准化后的 URL
 */
function normalizeUrl(url) {
    if (!url) return null;

    try {
        const parsed = new URL(url);

        // 1. 统一协议为 https
        parsed.protocol = 'https:';

        // 2. 移除 www 前缀
        parsed.hostname = parsed.hostname.replace(/^www\./, '');

        // 3. 移除追踪参数 (UTM, fbclid, etc.)
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'ref', 'source', 'mc_cid', 'mc_eid',
            '_ga', '_gl', 'yclid', 'msclkid'
        ];
        trackingParams.forEach(param => parsed.searchParams.delete(param));

        // 4. 移除末尾斜杠
        let pathname = parsed.pathname.replace(/\/+$/, '');
        if (pathname === '') pathname = '/';
        parsed.pathname = pathname;

        // 5. 移除 hash/fragment
        parsed.hash = '';

        // 6. 排序查询参数（确保顺序一致）
        const sortedParams = new URLSearchParams();
        const entries = [...parsed.searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        entries.forEach(([key, value]) => sortedParams.append(key, value));
        parsed.search = sortedParams.toString() ? '?' + sortedParams.toString() : '';

        return parsed.toString();
    } catch (error) {
        // 如果解析失败，返回原始 URL 的小写版本
        console.warn(`URL 标准化失败: ${url}`, error.message);
        return url.toLowerCase().trim();
    }
}

/**
 * 比较两个 URL 是否指向同一内容
 * @param {string} url1 
 * @param {string} url2 
 * @returns {boolean}
 */
function areUrlsEquivalent(url1, url2) {
    if (!url1 || !url2) return false;
    return normalizeUrl(url1) === normalizeUrl(url2);
}

/**
 * 从 URL 提取核心标识符（用于快速匹配）
 * @param {string} url 
 * @returns {string}
 */
function extractUrlIdentifier(url) {
    if (!url) return null;

    try {
        const parsed = new URL(url);
        // 返回: domain/path (不含协议、参数、hash)
        const domain = parsed.hostname.replace(/^www\./, '');
        const path = parsed.pathname.replace(/\/+$/, '') || '/';
        return `${domain}${path}`;
    } catch (error) {
        return url.toLowerCase().trim();
    }
}

module.exports = {
    normalizeUrl,
    areUrlsEquivalent,
    extractUrlIdentifier
};
