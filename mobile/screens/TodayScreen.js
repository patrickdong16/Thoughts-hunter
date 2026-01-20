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

    // 加载数据
    const loadData = useCallback(async () => {
        try {
            setError(null);
            const data = await radarAPI.getToday();
            setItems(data.items || []);
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
                    <Text style={styles.emptyHint}>下拉刷新查看最新内容</Text>
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

            {/* 统计信息 */}
            {filteredItems.length > 0 && (
                <View style={styles.statsBar}>
                    <Text style={styles.statsText}>
                        今日{selectedFilter !== 'all' && DomainConfig[selectedFilter]?.label}共{filteredItems.length}条
                    </Text>
                </View>
            )}
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
