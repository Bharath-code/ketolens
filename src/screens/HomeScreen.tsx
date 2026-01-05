/**
 * HomeScreen
 * Main screen with two primary CTAs
 */

import React from 'react'
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '../components/atoms'
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme'

interface HomeScreenProps {
    userName?: string
    scansRemaining?: number
    onScanMeal: () => void
    onScanProduct: () => void
    onProfile: () => void
}

export function HomeScreen({
    userName = 'Keto Warrior',
    scansRemaining = 5,
    onScanMeal,
    onScanProduct,
    onProfile,
}: HomeScreenProps) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.greeting}>
                        <View style={styles.nameRow}>
                            <Text variant="heading" size="2xl">
                                {userName} 👋
                            </Text>
                            <TouchableOpacity onPress={onProfile} style={styles.profileBtn}>
                                <Text variant="body" size="lg">👤</Text>
                            </TouchableOpacity>
                        </View>
                        <Text variant="body" size="base" color={Colors.gray500}>
                            Ready to stay in ketosis?
                        </Text>
                    </View>
                    <View style={styles.scansBadge}>
                        <Text variant="heading" size="2xl" color={Colors.ketoSafe}>
                            {scansRemaining}
                        </Text>
                        <Text variant="caption" size="xs" color={Colors.gray500}>
                            scans left
                        </Text>
                    </View>
                </View>

                {/* Main CTAs */}
                <View style={styles.ctas}>
                    <Text variant="heading" size="lg">
                        What would you like to check?
                    </Text>

                    {/* Scan Meal Card */}
                    <Pressable style={styles.ctaCard} onPress={onScanMeal}>
                        <View style={[styles.ctaIcon, styles.ctaIconMeal]}>
                            <Text variant="body" size="2xl">🍽️</Text>
                        </View>
                        <View style={styles.ctaContent}>
                            <Text variant="heading" size="xl">Scan Meal</Text>
                            <Text variant="body" size="sm" color={Colors.gray500}>
                                Take a photo of your meal for instant keto analysis
                            </Text>
                        </View>
                        <Text variant="body" size="2xl" color={Colors.gray400}>→</Text>
                    </Pressable>

                    {/* Scan Product Card */}
                    <Pressable style={styles.ctaCard} onPress={onScanProduct}>
                        <View style={[styles.ctaIcon, styles.ctaIconProduct]}>
                            <Text variant="body" size="2xl">🏷️</Text>
                        </View>
                        <View style={styles.ctaContent}>
                            <Text variant="heading" size="xl">Scan Product</Text>
                            <Text variant="body" size="sm" color={Colors.gray500}>
                                Check grocery items before you buy
                            </Text>
                        </View>
                        <Text variant="body" size="2xl" color={Colors.gray400}>→</Text>
                    </Pressable>
                </View>

                {/* Recent Scans Preview */}
                <View style={styles.recent}>
                    <View style={styles.recentHeader}>
                        <Text variant="heading" size="base">Recent Scans</Text>
                        <Text variant="body" size="sm" color={Colors.ketoSafe}>View All</Text>
                    </View>
                    <View style={styles.recentEmpty}>
                        <Text variant="body" size="4xl">📭</Text>
                        <Text variant="body" size="sm" color={Colors.gray400} align="center">
                            No scans yet. Start by scanning a meal or product!
                        </Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
        padding: Spacing['2xl'],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing['3xl'],
    },
    greeting: {
        gap: Spacing.xs,
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: Spacing.md,
    },
    profileBtn: {
        padding: Spacing.sm,
    },
    scansBadge: {
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.ketoSafeDim,
        borderRadius: BorderRadius.xl,
    },
    ctas: {
        gap: Spacing.lg,
        marginBottom: Spacing['3xl'],
    },
    ctaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        padding: Spacing.xl,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        ...Shadows.md,
    },
    ctaIcon: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
    },
    ctaIconMeal: {
        backgroundColor: Colors.ketoSafeDim,
    },
    ctaIconProduct: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    ctaContent: {
        flex: 1,
        gap: Spacing.xs,
    },
    recent: {
        gap: Spacing.lg,
    },
    recentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recentEmpty: {
        alignItems: 'center',
        gap: Spacing.sm,
        padding: Spacing['3xl'],
        backgroundColor: Colors.gray50,
        borderRadius: BorderRadius.xl,
    },
})

