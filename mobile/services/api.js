import AsyncStorage from '@react-native-async-storage/async-storage';

// API配置 - 支持多环境
// 优先级: 1. 环境变量 > 2. 开发默认值
const getApiBaseUrl = () => {
    // 从环境变量读取（.env文件）
    if (process.env.API_BASE_URL) {
        return process.env.API_BASE_URL;
    }

    // 开发环境默认值
    // iOS模拟器可以使用 localhost
    // Android模拟器需要使用 10.0.2.2
    return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

// 通用USER_ID（实际应用中应该通过认证系统获取）
const USER_ID = 'mobile_user_001';

// 缓存键
const CACHE_KEYS = {
    TODAY_RADAR: 'cache_today_radar',
    BANDS: 'cache_bands',
    LAST_UPDATE: 'cache_last_update',
    FAVORITES: 'user_favorites',
    STANCES: 'user_stances',
};

// 通用请求函数
async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

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

// 雷达API
export const radarAPI = {
    // 获取今日雷达
    async getToday() {
        try {
            const data = await request(`/api/radar/today?user_id=${USER_ID}`);
            // 缓存数据
            await AsyncStorage.setItem(CACHE_KEYS.TODAY_RADAR, JSON.stringify(data));
            await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, new Date().toISOString());
            return data;
        } catch (error) {
            // 如果网络失败，尝试从缓存读取
            const cached = await AsyncStorage.getItem(CACHE_KEYS.TODAY_RADAR);
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    },

    // 获取指定日期雷达
    async getByDate(date) {
        const data = await request(`/api/radar/${date}?user_id=${USER_ID}`);
        return data;
    },

    // 获取单个条目
    async getById(id) {
        const data = await request(`/api/radar/item/${id}?user_id=${USER_ID}`);
        return data;
    },
};

// 频段API
export const bandsAPI = {
    // 获取所有频段
    async getAll() {
        try {
            const data = await request('/api/bands');
            // 缓存频段数据
            await AsyncStorage.setItem(CACHE_KEYS.BANDS, JSON.stringify(data));
            return data;
        } catch (error) {
            // 从缓存读取
            const cached = await AsyncStorage.getItem(CACHE_KEYS.BANDS);
            if (cached) {
                return JSON.parse(cached);
            }
            throw error;
        }
    },
};

// 用户行为API
export const userAPI = {
    // 收藏/取消收藏
    async toggleLike(itemId, liked) {
        const data = await request('/api/user/like', {
            method: 'POST',
            body: JSON.stringify({
                user_id: USER_ID,
                item_id: itemId,
                liked,
            }),
        });

        // 更新本地缓存
        await this.updateLocalFavorites(itemId, liked);

        return data;
    },

    // 记录立场
    async setStance(itemId, stance) {
        const data = await request('/api/user/stance', {
            method: 'POST',
            body: JSON.stringify({
                user_id: USER_ID,
                item_id: itemId,
                stance,
            }),
        });

        // 更新本地缓存
        await this.updateLocalStances(itemId, stance);

        return data;
    },

    // 获取用户收藏列表
    async getFavorites() {
        try {
            const data = await request(`/api/user/${USER_ID}/likes`);
            // 缓存收藏列表
            await AsyncStorage.setItem(CACHE_KEYS.FAVORITES, JSON.stringify(data.items || []));
            return data;
        } catch (error) {
            // 从缓存读取
            const cached = await AsyncStorage.getItem(CACHE_KEYS.FAVORITES);
            if (cached) {
                return { items: JSON.parse(cached) };
            }
            throw error;
        }
    },

    // 获取用户立场列表
    async getStances() {
        try {
            const data = await request(`/api/user/${USER_ID}/stances`);
            // 缓存立场列表
            await AsyncStorage.setItem(CACHE_KEYS.STANCES, JSON.stringify(data.items || []));
            return data;
        } catch (error) {
            // 从缓存读取
            const cached = await AsyncStorage.getItem(CACHE_KEYS.STANCES);
            if (cached) {
                return { items: JSON.parse(cached) };
            }
            throw error;
        }
    },

    // 更新本地收藏缓存
    async updateLocalFavorites(itemId, liked) {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEYS.FAVORITES);
            let favorites = cached ? JSON.parse(cached) : [];

            if (liked) {
                // 添加到收藏（如果不存在）
                if (!favorites.some(item => item.id === itemId)) {
                    // 这里简化处理，实际应该包含完整item信息
                    favorites.push({ id: itemId, liked: true });
                }
            } else {
                // 从收藏中移除
                favorites = favorites.filter(item => item.id !== itemId);
            }

            await AsyncStorage.setItem(CACHE_KEYS.FAVORITES, JSON.stringify(favorites));
        } catch (error) {
            console.error('Failed to update local favorites:', error);
        }
    },

    // 更新本地立场缓存
    async updateLocalStances(itemId, stance) {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEYS.STANCES);
            let stances = cached ? JSON.parse(cached) : [];

            // 更新或添加立场
            const existingIndex = stances.findIndex(item => item.id === itemId);
            if (existingIndex >= 0) {
                stances[existingIndex].user_stance = stance;
            } else {
                stances.push({ id: itemId, user_stance: stance });
            }

            await AsyncStorage.setItem(CACHE_KEYS.STANCES, JSON.stringify(stances));
        } catch (error) {
            console.error('Failed to update local stances:', error);
        }
    },
};

// 缓存管理
export const cacheAPI = {
    // 检查是否需要更新
    async shouldUpdate() {
        const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
        if (!lastUpdate) return true;

        const lastDate = new Date(lastUpdate).toDateString();
        const today = new Date().toDateString();

        // 如果不是同一天，则需要更新
        return lastDate !== today;
    },

    // 清除所有缓存
    async clearAll() {
        await AsyncStorage.multiRemove([
            CACHE_KEYS.TODAY_RADAR,
            CACHE_KEYS.BANDS,
            CACHE_KEYS.LAST_UPDATE,
        ]);
    },

    // 清除用户数据
    async clearUserData() {
        await AsyncStorage.multiRemove([
            CACHE_KEYS.FAVORITES,
            CACHE_KEYS.STANCES,
        ]);
    },
};

export default {
    radar: radarAPI,
    bands: bandsAPI,
    user: userAPI,
    cache: cacheAPI,
    USER_ID,
};
