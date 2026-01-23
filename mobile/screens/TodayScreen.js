import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadarCard from '../components/RadarCard';
import { radarAPI, cacheAPI } from '../services/api';
import { Colors, Typography, Spacing, DomainConfig } from '../constants/theme';

const FILTER_OPTIONS = [
    { key: 'all', label: '全部' },
    { key: 'tech', label: '科技' },
    { key: 'politics', label: '政治' },
    { key: 'history', label: '历史' },
    { key: 'philosophy', label: '哲学' },
    { key: 'religion', label: '宗教' },
    { key: 'finance', label: '金融' },
];

export default function TodayScreen() {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [error, setError] = useState(null);
    const [themeDay, setThemeDay] = useState(null);

    // 加载数据
    const loadData = useCallback(async () => {
        try {
            setError(null);
            const data = await radarAPI.getToday();
            setItems(data.items || []);
            setThemeDay(data.themeDay || null);
        } catch (err) {
            setError(err.message);
            console.error('Failed to load radar:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // 刷新数据
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
    }, [loadData]);

    // 初始加载
    useEffect(() => {
        loadData();
    }, [loadData]);

    // 过滤数据
    useEffect(() => {
        if (selectedFilter === 'all') {
            setFilteredItems(items);
        } else {
            const filtered = items.filter(item => item.domain === selectedFilter);
            setFilteredItems(filtered);
        }
    }, [items, selectedFilter]);

    // 获取当前日期
    const getCurrentDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    };

    // 渲染头部
    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.titleContainer}>
                <Text style={styles.logo}>📡</Text>
                <View>
                    <Text style={styles.title}>思想雷达</Text>
                    <Text style={styles.subtitle}>Thoughts Radar</Text>
                </View>
            </View>
            <Text style={styles.date}>{getCurrentDate()}</Text>
        </View>
    );

    // 渲染主题日Banner
    const renderThemeBanner = () => {
        if (!themeDay) return null;

        // 获取今日内容的作者列表（从 items 中提取）
        const todayAuthors = items.map(item => item.author_name).filter(Boolean);

        // 获取主题日重点人物（如果有）
        const keyFigures = themeDay.focus?.keyFigures || [];
        // 标记今日已有内容的重点人物
        const displayFigures = keyFigures.slice(0, 8).map(name => ({
            name,
            hasContent: todayAuthors.includes(name)
        }));

        return (
            <View style={styles.themeBanner}>
                {/* 主标题区 */}
                <View style={styles.themeBannerHeader}>
                    <Text style={styles.themeBannerBadge}>🔥 主题日</Text>
                    <Text style={styles.themeBannerTitle}>{themeDay.event}</Text>
                    <Text style={styles.themeBannerSubtitle}>{themeDay.eventEn}</Text>
                </View>

                {/* 关键发言人 */}
                {displayFigures.length > 0 && (
                    <View style={styles.keyFiguresSection}>
                        <Text style={styles.keyFiguresLabel}>📌 重点关注</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.keyFiguresScroll}
                        >
                            {displayFigures.map((figure, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.keyFigureChip,
                                        figure.hasContent && styles.keyFigureChipActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.keyFigureText,
                                        figure.hasContent && styles.keyFigureTextActive
                                    ]}>
                                        {figure.name}
                                    </Text>
                                    {figure.hasContent && (
                                        <Text style={styles.keyFigureCheck}>✓</Text>
                                    )}
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* 焦点说明 */}
                {themeDay.focus?.direction && (
                    <Text style={styles.themeBannerFocus} numberOfLines={2}>
                        💡 {themeDay.focus.direction}
                    </Text>
                )}
            </View>
        );
    };

    // 渲染过滤器
    const renderFilters = () => (
        <View style={styles.filtersContainer}>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={FILTER_OPTIONS}
                keyExtractor={item => item.key}
                contentContainerStyle={styles.filters}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setSelectedFilter(item.key)}
                        style={[
                            styles.filterButton,
                            selectedFilter === item.key && styles.filterButtonActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                selectedFilter === item.key && styles.filterTextActive,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );

    // 渲染空状态
    const renderEmpty = () => (
        <View style={styles.empty}>
            {error ? (
                <>
                    <Text style={styles.emptyIcon}>⚠️</Text>
                    <Text style={styles.emptyText}>加载失败</Text>
                    <Text style={styles.emptyHint}>{error}</Text>
                    <TouchableOpacity onPress={loadData} style={styles.retryButton}>
                        <Text style={styles.retryText}>重试</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>今日暂无内容</Text>
                    <Text style={styles.emptyHint}>点击右上角刷新，内容每日更新</Text>
                </>
            )}
        </View>
    );

    // 渲染列表项
    const renderItem = ({ item }) => (
        <RadarCard item={item} onUpdate={loadData} />
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" />
                {renderHeader()}
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>加载中...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            {renderHeader()}
            {renderThemeBanner()}
            {renderFilters()}

            <FlatList
                data={filteredItems}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                ListEmptyComponent={renderEmpty}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    logo: {
        fontSize: 32,
    },
    title: {
        fontSize: Typography.sizes.xxl,
        fontWeight: Typography.weights.bold,
        color: Colors.primary,
    },
    subtitle: {
        fontSize: Typography.sizes.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    date: {
        fontSize: Typography.sizes.base,
        color: Colors.textSecondary,
        fontWeight: Typography.weights.medium,
    },
    themeBanner: {
        backgroundColor: '#1a1a2e',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 2,
        borderBottomColor: '#FFD700',
    },
    themeBannerHeader: {
        marginBottom: Spacing.md,
    },
    themeBannerBadge: {
        fontSize: Typography.sizes.xs,
        color: '#FF6B6B',
        fontWeight: Typography.weights.bold,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    themeBannerTitle: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
        color: '#FFD700',
    },
    themeBannerSubtitle: {
        fontSize: Typography.sizes.sm,
        color: '#888',
        marginTop: 2,
    },
    keyFiguresSection: {
        marginTop: Spacing.sm,
    },
    keyFiguresLabel: {
        fontSize: Typography.sizes.xs,
        color: Colors.textMuted,
        marginBottom: Spacing.xs,
    },
    keyFiguresScroll: {
        marginHorizontal: -Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    keyFigureChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: 16,
        marginRight: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    keyFigureChipActive: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        borderColor: '#4CAF50',
    },
    keyFigureText: {
        fontSize: Typography.sizes.xs,
        color: Colors.textMuted,
    },
    keyFigureTextActive: {
        color: '#4CAF50',
        fontWeight: Typography.weights.medium,
    },
    keyFigureCheck: {
        fontSize: 10,
        color: '#4CAF50',
        marginLeft: 4,
    },
    themeBannerFocus: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.md,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    filtersContainer: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filters: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        gap: Spacing.sm,
    },
    filterButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
        fontWeight: Typography.weights.medium,
    },
    filterTextActive: {
        color: Colors.background,
        fontWeight: Typography.weights.bold,
    },
    list: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.sizes.base,
        color: Colors.textSecondary,
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: 100,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: Spacing.lg,
    },
    emptyText: {
        fontSize: Typography.sizes.lg,
        color: Colors.text,
        fontWeight: Typography.weights.semibold,
        marginBottom: Spacing.sm,
    },
    emptyHint: {
        fontSize: Typography.sizes.sm,
        color: Colors.textMuted,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.primary,
        borderRadius: 20,
    },
    retryText: {
        fontSize: Typography.sizes.base,
        color: Colors.background,
        fontWeight: Typography.weights.bold,
    },
    statsBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.card,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    statsText: {
        fontSize: Typography.sizes.sm,
        color: Colors.primary,
        fontWeight: Typography.weights.medium,
    },
});
