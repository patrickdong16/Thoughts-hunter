export const Colors = {
    // 主色
    primary: '#00ff88',

    // 背景
    background: '#08090c',
    card: '#12151a',
    cardHover: '#1a1d24',

    // 文本
    text: '#ffffff',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',

    // 边框
    border: '#1f2937',
    borderLight: '#374151',

    // 立场颜色
    sideA: '#4a9eff', // 蓝色
    sideB: '#f0a500', // 琥珀色

    // 状态
    success: '#00ff88',
    warning: '#f59e0b',
    error: '#ef4444',

    // 透明度
    overlay: 'rgba(0, 0, 0, 0.8)',
    cardBorder: 'rgba(0, 255, 136, 0.1)',
};

export const Typography = {
    // 字体大小
    sizes: {
        xs: 11,
        sm: 13,
        base: 15,
        lg: 17,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },

    // 字重
    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // 行高
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.8,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
};

// 领域配置
export const DomainConfig = {
    tech: {
        label: '科技',
        color: '#4a9eff',
        icon: '🔬',
    },
    politics: {
        label: '政治',
        color: '#ef4444',
        icon: '🏛️',
    },
    history: {
        label: '历史',
        color: '#8b5cf6',
        icon: '📚',
    },
    philosophy: {
        label: '哲学',
        color: '#ec4899',
        icon: '🤔',
    },
    religion: {
        label: '宗教',
        color: '#f59e0b',
        icon: '⛪',
    },
    finance: {
        label: '金融',
        color: '#10b981',
        icon: '💰',
    },
};

export default {
    Colors,
    Typography,
    Spacing,
    BorderRadius,
    Shadows,
    DomainConfig,
};
