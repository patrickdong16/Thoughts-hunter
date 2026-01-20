import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RadarCard from '../components/RadarCard';
import { radarAPI } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';

export default function HistoryScreen() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // 简化版：显示最近7天
    const getRecentDates = () => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push({
                date: date.toISOString().split('T')[0],
                display: `${date.getMonth() + 1}月${date.getDate()}日`,
                displayFull: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`,
            });
        }
        return dates;
    };

    const dates = getRecentDates();

    const loadDate = async (date) => {
        setLoading(true);
        setSelectedDate(date);
        try {
            const data = await radarAPI.getByDate(date);
            setItems(data.items || []);
        } catch (error) {
            console.error('Failed to load history:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const renderDateItem = ({ item }) => (
        <TouchableOpacity
            onPress={() => loadDate(item.date)}
            style={[
                styles.dateButton,
                selectedDate === item.date && styles.dateButtonActive,
            ]}
        >
            <Text
                style={[
                    styles.dateText,
                    selectedDate === item.date && styles.dateTextActive,
                ]}
            >
                {item.display}
            </Text>
        </TouchableOpacity>
    );

    const renderRadarItem = ({ item }) => <RadarCard item={item} />;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <Text style={styles.title}>📅 历史记录</Text>
                <Text style={styles.subtitle}>History</Text>
            </View>

            <View style={styles.datePicker}>
                <FlatList
                    horizontal
                    data={dates}
                    renderItem={renderDateItem}
                    keyExtractor={item => item.date}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateList}
                />
            </View>

            {!selectedDate ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>📌</Text>
                    <Text style={styles.emptyText}>选择日期查看历史</Text>
                </View>
            ) : loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyText}>该日期暂无内容</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderRadarItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        <View style={styles.listHeader}>
                            <Text style={styles.listHeaderText}>
                                {dates.find(d => d.date === selectedDate)?.displayFull} 共{items.length}条
                            </Text>
                        </View>
                    }
                />
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
    datePicker: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingVertical: Spacing.md,
    },
    dateList: {
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
    },
    dateButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: 'transparent',
    },
    dateButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    dateText: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
        fontWeight: Typography.weights.medium,
    },
    dateTextActive: {
        color: Colors.background,
        fontWeight: Typography.weights.bold,
    },
    list: {
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    listHeader: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    listHeaderText: {
        fontSize: Typography.sizes.sm,
        color: Colors.primary,
        fontWeight: Typography.weights.medium,
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
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: Spacing.lg,
    },
    emptyText: {
        fontSize: Typography.sizes.lg,
        color: Colors.text,
        fontWeight: Typography.weights.semibold,
    },
});
