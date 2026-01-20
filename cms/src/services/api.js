const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// 通用请求函数
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// 雷达条目 API
export const radarAPI = {
    // 获取所有条目（按日期分组）
    getAllGrouped: () => request('/api/radar/all/grouped'),

    // 获取今日条目
    getToday: () => request('/api/radar/today'),

    // 获取指定日期条目
    getByDate: (date) => request(`/api/radar/${date}`),

    // 获取单个条目
    getById: (id) => request(`/api/radar/item/${id}`),

    // 创建新条目
    create: (data) => request('/api/radar', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    // 更新条目
    update: (id, data) => request(`/api/radar/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // 删除条目
    delete: (id) => request(`/api/radar/${id}`, {
        method: 'DELETE',
    }),
};

// 频段 API
export const bandsAPI = {
    // 获取所有频段
    getAll: () => request('/api/bands'),

    // 获取单个频段
    getById: (id) => request(`/api/bands/${id}`),

    // 更新频段TTI
    updateTTI: (id, tti) => request(`/api/bands/${id}/tti`, {
        method: 'PUT',
        body: JSON.stringify({ tti }),
    }),
};

// 统计 API
export const statsAPI = {
    // 获取今日条目数量
    async getTodayCount() {
        const data = await radarAPI.getToday();
        return data.count || 0;
    },

    // 获取指定日期的条目数量
    async getCountByDate(date) {
        const data = await radarAPI.getByDate(date);
        return data.count || 0;
    },

    // 获取本周未覆盖的频段
    async getWeekUncoveredBands() {
        const bands = await bandsAPI.getAll();
        const today = new Date();
        const weekDates = [];

        // 获取本周所有日期
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            weekDates.push(date.toISOString().split('T')[0]);
        }

        // 获取本周所有条目
        const weekItems = [];
        for (const date of weekDates) {
            try {
                const data = await radarAPI.getByDate(date);
                weekItems.push(...data.items);
            } catch (error) {
                // 忽略错误，可能是该日期没有数据
            }
        }

        // 找出未覆盖的频段
        const coveredFreqs = new Set(weekItems.map(item => item.freq));
        const uncovered = bands.bands.filter(band => !coveredFreqs.has(band.id));

        return uncovered;
    },
};

// 内容源 API
export const sourcesAPI = {
    // 获取所有内容源
    getAll: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return request(`/api/sources${params ? '?' + params : ''}`);
    },
    // 获取单个内容源
    getById: (id) => request(`/api/sources/${id}`),
    // 创建内容源
    create: (data) => request('/api/sources', { method: 'POST', body: JSON.stringify(data) }),
    // 更新内容源
    update: (id, data) => request(`/api/sources/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    // 归档内容源
    archive: (id) => request(`/api/sources/${id}`, { method: 'DELETE' }),
    // 获取排名
    getRankings: () => request('/api/sources/rankings/all'),
    // 获取热门人物
    getTrending: (days = 30) => request(`/api/sources/people/trending?days=${days}`),
    // 获取待审核推荐
    getRecommendations: () => request('/api/sources/recommendations/pending'),
    // 批准推荐
    approveRecommendation: (id, data) =>
        request(`/api/sources/recommendations/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
    // 拒绝推荐
    rejectRecommendation: (id) =>
        request(`/api/sources/recommendations/${id}/reject`, { method: 'POST' }),
};

// 草稿 API
export const draftsAPI = {
    // 获取所有草稿
    getAll: (status = 'pending', limit = 50) =>
        request(`/api/drafts?status=${status}&limit=${limit}`),
    // 获取草稿统计
    getStats: () => request('/api/drafts/stats'),
    // 获取单个草稿
    getById: (id) => request(`/api/drafts/${id}`),
    // 更新草稿
    update: (id, data) => request(`/api/drafts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    // 批准草稿
    approve: (id, selectedIndices = null, reviewedBy = 'cms_user') =>
        request(`/api/drafts/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ selectedIndices, reviewedBy })
        }),
    // 拒绝草稿
    reject: (id, reason = '') =>
        request(`/api/drafts/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
    // 删除草稿
    delete: (id) => request(`/api/drafts/${id}`, { method: 'DELETE' }),
    // 分析视频
    analyzeVideo: (url, sourceId = null) =>
        request('/api/drafts/analyze-video', { method: 'POST', body: JSON.stringify({ url, sourceId }) })
};

// 内容采集 API
export const collectionAPI = {
    // 获取内容源最新视频
    getRecentVideos: (sourceId, limit = 10) =>
        request(`/api/collection/recent-videos/${sourceId}?limit=${limit}`),
    // 检查单个内容源
    checkSource: (sourceId) =>
        request(`/api/collection/check-source/${sourceId}`, { method: 'POST' }),
    // 检查所有内容源
    checkAll: () => request('/api/collection/check-all', { method: 'POST' }),
    // 分析指定视频
    analyzeVideo: (sourceId, videoId) =>
        request(`/api/collection/analyze/${sourceId}/${videoId}`, { method: 'POST' }),
};

export default {
    radar: radarAPI,
    bands: bandsAPI,
    stats: statsAPI,
    sources: sourcesAPI,
    drafts: draftsAPI,
    collection: collectionAPI,
};
