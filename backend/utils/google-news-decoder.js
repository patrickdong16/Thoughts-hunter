/**
 * Google News URL 解码器
 * 基于 googlenewsdecoder Python 库移植
 * 
 * Google News RSS 返回的是加密的重定向链接，需要解码获取真实 URL
 * 解码过程:
 * 1. 从 Google News 页面获取签名(signature)和时间戳(timestamp)
 * 2. 调用 Google batchexecute API 解码真实 URL
 */

const { withTimeout, withRetry, TIMEOUTS } = require('./api-utils');

/**
 * 从 Google News URL 中提取 base64 字符串
 * @param {string} sourceUrl - Google News URL
 * @returns {object} { status: boolean, base64Str?: string, message?: string }
 */
function extractBase64FromUrl(sourceUrl) {
    try {
        const url = new URL(sourceUrl);
        const pathParts = url.pathname.split('/');

        if (url.hostname === 'news.google.com' && pathParts.length > 1) {
            const secondLast = pathParts[pathParts.length - 2];
            if (secondLast === 'articles' || secondLast === 'read') {
                return { status: true, base64Str: pathParts[pathParts.length - 1] };
            }
        }

        // 也支持 /rss/articles/ 格式
        if (sourceUrl.includes('/rss/articles/')) {
            const match = sourceUrl.match(/\/rss\/articles\/([^?]+)/);
            if (match) {
                return { status: true, base64Str: match[1] };
            }
        }

        return { status: false, message: 'Invalid Google News URL format' };
    } catch (e) {
        return { status: false, message: `Error extracting base64: ${e.message}` };
    }
}

/**
 * 从 Google News 页面获取解码参数 (signature 和 timestamp)
 * @param {string} base64Str - 从 URL 中提取的 base64 字符串
 * @returns {object} { status: boolean, signature?: string, timestamp?: string, message?: string }
 */
async function getDecodingParams(base64Str) {
    // 尝试两种 URL 格式
    const urls = [
        `https://news.google.com/articles/${base64Str}`,
        `https://news.google.com/rss/articles/${base64Str}`
    ];

    for (const url of urls) {
        try {
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) continue;

            const html = await response.text();

            // 从 HTML 中提取 data-n-a-sg (signature) 和 data-n-a-ts (timestamp)
            const signatureMatch = html.match(/data-n-a-sg="([^"]+)"/);
            const timestampMatch = html.match(/data-n-a-ts="([^"]+)"/);

            if (signatureMatch && timestampMatch) {
                return {
                    status: true,
                    signature: signatureMatch[1],
                    timestamp: timestampMatch[1],
                    base64Str
                };
            }
        } catch (e) {
            // 继续尝试下一个 URL
            continue;
        }
    }

    return { status: false, message: 'Failed to fetch decoding params from Google News' };
}

/**
 * 调用 Google batchexecute API 解码 URL
 * @param {string} signature - 签名
 * @param {string} timestamp - 时间戳
 * @param {string} base64Str - base64 编码的文章 ID
 * @returns {object} { status: boolean, decodedUrl?: string, message?: string }
 */
async function callDecodeApi(signature, timestamp, base64Str) {
    try {
        const url = 'https://news.google.com/_/DotsSplashUi/data/batchexecute';

        const payload = [
            'Fbv4je',
            `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${base64Str}",${timestamp},"${signature}"]`
        ];

        const body = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
            },
            body
        });

        if (!response.ok) {
            return { status: false, message: `API request failed: ${response.status}` };
        }

        const text = await response.text();

        // 解析响应 - 格式类似 Python 版本
        const parts = text.split('\n\n');
        if (parts.length < 2) {
            return { status: false, message: 'Invalid API response format' };
        }

        // 解析 JSON
        const jsonStr = parts[1];
        const parsed = JSON.parse(jsonStr);

        // 提取解码后的 URL - 结构: [[["...",["...",decodedUrl,...]]]]
        if (parsed && parsed[0] && parsed[0][2]) {
            const innerData = JSON.parse(parsed[0][2]);
            if (innerData && innerData[1]) {
                return { status: true, decodedUrl: innerData[1] };
            }
        }

        return { status: false, message: 'Failed to parse decoded URL from response' };
    } catch (e) {
        return { status: false, message: `Decode API error: ${e.message}` };
    }
}

/**
 * 解码 Google News URL 获取真实文章 URL
 * @param {string} googleUrl - Google News URL
 * @param {object} options - 选项
 * @param {number} options.timeout - 超时时间(毫秒)，默认 30000
 * @returns {object} { status: boolean, decodedUrl?: string, message?: string }
 */
async function decodeGoogleNewsUrl(googleUrl, options = {}) {
    const timeout = options.timeout || 30000;

    try {
        // Step 1: 提取 base64 字符串
        const base64Result = extractBase64FromUrl(googleUrl);
        if (!base64Result.status) {
            return base64Result;
        }

        // Step 2: 获取解码参数
        const paramsResult = await withTimeout(
            getDecodingParams(base64Result.base64Str),
            timeout,
            'Timeout getting decoding params'
        );

        if (!paramsResult.status) {
            return paramsResult;
        }

        // Step 3: 调用解码 API
        const decodeResult = await withTimeout(
            callDecodeApi(paramsResult.signature, paramsResult.timestamp, paramsResult.base64Str),
            timeout,
            'Timeout calling decode API'
        );

        return decodeResult;
    } catch (e) {
        return { status: false, message: `Error decoding Google News URL: ${e.message}` };
    }
}

/**
 * 判断是否是 Google News URL
 * @param {string} url - URL
 * @returns {boolean}
 */
function isGoogleNewsUrl(url) {
    return url && (
        url.includes('news.google.com/rss/articles/') ||
        url.includes('news.google.com/articles/') ||
        url.includes('news.google.com/read/')
    );
}

module.exports = {
    decodeGoogleNewsUrl,
    isGoogleNewsUrl,
    extractBase64FromUrl,
    getDecodingParams,
    callDecodeApi
};
