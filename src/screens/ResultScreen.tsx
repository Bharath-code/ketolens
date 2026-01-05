/**
 * ResultScreen
 * Displays keto score, verdict, macros, and share option
 */

import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Text } from '../components/atoms'
import { ScoreCircle, VerdictPill, MacroChart } from '../components/ui'
import { Colors, Spacing, BorderRadius } from '../constants/theme'
import { AnimatedView } from '../components/layout/AnimatedView'
import ConfettiCannon from 'react-native-confetti-cannon'
import type { KetoVerdict, Macros, ScanType } from '../types'

interface ResultScreenProps {
    score: number
    verdict: KetoVerdict
    macros?: Macros
    scanType: ScanType
    swapSuggestion?: string
    onBack: () => void
    onShare: () => void
    onScanAgain: () => void
}

export function ResultScreen(props: ResultScreenProps) {
    const {
        score,
        verdict,
        macros,
        scanType,
        swapSuggestion,
        onBack,
        onShare,
        onScanAgain,
    } = props

    const title = scanType === 'meal' ? 'Meal Analysis' : 'Product Analysis'
    const isHighScore = score >= 80

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Text variant="body" size="2xl">←</Text>
                </Pressable>
                <Text variant="heading" size="lg">{title}</Text>
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                {/* Score Section */}
                <AnimatedView animation="scaleIn" delay={200} style={styles.scoreSection}>
                    <ScoreCircle score={score} verdict={verdict} animated={true} />
                    <VerdictPill verdict={verdict} size="lg" />
                </AnimatedView>

                {/* Macros Section */}
                {macros && (
                    <AnimatedView animation="slideUp" delay={800} style={styles.macrosSection}>
                        <Text variant="heading" size="lg">Nutritional Breakdown</Text>
                        <MacroChart macros={macros} showLabels={true} />
                    </AnimatedView>
                )}

                {/* Swap Suggestion */}
                {swapSuggestion && (
                    <AnimatedView animation="slideUp" delay={1000} style={[styles.swap, styles[`swap_${verdict}`]]}>
                        <Text variant="heading" size="base">
                            {verdict === 'safe' ? '✅ Great choice!' : '💡 Keto-friendly swap'}
                        </Text>
                        <Text variant="body" size="base">
                            {swapSuggestion}
                        </Text>
                    </AnimatedView>
                )}
            </View>

            {/* Action Buttons */}
            <AnimatedView animation="slideUp" delay={1200} style={styles.actions}>
                <Button variant="secondary" fullWidth onPress={onShare} containerStyle={styles.button}>
                    Share Result
                </Button>
                <Button variant="primary" fullWidth onPress={onScanAgain} containerStyle={styles.button}>
                    Scan Another
                </Button>
            </AnimatedView>

            {isHighScore && (
                <ConfettiCannon
                    count={150}
                    origin={{ x: -10, y: 0 }}
                    fadeOut={true}
                    colors={[Colors.ketoSafe, '#FFD700', '#FFFFFF']}
                />
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        width: 44,
    },
    content: {
        flex: 1,
        padding: Spacing['2xl'],
    },
    scoreSection: {
        alignItems: 'center',
        gap: Spacing['2xl'],
        paddingVertical: Spacing['3xl'],
    },
    macrosSection: {
        gap: Spacing.lg,
        padding: Spacing['2xl'],
        backgroundColor: Colors.gray50,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing['2xl'],
    },
    swap: {
        gap: Spacing.sm,
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderLeftWidth: 4,
        marginBottom: Spacing['2xl'],
    },
    swap_safe: {
        backgroundColor: Colors.ketoSafeDim,
        borderLeftColor: Colors.ketoSafe,
    },
    swap_borderline: {
        backgroundColor: Colors.ketoBorderlineDim,
        borderLeftColor: Colors.ketoBorderline,
    },
    swap_avoid: {
        backgroundColor: Colors.ketoAvoidDim,
        borderLeftColor: Colors.ketoAvoid,
    },
    actions: {
        padding: Spacing['2xl'],
        gap: Spacing.md,
    },
    button: {
        marginBottom: Spacing.sm,
    },
})
