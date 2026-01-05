/**
 * ResultScreen
 * Displays keto score, verdict, macros, and share option
 * Includes confidence-based "Tap to Review" flow
 */

import React, { useState, useCallback } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Text } from '../components/atoms'
import { ScoreCircle, VerdictPill, MacroChart, CorrectionSheet, CorrectionResult } from '../components/ui'
import { Colors, Spacing, BorderRadius } from '../constants/theme'
import { AnimatedView } from '../components/layout/AnimatedView'
import ConfettiCannon from 'react-native-confetti-cannon'
import type { KetoVerdict, Macros, ScanType, DetectedFood, getConfidenceLevel } from '../types'
import { haptics } from '../services/hapticsService'
import { logCorrection } from '../services/logService'
import { AlertTriangle } from 'lucide-react-native'

interface ResultScreenProps {
    score: number
    verdict: KetoVerdict
    macros?: Macros
    scanType: ScanType
    swapSuggestion?: string
    foods?: DetectedFood[]
    plateConfidence?: number
    scanId?: string
    onBack: () => void
    onShare: () => void
    onScanAgain: () => void
    onRecalculate?: (foods: DetectedFood[]) => void
}

export function ResultScreen(props: ResultScreenProps) {
    const {
        score,
        verdict,
        macros,
        scanType,
        swapSuggestion,
        foods = [],
        plateConfidence = 1.0,
        scanId = 'unknown',
        onBack,
        onShare,
        onScanAgain,
        onRecalculate,
    } = props

    const [showCorrectionSheet, setShowCorrectionSheet] = useState(false)
    const [currentScore, setCurrentScore] = useState(score)
    const [currentVerdict, setCurrentVerdict] = useState(verdict)

    const title = scanType === 'meal' ? 'Meal Analysis' : 'Product Analysis'
    const isHighScore = currentScore >= 80

    // Show "Tap to review" when plate confidence is low or any high-carb item has low confidence
    const shouldShowReviewPrompt = plateConfidence < 0.65 ||
        foods.some(f => f.carb_risk !== 'low' && f.confidence < 0.8)

    const handleCorrections = useCallback(async (corrections: CorrectionResult[]) => {
        haptics.success()

        // Log corrections silently
        for (const c of corrections) {
            await logCorrection({
                scan_id: scanId,
                food_label: c.originalFood.name,
                model_confidence: c.originalFood.confidence,
                user_action: c.action,
                replacement_label: c.replacementName,
                timestamp: new Date().toISOString(),
            })
        }

        // Apply corrections to foods list
        const updatedFoods = foods.map(food => {
            const correction = corrections.find(c => c.originalFood.name === food.name)
            if (!correction) return food

            if (correction.action === 'removed') {
                return null // Will be filtered out
            }
            if (correction.action === 'replaced' && correction.replacementName) {
                return { ...food, name: correction.replacementName }
            }
            return food
        }).filter(Boolean) as DetectedFood[]

        // Trigger recalculation if callback provided
        if (onRecalculate) {
            onRecalculate(updatedFoods)
        }

        // Simple score adjustment for demo (in production, this would be a full recalc)
        const removedCount = corrections.filter(c => c.action === 'removed').length
        const newScore = Math.min(100, currentScore + (removedCount * 5))
        setCurrentScore(newScore)

        if (newScore >= 75 && currentVerdict === 'borderline') {
            setCurrentVerdict('safe')
        }
    }, [foods, scanId, currentScore, currentVerdict, onRecalculate])

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
                    <ScoreCircle score={currentScore} verdict={currentVerdict} animated={true} />
                    <VerdictPill verdict={currentVerdict} size="lg" />
                </AnimatedView>

                {/* Tap to Review Prompt */}
                {shouldShowReviewPrompt && foods.length > 0 && (
                    <AnimatedView animation="slideUp" delay={600}>
                        <Pressable
                            style={styles.reviewPrompt}
                            onPress={() => {
                                haptics.light()
                                setShowCorrectionSheet(true)
                            }}
                        >
                            <AlertTriangle size={18} color={Colors.ketoBorderline} />
                            <Text variant="body" size="sm" color={Colors.gray600}>
                                Low confidence — hidden carbs possible
                            </Text>
                            <Text variant="caption" color={Colors.ketoSafe}>Tap to review</Text>
                        </Pressable>
                    </AnimatedView>
                )}

                {/* Macros Section */}
                {macros && (
                    <AnimatedView animation="slideUp" delay={800} style={styles.macrosSection}>
                        <Text variant="heading" size="lg">Nutritional Breakdown</Text>
                        <MacroChart macros={macros} showLabels={true} />
                    </AnimatedView>
                )}

                {/* Swap Suggestion */}
                {swapSuggestion && (
                    <AnimatedView animation="slideUp" delay={1000} style={[styles.swap, styles[`swap_${currentVerdict}`]]}>
                        <Text variant="heading" size="base">
                            {currentVerdict === 'safe' ? '✅ Great choice!' : '💡 Keto-friendly swap'}
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

            {/* Correction Sheet */}
            <CorrectionSheet
                visible={showCorrectionSheet}
                foods={foods}
                onClose={() => setShowCorrectionSheet(false)}
                onCorrect={handleCorrections}
            />
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
    reviewPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.ketoBorderlineDim,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
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
    swap_unknown: {
        backgroundColor: Colors.gray100,
        borderLeftColor: Colors.gray500,
    },
    actions: {
        padding: Spacing['2xl'],
        gap: Spacing.md,
    },
    button: {
        marginBottom: Spacing.sm,
    },
})
