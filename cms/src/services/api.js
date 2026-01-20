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

export default {
    radar: radarAPI,
    bands: bandsAPI,
    stats: statsAPI,
};
