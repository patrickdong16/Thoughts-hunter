/**
 * 微信公众号发布服务
 * 功能：将思想雷达内容同步到微信公众号
 */

const axios = require('axios');
const pool = require('../config/database');

// 微信 API 配置
const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin';
const APP_ID = process.env.WECHAT_APP_ID;
const APP_SECRET = process.env.WECHAT_APP_SECRET;
// 默认封面图 media_id（需要先上传一张图片获取）
const DEFAULT_THUMB_MEDIA_ID = process.env.WECHAT_DEFAULT_THUMB_ID;

// access_token 缓存
let accessTokenCache = {
    token: null,
    expiresAt: 0
};

/**
 * 获取 access_token（自动缓存）
 */
async function getAccessToken() {
    // 检查缓存
    if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
        return accessTokenCache.token;
    }

    if (!APP_ID || !APP_SECRET) {
        throw new Error('微信 AppID 或 AppSecret 未配置');
    }

    try {
        const response = await axios.get(`${WECHAT_API_BASE}/token`, {
            params: {
                grant_type: 'client_credential',
                appid: APP_ID,
                secret: APP_SECRET
            },
            timeout: 10000
        });

        if (response.data.errcode) {
            throw new Error(`微信 API 错误: ${response.data.errcode} - ${response.data.errmsg}`);
        }

        // 缓存 token（提前 5 分钟过期）
        accessTokenCache = {
            token: response.data.access_token,
            expiresAt: Date.now() + (response.data.expires_in - 300) * 1000
        };

        console.log('✅ 获取 access_token 成功');
        return accessTokenCache.token;
    } catch (error) {
        console.error('❌ 获取 access_token 失败:', error.message);
        throw error;
    }
}

/**
 * 将 radar_items 内容转换为微信文章格式
 */
function formatArticle(item) {
    // 构建文章 HTML 内容
    const html = `
<section style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
        <strong>${item.author_name}</strong> · ${item.author_bio || '思想领袖'}
    </p>
    
    <div style="line-height: 1.8; font-size: 16px; color: #333;">
        ${item.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
    </div>
    
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 20px;">
        <p style="font-weight: bold; color: #1a73e8; margin-bottom: 10px;">💡 核心张力</p>
        <p style="color: #333; margin-bottom: 8px;"><strong>Q:</strong> ${item.tension_q}</p>
        <p style="color: #2e7d32; margin-bottom: 4px;">✅ ${item.tension_a}</p>
        <p style="color: #c62828;">❌ ${item.tension_b}</p>
    </div>
    
    <p style="color: #999; font-size: 12px; margin-top: 20px;">
        来源: ${item.source || '思想雷达'} | 频段: ${item.freq}
    </p>
</section>
    `.trim();

    return {
        title: item.title,
        author: item.author_name,
        content: html,
        thumb_media_id: null, // 需要先上传封面图获取
        content_source_url: item.source_url || '',
        digest: item.content.substring(0, 100) + '...'
    };
}

/**
 * 创建草稿
 */
async function createDraft(article) {
    const token = await getAccessToken();

    // 检查是否配置了默认封面
    const thumbMediaId = article.thumb_media_id || DEFAULT_THUMB_MEDIA_ID;
    if (!thumbMediaId) {
        throw new Error('未配置默认封面图 media_id，请在 Railway 环境变量中设置 WECHAT_DEFAULT_THUMB_ID');
    }

    try {
        const response = await axios.post(
            `${WECHAT_API_BASE}/draft/add?access_token=${token}`,
            {
                articles: [{
                    title: article.title,
                    author: article.author,
                    content: article.content,
                    content_source_url: article.content_source_url,
                    digest: article.digest,
                    thumb_media_id: thumbMediaId,
                    need_open_comment: 0,
                    only_fans_can_comment: 0
                }]
            },
            { timeout: 30000 }
        );

        if (response.data.errcode) {
            throw new Error(`创建草稿失败: ${response.data.errcode} - ${response.data.errmsg}`);
        }

        console.log(`✅ 草稿创建成功: media_id=${response.data.media_id}`);
        return response.data.media_id;
    } catch (error) {
        console.error('❌ 创建草稿失败:', error.message);
        throw error;
    }
}

/**
 * 获取草稿列表
 */
async function getDraftList(offset = 0, count = 20) {
    const token = await getAccessToken();

    try {
        const response = await axios.post(
            `${WECHAT_API_BASE}/draft/batchget?access_token=${token}`,
            { offset, count, no_content: 0 },
            { timeout: 30000 }
        );

        if (response.data.errcode) {
            throw new Error(`获取草稿列表失败: ${response.data.errcode} - ${response.data.errmsg}`);
        }

        return response.data;
    } catch (error) {
        console.error('❌ 获取草稿列表失败:', error.message);
        throw error;
    }
}

/**
 * 发布草稿（群发）
 */
async function publishDraft(mediaId) {
    const token = await getAccessToken();

    try {
        const response = await axios.post(
            `${WECHAT_API_BASE}/freepublish/submit?access_token=${token}`,
            { media_id: mediaId },
            { timeout: 30000 }
        );

        if (response.data.errcode) {
            throw new Error(`发布失败: ${response.data.errcode} - ${response.data.errmsg}`);
        }

        console.log(`✅ 发布任务提交成功: publish_id=${response.data.publish_id}`);
        return response.data;
    } catch (error) {
        console.error('❌ 发布失败:', error.message);
        throw error;
    }
}

/**
 * 同步今日内容到草稿箱（带配额质检）
 */
async function syncTodayToDraft(options = {}) {
    const { skipQuotaCheck = false } = options;
    const today = new Date().toISOString().split('T')[0];

    // 获取今日内容
    const { rows } = await pool.query(`
        SELECT id, title, author_name, author_bio, content, 
               tension_q, tension_a, tension_b, source, source_url, freq
        FROM radar_items 
        WHERE date = $1
        ORDER BY id ASC
    `, [today]);

    if (rows.length === 0) {
        return { success: false, message: '今日无内容可同步' };
    }

    // 配额质检
    let itemsToSync = rows;
    let quotaResult = null;

    if (!skipQuotaCheck) {
        const { validatePublishQuota } = require('./content-validator');
        quotaResult = validatePublishQuota(rows, 'wechat', { total: 0, byFreq: {} });
        itemsToSync = quotaResult.allowedItems;

        if (quotaResult.rejectedItems.length > 0) {
            console.log(`⚠️ 配额质检: ${quotaResult.rejectedItems.length} 条内容因配额限制被跳过`);
        }
    }

    const results = [];
    for (const item of itemsToSync) {
        try {
            const article = formatArticle(item);
            const mediaId = await createDraft(article);
            results.push({
                id: item.id,
                title: item.title,
                mediaId,
                success: true
            });
        } catch (error) {
            results.push({
                id: item.id,
                title: item.title,
                error: error.message,
                success: false
            });
        }
    }

    return {
        success: true,
        date: today,
        total: rows.length,
        synced: results.filter(r => r.success).length,
        skippedByQuota: quotaResult ? quotaResult.rejectedItems.length : 0,
        quotaStatus: quotaResult?.quotaStatus || null,
        results
    };
}

/**
 * 获取永久素材列表（图片）
 */
async function getMaterialList(type = 'image', offset = 0, count = 20) {
    const token = await getAccessToken();

    try {
        const response = await axios.post(
            `${WECHAT_API_BASE}/material/batchget_material?access_token=${token}`,
            { type, offset, count },
            { timeout: 30000 }
        );

        if (response.data.errcode) {
            throw new Error(`获取素材列表失败: ${response.data.errcode} - ${response.data.errmsg}`);
        }

        return response.data;
    } catch (error) {
        console.error('❌ 获取素材列表失败:', error.message);
        throw error;
    }
}

/**
 * 获取配置状态
 */
function getConfig() {
    return {
        hasAppId: !!APP_ID,
        hasAppSecret: !!APP_SECRET,
        hasDefaultThumb: !!DEFAULT_THUMB_MEDIA_ID,
        defaultThumbId: DEFAULT_THUMB_MEDIA_ID ? DEFAULT_THUMB_MEDIA_ID.substring(0, 10) + '...' : null
    };
}

module.exports = {
    getAccessToken,
    formatArticle,
    createDraft,
    getDraftList,
    publishDraft,
    syncTodayToDraft,
    getMaterialList,
    getConfig
};
