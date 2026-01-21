// 推送通知服务
// Push Notification Service for Mobile App

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API 配置
const getApiBaseUrl = () => {
    if (process.env.API_BASE_URL) {
        return process.env.API_BASE_URL;
    }
    // 生产环境默认值
    return 'https://thoughts-radar-backend-production.up.railway.app';
};

const API_BASE_URL = getApiBaseUrl();
const PUSH_TOKEN_KEY = 'push_token';

// 配置通知行为
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * 请求通知权限并注册推送
 * @returns {Promise<string|null>} Expo Push Token 或 null
 */
export async function registerForPushNotifications() {
    let token = null;

    try {
        // 检查是否是真实设备
        if (!Device.isDevice) {
            console.log('推送通知需要在真实设备上运行');
            return null;
        }

        // 检查现有权限
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // 如果没有权限，请求权限
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('未获得推送通知权限');
            return null;
        }

        // 获取 Expo Push Token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'your-project-id-here', // 从 app.json 获取
        });
        token = tokenData.data;

        console.log('Push Token:', token);

        // Android 需要设置通知渠道
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: '默认通知',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FFB800',
            });
        }

        // 保存到本地存储
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

        // 注册到后端
        await registerTokenWithBackend(token);

        return token;
    } catch (error) {
        console.error('注册推送通知失败:', error);
        return null;
    }
}

/**
 * 将推送令牌注册到后端
 * @param {string} token - Expo Push Token
 */
async function registerTokenWithBackend(token) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/push/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token,
                platform: Platform.OS,
                device_name: Device.deviceName || `${Device.brand} ${Device.modelName}`,
            }),
        });

        const data = await response.json();

        if (data.success) {
            console.log('推送令牌已注册到后端');
        } else {
            console.error('注册推送令牌失败:', data.error);
        }
    } catch (error) {
        console.error('注册推送令牌到后端失败:', error);
    }
}

/**
 * 获取本地存储的推送令牌
 * @returns {Promise<string|null>}
 */
export async function getStoredPushToken() {
    try {
        return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch (error) {
        console.error('获取存储的推送令牌失败:', error);
        return null;
    }
}

/**
 * 添加通知接收监听器
 * @param {Function} callback - 通知回调函数
 * @returns {Object} 订阅对象（用于取消订阅）
 */
export function addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * 添加通知点击响应监听器
 * @param {Function} callback - 响应回调函数
 * @returns {Object} 订阅对象
 */
export function addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * 获取上次通知响应（用于从通知启动 app）
 * @returns {Promise<Object|null>}
 */
export async function getLastNotificationResponse() {
    return Notifications.getLastNotificationResponseAsync();
}

/**
 * 检查通知权限状态
 * @returns {Promise<string>} 'granted', 'denied', 或 'undetermined'
 */
export async function getNotificationPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
}

export default {
    registerForPushNotifications,
    getStoredPushToken,
    addNotificationReceivedListener,
    addNotificationResponseListener,
    getLastNotificationResponse,
    getNotificationPermissionStatus,
};
