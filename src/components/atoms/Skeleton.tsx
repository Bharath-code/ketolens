/**
 * Skeleton
 * Animated placeholder for loading content
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = BorderRadius.md,
    style
}: SkeletonProps) {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                { width, height, borderRadius, opacity },
                style,
            ]}
        />
    );
}

/**
 * Card Skeleton for history items, results, etc.
 */
export function CardSkeleton() {
    return (
        <View style={styles.card}>
            <Skeleton width={60} height={60} borderRadius={BorderRadius.lg} />
            <View style={styles.cardContent}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
            </View>
        </View>
    );
}

/**
 * Profile Skeleton
 */
export function ProfileSkeleton() {
    return (
        <View style={styles.profile}>
            <Skeleton width={100} height={100} borderRadius={50} />
            <Skeleton width={150} height={24} style={{ marginTop: 16 }} />
            <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
        </View>
    );
}

/**
 * List Skeleton - renders multiple CardSkeletons
 */
export function ListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <View style={styles.list}>
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.gray200,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.gray100,
    },
    cardContent: {
        flex: 1,
        marginLeft: 16,
    },
    profile: {
        alignItems: 'center',
        padding: 24,
    },
    list: {
        padding: 16,
    },
});
