/**
 * HomeScreen
 * Main screen with two primary CTAs
 */

import React from 'react'
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native'
import { Crown } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '../components/atoms'
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme'
import { AnimatedView } from '../components/layout/AnimatedView'
import { haptics } from '../services/hapticsService'
import { MacroSummary } from '../components/ui/MacroSummary'
import { LinearGradient } from 'expo-linear-gradient'

interface HomeScreenProps {
    userName?: string
    scansRemaining?: number
    isPro?: boolean
    dailyMacros?: { label: string, current: number, target: number, unit: string, icon: string, color: string }[]
    onScanMeal: () => void
    onScanProduct: () => void
    onViewHistory: () => void
}

export function HomeScreen({
    userName = 'Keto Warrior',
    scansRemaining = 5,
    isPro = false,
    dailyMacros = [
        { label: 'Net Carbs', current: 12, target: 20, unit: 'g', icon: '🥑', color: Colors.ketoSafe },
        { label: 'Protein', current: 45, target: 90, unit: 'g', icon: '🍗', color: Colors.accentPurple },
        { label: 'Fat', current: 65, target: 120, unit: 'g', icon: '🧈', color: '#F59E0B' },
    ],
    onScanMeal,
    onScanProduct,
    onViewHistory,
}: HomeScreenProps) {
    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#FFFFFF', '#F9FAFB']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
                {/* Header */}
                <AnimatedView animation="slideUp" delay={0} style={styles.header}>
                    <View style={styles.greeting}>
                        <View style={styles.nameRow}>
                            <Text variant="heading" size="2xl">
                                {userName} 👋
                            </Text>
                            {isPro && (
                                <View style={styles.proBadge}>
                                    <Crown size={12} color={Colors.white} fill={Colors.white} />
                                    <Text variant="caption" size="xs" color={Colors.white} weight="bold">
                                        PRO
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text variant="body" size="base" color={Colors.gray500}>
                            Ready to stay in ketosis?
                        </Text>
                    </View>
                    <View style={[styles.scansBadge, isPro && styles.scansBadgePro]}>
                        <Text variant="heading" size="2xl" color={isPro ? Colors.accentPurple : Colors.ketoSafe}>
                            {isPro ? '∞' : scansRemaining}
                        </Text>
                        <Text variant="caption" size="xs" color={isPro ? Colors.accentPurple : Colors.gray500}>
                            {isPro ? 'Pro Active' : 'scans left'}
                        </Text>
                    </View>
                </AnimatedView>

                {/* Daily Progress */}
                <AnimatedView animation="slideUp" delay={100}>
                    <MacroSummary macros={dailyMacros} />
                </AnimatedView>

                {/* Main CTAs */}
                <View style={styles.ctas}>
                    <Text variant="heading" size="lg">
                        What would you like to check?
                    </Text>

                    {/* Scan Meal Card */}
                    <AnimatedView animation="slideUp" delay={50}>
                        <Pressable
                            style={styles.ctaCard}
                            onPress={() => {
                                haptics.light()
                                onScanMeal()
                            }}
                        >
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
                    </AnimatedView>

                    {/* Scan Product Card */}
                    <AnimatedView animation="slideUp" delay={100}>
                        <Pressable
                            style={styles.ctaCard}
                            onPress={() => {
                                haptics.light()
                                onScanProduct()
                            }}
                        >
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
                    </AnimatedView>
                </View>

                {/* Recent Scans Preview */}
                <AnimatedView animation="slideUp" delay={250} style={styles.recent}>
                    <View style={styles.recentHeader}>
                        <Text variant="heading" size="base">Recent Activity</Text>
                        <TouchableOpacity onPress={onViewHistory}>
                            <Text variant="body" size="sm" color={Colors.ketoSafe} weight="bold">View All</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.recentEmpty}>
                        <Text variant="body" size="3xl">✨</Text>
                        <Text variant="body" size="sm" color={Colors.gray500} align="center">
                            Your keto journey starts here.
                        </Text>
                    </View>
                </AnimatedView>
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
        minWidth: 80,
    },
    scansBadgePro: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)', // accentPurple with low opacity
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.accentPurple,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
        marginLeft: Spacing.sm,
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

