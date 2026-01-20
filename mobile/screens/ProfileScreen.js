import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadarCard from '../components/RadarCard';
import { userAPI, cacheAPI } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export default function ProfileScreen() {
    const [activeTab, setActiveTab] = useState('favorites'); // 'favorites' or 'stances'
    const [favorites, setFavorites] = useState([]);
    const [stances, setStances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [favData, stanceData] = await Promise.all([
                userAPI.getFavorites(),
                userAPI.getStances(),
            ]);
            setFavorites(favData.items || []);
            setStances(stanceData.items || []);
        } catch (error) {
            console.error('Failed to load user data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const currentItems = activeTab === 'favorites' ? favorites : stances;

    const renderItem = ({ item }) => <RadarCard item={item} onUpdate={loadData} />;

    const renderEmpty = () => (
        <View style={styles.empty}>
            <Text style={styles.emptyIcon}>
                {activeTab === 'favorites' ? '💙' : '🎯'}
            </Text>
            <Text style={styles.emptyText}>
                {activeTab === 'favorites' ? '还没有收藏' : '还没有表态'}
            </Text>
            <Text style={styles.emptyHint}>
                {activeTab === 'favorites' ? '点击文章的❤️收藏喜欢的内容' : '在文章底部选择你的立场'}
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" />
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.title}>👤 我的</Text>
                <Text style={styles.subtitle}>Profile</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    onPress={() => setActiveTab('favorites')}
                    style={[
                        styles.tab,
                        activeTab === 'favorites' && styles.tabActive,
                    ]}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'favorites' && styles.tabTextActive,
                        ]}
                    >
                        我的收藏 ({favorites.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('stances')}
                    style={[
                        styles.tab,
                        activeTab === 'stances' && styles.tabActive,
                    ]}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'stances' && styles.tabTextActive,
                        ]}
                    >
                        我的立场 ({stances.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={currentItems}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.list}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                    />
                }
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
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: Typography.sizes.xxl,
        fontWeight: Typography.weights.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: Typography.sizes.sm,
        color: Colors.textMuted,
    },
    tabs: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: Typography.sizes.base,
        color: Colors.textSecondary,
        fontWeight: Typography.weights.medium,
    },
    tabTextActive: {
        color: Colors.primary,
        fontWeight: Typography.weights.bold,
    },
    list: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
});
