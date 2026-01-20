import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { bandsAPI } from '../services/api';
import { Colors, Typography, Spacing, BorderRadius, DomainConfig } from '../constants/theme';

export default function TTIScreen() {
    const [bands, setBands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBands();
    }, []);

    const loadBands = async () => {
        try {
            const data = await bandsAPI.getAll();
            setBands(data.bands || []);
        } catch (error) {
            console.error('Failed to load bands:', error);
        } finally {
            setLoading(false);
        }
    };

    // 按领域分组
    const groupedBands = bands.reduce((acc, band) => {
        if (!acc[band.domain]) {
            acc[band.domain] = [];
        }
        acc[band.domain].push(band);
        return acc;
    }, {});

    // 获取TTI颜色
    const getTTIColor = (tti) => {
        if (tti >= 80) return Colors.error;
        if (tti >= 60) return Colors.warning;
        return Colors.success;
    };

    // 渲染频段
    const renderBand = (band) => {
        const ttiColor = getTTIColor(band.tti);
        const ttiWidth = `${band.tti}%`;

        return (
            <View key={band.id} style={styles.bandCard}>
                <View style={styles.bandHeader}>
                    <Text style={styles.bandId}>{band.id}</Text>
                    <View style={styles.ttiContainer}>
                        <Text style={[styles.ttiValue, { color: ttiColor }]}>{band.tti}</Text>
                        <Text style={styles.ttiLabel}>TTI</Text>
                    </View>
                </View>

                <Text style={styles.bandQuestion}>{band.question}</Text>

                {/* 光谱条 */}
                <View style={styles.spectrum}>
                    <View style={styles.spectrumTrack}>
                        <LinearGradient
                            colors={[Colors.sideA, Colors.sideB]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.spectrumBar, { width: ttiWidth }]}
                        />
                    </View>
                </View>

                {/* AB两极 */}
                <View style={styles.poles}>
                    <View style={styles.poleItem}>
                        <Text style={[styles.poleLabel, { color: Colors.sideA }]}>A极</Text>
                        <Text style={styles.poleText}>{band.side_a}</Text>
                    </View>
                    <View style={styles.poleDivider} />
                    <View style={styles.poleItem}>
                        <Text style={[styles.poleLabel, { color: Colors.sideB }]}>B极</Text>
                        <Text style={styles.poleText}>{band.side_b}</Text>
                    </View>
                </View>
            </View>
        );
    };

    // 渲染领域组
    const renderDomain = (domain, domainBands) => {
        const domainInfo = DomainConfig[domain] || {};

        return (
            <View key={domain} style={styles.domainSection}>
                <View style={styles.domainHeader}>
                    <Text style={styles.domainIcon}>{domainInfo.icon}</Text>
                    <Text style={styles.domainTitle}>{domainInfo.label || domain}</Text>
                    <Text style={styles.domainCount}>{domainBands.length}个频段</Text>
                </View>
                {domainBands.map(renderBand)}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" />
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

            {/* 头部 */}
            <View style={styles.header}>
                <Text style={styles.title}>📊 张力指数</Text>
                <Text style={styles.subtitle}>Tension Index</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* 说明 */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoText}>
                        TTI (Tension Temperature Index) 衡量每个问题在当前时代的张力程度，数值越高表示争议越大。
                    </Text>
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                            <Text style={styles.legendText}>0-59 低张力</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                            <Text style={styles.legendText}>60-79 中张力</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                            <Text style={styles.legendText}>80-100 高张力</Text>
                        </View>
                    </View>
                </View>

                {/* 按领域显示 */}
                {Object.entries(groupedBands).map(([domain, domainBands]) =>
                    renderDomain(domain, domainBands)
                )}
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: Spacing.lg,
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
    infoCard: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoText: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
        lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
        marginBottom: Spacing.md,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: Typography.sizes.xs,
        color: Colors.textMuted,
    },
    domainSection: {
        marginBottom: Spacing.xl,
    },
    domainHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    domainIcon: {
        fontSize: 24,
    },
    domainTitle: {
        fontSize: Typography.sizes.lg,
        fontWeight: Typography.weights.bold,
        color: Colors.primary,
        flex: 1,
    },
    domainCount: {
        fontSize: Typography.sizes.sm,
        color: Colors.textMuted,
    },
    bandCard: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    bandHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    bandId: {
        fontSize: Typography.sizes.base,
        fontWeight: Typography.weights.bold,
        color: Colors.primary,
    },
    ttiContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    ttiValue: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
    },
    ttiLabel: {
        fontSize: Typography.sizes.xs,
        color: Colors.textMuted,
    },
    bandQuestion: {
        fontSize: Typography.sizes.base,
        color: Colors.text,
        marginBottom: Spacing.md,
        lineHeight: Typography.sizes.base * Typography.lineHeights.normal,
    },
    spectrum: {
        marginBottom: Spacing.md,
    },
    spectrumTrack: {
        height: 8,
        backgroundColor: Colors.background,
        borderRadius: 4,
        overflow: 'hidden',
    },
    spectrumBar: {
        height: '100%',
        borderRadius: 4,
    },
    poles: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    poleItem: {
        flex: 1,
    },
    poleDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    poleLabel: {
        fontSize: Typography.sizes.xs,
        fontWeight: Typography.weights.bold,
        marginBottom: 4,
    },
    poleText: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
        lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
    },
});
