/**
 * ResultScreen
 * Displays keto score, verdict, macros, and share option
 * Includes confidence-based "Tap to Review" flow and share card capture
 */

import React, { useState, useCallback, useRef } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Text, Loader } from '../components/atoms'
import { ScoreCircle, VerdictPill, MacroChart, CorrectionSheet, ShareCard } from '../components/ui'
import type { CorrectionResult } from '../components/ui/CorrectionSheet'
import { Colors, Spacing, BorderRadius } from '../constants/theme'
import { AnimatedView } from '../components/layout/AnimatedView'
import ConfettiCannon from 'react-native-confetti-cannon'
import type { KetoVerdict, Macros, ScanType, DetectedFood } from '../types'
import { haptics } from '../services/hapticsService'
import { logCorrection } from '../services/logService'
import { ShadowDbService } from '../services/shadowDbService'
import { shareResult } from '../services/shareService'
import { AlertTriangle, Share2 } from 'lucide-react-native'

interface ResultScreenProps {
    score: number
    verdict: KetoVerdict
    macros?: Macros
    scanType: ScanType
    swapSuggestion?: string
    foods?: DetectedFood[]
    plateConfidence?: number
    scanId?: string
    productName?: string
    userId?: string
    onBack: () => void
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
        productName,
        userId,
        onBack,
        onScanAgain,
        onRecalculate,
    } = props

    // Debug logging
    console.log('[ResultScreen] Props received:')
    console.log('  - userId:', userId)
    console.log('  - productName:', productName)
    console.log('  - score:', score)
    console.log('  - verdict:', verdict)

    const shareCardRef = useRef<View>(null)
    const [showCorrectionSheet, setShowCorrectionSheet] = useState(false)
    const [currentScore, setCurrentScore] = useState(score)
    const [currentVerdict, setCurrentVerdict] = useState(verdict)
    const [isSharing, setIsSharing] = useState(false)

    const title = scanType === 'meal' ? 'Meal Analysis' : 'Product Analysis'
    const isHighScore = currentScore >= 80

    // Show "Tap to review" when plate confidence is low or any high-carb item has low confidence
    const shouldShowReviewPrompt = plateConfidence < 0.65 ||
        foods.some(f => f.carb_risk !== 'low' && f.confidence < 0.8)

    const handleCorrections = useCallback(async (corrections: CorrectionResult[]) => {
        haptics.success()

        // Log corrections to Shadow DB
        for (const c of corrections) {
            await ShadowDbService.submitCorrection({
                product_id: scanId, // In this context, scanId should be product_id from Shadow DB if available
                scan_event_id: scanId, // Need to handle IDs mapping carefully
                action: c.action,
                original_label: c.originalFood.name,
                corrected_label: c.replacementName,
            })
        }

        // Apply corrections to foods list
        const updatedFoods = foods.map(food => {
            const correction = corrections.find(c => c.originalFood.name === food.name)
            if (!correction) return food

            if (correction.action === 'removed') {
                return null
            }
            if (correction.action === 'replaced' && correction.replacementName) {
                return { ...food, name: correction.replacementName }
            }
            return food
        }).filter(Boolean) as DetectedFood[]

        if (onRecalculate) {
            onRecalculate(updatedFoods)
        }

        const removedCount = corrections.filter(c => c.action === 'removed').length
        const newScore = Math.min(100, currentScore + (removedCount * 5))
        setCurrentScore(newScore)

        if (newScore >= 75 && currentVerdict === 'borderline') {
            setCurrentVerdict('safe')
        }
    }, [foods, scanId, currentScore, currentVerdict, onRecalculate])

    const handleShare = useCallback(async () => {
        haptics.light()
        setIsSharing(true)

        try {
            await shareResult(shareCardRef, {
                score: currentScore,
                verdict: currentVerdict,
                userId,
                productName,
            })
        } catch (error) {
            console.error('Share failed:', error)
        } finally {
            setIsSharing(false)
        }
    }, [currentScore, currentVerdict, userId, productName])

    if (isSharing) {
        return <Loader fullScreen message="Preparing share card..." />
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Hidden Share Card (off-screen for capture) */}
            <View style={styles.hiddenCardContainer}>
                <ShareCard
                    ref={shareCardRef}
                    score={currentScore}
                    verdict={currentVerdict}
                    macros={macros}
                    productName={productName}
                />
            </View>

            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={onBack} style={styles.backButton}>
                    <Text variant="body" size="2xl">←</Text>
                </Pressable>
                <Text variant="heading" size="lg">{title}</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollContent} contentContainerStyle={styles.content}>
                {/* Score Section */}
                <AnimatedView animation="scaleIn" delay={200} style={styles.scoreSection}>
                    <ScoreCircle score={currentScore} verdict={currentVerdict} animated={true} />
                    <VerdictPill verdict={currentVerdict} size="lg" />
                </AnimatedView>

                {/* Product Name */}
                {productName && (
                    <Text variant="body" size="base" color={Colors.gray600} align="center" style={{ marginBottom: Spacing.lg }}>
                        {productName}
                    </Text>
                )}

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
                    <AnimatedView animation="slideUp" delay={1000} style={[styles.swap, styles[`swap_${currentVerdict}`] || styles.swap_unknown]}>
                        <Text variant="heading" size="base">
                            {currentVerdict === 'safe' ? '✅ Great choice!' : '💡 Keto-friendly swap'}
                        </Text>
                        <Text variant="body" size="base">
                            {swapSuggestion}
                        </Text>
                    </AnimatedView>
                )}
            </ScrollView>

            {/* Action Buttons */}
            <AnimatedView animation="slideUp" delay={1200} style={styles.actions}>
                <Button
                    variant="secondary"
                    fullWidth
                    onPress={handleShare}
                    containerStyle={styles.button}
                >
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
    hiddenCardContainer: {
        position: 'absolute',
        left: -1000, // Off-screen
        top: 0,
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
    scrollContent: {
        flex: 1,
    },
    content: {
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
        borderTopWidth: 1,
        borderTopColor: Colors.gray100,
    },
    button: {
        marginBottom: Spacing.sm,
    },
})
