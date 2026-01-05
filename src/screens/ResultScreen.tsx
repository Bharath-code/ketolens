/**
 * ResultScreen
 * Displays keto score, verdict, macros, and share option
 */

import React from 'react'
import { View, StyleSheet, SafeAreaView, Pressable } from 'react-native'
import { Button, Text } from '../components/atoms'
import { ScoreCircle, VerdictPill, MacroChart } from '../components/ui'
import { Colors, Spacing, BorderRadius } from '../constants/theme'
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

export function ResultScreen({
    score,
    verdict,
    macros,
    scanType,
    swapSuggestion,
    onBack,
    onShare,
    onScanAgain,
}: ResultScreenProps) {
    const title = scanType === 'meal' ? 'Meal Analysis' : 'Product Analysis'

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
                <View style={styles.scoreSection}>
                    <ScoreCircle score={score} verdict={verdict} animated={true} />
                    <VerdictPill verdict={verdict} size="lg" />
                </View>

                {/* Macros Section */}
                {macros && (
                    <View style={styles.macrosSection}>
                        <Text variant="heading" size="lg">Nutritional Breakdown</Text>
                        <MacroChart macros={macros} showLabels={true} />
                    </View>
                )}

                {/* Swap Suggestion */}
                {swapSuggestion && (
                    <View style={[styles.swap, styles[`swap_${verdict}`]]}>
                        <Text variant="heading" size="base">
                            {verdict === 'safe' ? '✅ Great choice!' : '💡 Keto-friendly swap'}
                        </Text>
                        <Text variant="body" size="base">
                            {swapSuggestion}
                        </Text>
                    </View>
                )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <Button variant="primary" size="lg" fullWidth onPress={onShare}>
                    Share Result
                </Button>
                <Button variant="secondary" size="lg" fullWidth onPress={onScanAgain}>
                    Scan Another
                </Button>
            </View>
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
})

export default ResultScreen
