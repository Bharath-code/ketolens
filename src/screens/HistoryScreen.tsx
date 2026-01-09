import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Loader, Badge } from '../components/atoms';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { supabase } from '../services/supabase';
import { MotiView } from 'moti';
import { Calendar, ChevronRight, Info, Filter } from 'lucide-react-native';
import { format } from 'date-fns';

export interface HistoryItem {
    id: string;
    type: 'meal' | 'product';
    name: string;
    timestamp: Date;
    score: number;
    verdict: 'safe' | 'borderline' | 'avoid';
    imageUrl?: string;
}

interface HistoryScreenProps {
    userId: string;
    onItemPress: (item: HistoryItem) => void;
}

export function HistoryScreen({ userId, onItemPress }: HistoryScreenProps) {
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = useCallback(async () => {
        // Guard: Skip for guest users (no valid userId)
        if (!userId) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch Meals
            const { data: meals, error: mealsError } = await supabase
                .from('meals')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            // Fetch Product Scans
            const { data: products, error: productsError } = await supabase
                .from('product_scans')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (mealsError) throw mealsError;
            if (productsError) throw productsError;

            // Transfrom and Merge
            const formattedMeals: HistoryItem[] = (meals || []).map(m => ({
                id: m.id,
                type: 'meal',
                name: 'Meal Scan',
                timestamp: new Date(m.created_at),
                score: m.keto_score?.score || 0,
                verdict: m.keto_score?.verdict || 'avoid',
                imageUrl: m.image_url
            }));

            const formattedProducts: HistoryItem[] = (products || []).map(p => ({
                id: p.id,
                type: 'product',
                name: p.product_name || 'Unknown Product',
                timestamp: new Date(p.created_at),
                score: p.keto_score?.score || 0,
                verdict: p.keto_score?.verdict || 'avoid',
                imageUrl: p.image_url
            }));

            const merged = [...formattedMeals, ...formattedProducts].sort(
                (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
            );

            setItems(merged);
        } catch (err) {
            console.error('[History] Fetch failed:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchHistory();
    }, [userId]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const renderItem = ({ item, index }: { item: HistoryItem, index: number }) => (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: index * 50 }}
        >
            <TouchableOpacity
                style={styles.card}
                onPress={() => onItemPress(item)}
            >
                <View style={styles.imageContainer}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    ) : (
                        <View style={[styles.imagePlaceholder, { backgroundColor: item.type === 'meal' ? Colors.ketoSafeDim : Colors.gray100 }]}>
                            <Text variant="body" size="lg">{item.type === 'meal' ? '🍽️' : '🏷️'}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text variant="heading" size="base" numberOfLines={1}>
                            {item.name}
                        </Text>
                        <View style={[
                            styles.scoreBadge,
                            { backgroundColor: item.score >= 80 ? Colors.ketoSafe : item.score >= 50 ? Colors.ketoBorderline : Colors.ketoAvoid }
                        ]}>
                            <Text variant="caption" color={Colors.white} weight="bold">{item.score}</Text>
                        </View>
                    </View>

                    <Text variant="caption" color={Colors.gray400}>
                        {format(item.timestamp, 'MMM d, h:mm a')}
                    </Text>
                </View>

                <ChevronRight size={20} color={Colors.gray300} />
            </TouchableOpacity>
        </MotiView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.pageHeader}>
                <Text variant="heading" size="2xl">Your History</Text>
                <TouchableOpacity style={styles.filterBtn}>
                    <Filter size={20} color={Colors.gray900} />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <Loader fullScreen message="Loading your progress..." />
            ) : items.length === 0 ? (
                <View style={styles.empty}>
                    <Text variant="body" size="4xl">📈</Text>
                    <Text variant="heading" size="xl">No Scans Yet</Text>
                    <Text variant="body" color={Colors.gray500} align="center">
                        Start scanning meals and products to see your keto trends here!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.ketoSafe} />
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    pageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing['2xl'],
        paddingVertical: Spacing.xl,
    },
    filterBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        paddingHorizontal: Spacing['2xl'],
        paddingBottom: 100,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.gray100,
    },
    imageContainer: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        marginRight: Spacing.lg,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        gap: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: Spacing.sm,
    },
    scoreBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        minWidth: 28,
        alignItems: 'center',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        gap: Spacing.md,
    }
});
