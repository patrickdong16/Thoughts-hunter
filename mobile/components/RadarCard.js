import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, DomainConfig } from '../constants/theme';
import { userAPI } from '../services/api';

export default function RadarCard({ item, onUpdate }) {
    const [expanded, setExpanded] = useState(false);
    const [liked, setLiked] = useState(item.liked || false);
    const [userStance, setUserStance] = useState(item.user_stance || null);
    const [loading, setLoading] = useState(false);

    const domainInfo = DomainConfig[item.domain] || {};
    const stanceColor = item.stance === 'A' ? Colors.sideA : Colors.sideB;

    // 处理收藏
    const handleLike = async () => {
        if (loading) return;

        setLoading(true);
        const newLiked = !liked;
        setLiked(newLiked);

        try {
            await userAPI.toggleLike(item.id, newLiked);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to toggle like:', error);
            // 回滚状态
            setLiked(!newLiked);
        } finally {
            setLoading(false);
        }
    };

    // 处理立场选择
    const handleStance = async (stance) => {
        if (loading) return;

        setLoading(true);
        const newStance = userStance === stance ? null : stance;
        setUserStance(newStance);

        try {
            await userAPI.setStance(item.id, newStance);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to set stance:', error);
            // 回滚状态
            setUserStance(userStance);
        } finally {
            setLoading(false);
        }
    };

    // 内容预览（前200字）
    const contentPreview = item.content?.substring(0, 200) + (item.content?.length > 200 ? '...' : '');

    return (
        <View style={styles.card}>
            {/* 顶部标签 */}
            <View style={styles.header}>
                <View style={styles.tags}>
                    <View style={[styles.tag, { backgroundColor: domainInfo.color + '20', borderColor: domainInfo.color }]}>
                        <Text style={[styles.tagText, { color: domainInfo.color }]}>
                            {item.freq}
                        </Text>
                    </View>
                    <View style={[styles.tag, { backgroundColor: stanceColor + '20', borderColor: stanceColor }]}>
                        <Text style={[styles.tagText, { color: stanceColor }]}>
                            倾向{item.stance}
                        </Text>
                    </View>
                </View>
            </View>

            {/* 标题 */}
            <Text style={styles.title}>{item.title}</Text>

            {/* 作者信息 */}
            <View style={styles.author}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.author_avatar || item.author_name?.substring(0, 2)}</Text>
                </View>
                <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{item.author_name}</Text>
                    {item.author_bio && (
                        <Text style={styles.authorBio} numberOfLines={1}>{item.author_bio}</Text>
                    )}
                </View>
            </View>

            {/* 出处 */}
            {item.source && (
                <View style={styles.source}>
                    <View style={styles.sourceBorder} />
                    <Text style={styles.sourceText}>{item.source}</Text>
                </View>
            )}

            {/* 正文 */}
            <View style={styles.contentContainer}>
                <Text style={styles.content}>
                    {expanded ? item.content : contentPreview}
                </Text>
                {item.content?.length > 200 && (
                    <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                        <Text style={styles.expandButton}>
                            {expanded ? '收起' : '展开全文'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 张力信息 */}
            <View style={styles.tension}>
                <Text style={styles.tensionQuestion}>{item.tension_q || item.band_question}</Text>
                <View style={styles.tensionPoles}>
                    <View style={styles.pole}>
                        <Text style={[styles.poleLabel, { color: Colors.sideA }]}>A极</Text>
                        <Text style={styles.poleText}>{item.tension_a || item.band_side_a}</Text>
                    </View>
                    <View style={styles.poleDivider} />
                    <View style={styles.pole}>
                        <Text style={[styles.poleLabel, { color: Colors.sideB }]}>B极</Text>
                        <Text style={styles.poleText}>{item.tension_b || item.band_side_b}</Text>
                    </View>
                </View>
            </View>

            {/* 底部操作栏 */}
            <View style={styles.actions}>
                <TouchableOpacity
                    onPress={handleLike}
                    style={styles.likeButton}
                    disabled={loading}
                >
                    <Text style={[styles.likeIcon, liked && styles.likedIcon]}>
                        {liked ? '❤️' : '🤍'}
                    </Text>
                    <Text style={[styles.likeText, liked && styles.likedText]}>收藏</Text>
                </TouchableOpacity>

                <View style={styles.stanceButtons}>
                    <TouchableOpacity
                        onPress={() => handleStance('A')}
                        style={[
                            styles.stanceButton,
                            userStance === 'A' && { backgroundColor: Colors.sideA, borderColor: Colors.sideA }
                        ]}
                        disabled={loading}
                    >
                        <Text style={[
                            styles.stanceButtonText,
                            userStance === 'A' && styles.stanceButtonTextActive
                        ]}>
                            我倾向A
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleStance('B')}
                        style={[
                            styles.stanceButton,
                            userStance === 'B' && { backgroundColor: Colors.sideB, borderColor: Colors.sideB }
                        ]}
                        disabled={loading}
                    >
                        <Text style={[
                            styles.stanceButtonText,
                            userStance === 'B' && styles.stanceButtonTextActive
                        ]}>
                            我倾向B
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    header: {
        marginBottom: Spacing.md,
    },
    tags: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    tag: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    tagText: {
        fontSize: Typography.sizes.xs,
        fontWeight: Typography.weights.bold,
    },
    title: {
        fontSize: Typography.sizes.xl,
        fontWeight: Typography.weights.bold,
        color: Colors.text,
        marginBottom: Spacing.md,
        lineHeight: Typography.sizes.xl * Typography.lineHeights.normal,
    },
    author: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.primary + '20',
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    avatarText: {
        fontSize: Typography.sizes.sm,
        fontWeight: Typography.weights.bold,
        color: Colors.primary,
    },
    authorInfo: {
        flex: 1,
    },
    authorName: {
        fontSize: Typography.sizes.base,
        fontWeight: Typography.weights.semibold,
        color: Colors.text,
    },
    authorBio: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    source: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sourceBorder: {
        width: 3,
        height: '100%',
        backgroundColor: Colors.primary,
        marginRight: Spacing.sm,
    },
    sourceText: {
        fontSize: Typography.sizes.sm,
        color: Colors.primary,
        flex: 1,
    },
    contentContainer: {
        marginBottom: Spacing.lg,
    },
    content: {
        fontSize: Typography.sizes.base,
        color: Colors.text,
        lineHeight: Typography.sizes.base * Typography.lineHeights.relaxed,
    },
    expandButton: {
        fontSize: Typography.sizes.sm,
        color: Colors.primary,
        marginTop: Spacing.sm,
        fontWeight: Typography.weights.medium,
    },
    tension: {
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    tensionQuestion: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    tensionPoles: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    pole: {
        flex: 1,
    },
    poleLabel: {
        fontSize: Typography.sizes.xs,
        fontWeight: Typography.weights.bold,
        marginBottom: 4,
    },
    poleText: {
        fontSize: Typography.sizes.sm,
        color: Colors.text,
    },
    poleDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    likeIcon: {
        fontSize: 20,
    },
    likedIcon: {
        // Already shows ❤️
    },
    likeText: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
    },
    likedText: {
        color: Colors.error,
        fontWeight: Typography.weights.medium,
    },
    stanceButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    stanceButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: 'transparent',
    },
    stanceButtonText: {
        fontSize: Typography.sizes.sm,
        color: Colors.textSecondary,
    },
    stanceButtonTextActive: {
        color: Colors.text,
        fontWeight: Typography.weights.semibold,
    },
});
