/**
 * CorrectionSheet
 * Trust-building bottom sheet for reviewing and correcting AI detections.
 * Frame as "Review" / "Adjust", never "Fix the AI".
 */

import React, { useState, useCallback } from 'react'
import { View, StyleSheet, Pressable, ScrollView, Modal } from 'react-native'
import { Text, Button } from '../atoms'
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme'
import { MotiView, AnimatePresence } from 'moti'
import { haptics } from '../../services/hapticsService'
import { getConfidenceLevel, DetectedFood } from '../../types'
import { CheckCircle2, AlertCircle, AlertTriangle, X, Plus, RefreshCw, Trash2 } from 'lucide-react-native'

interface CorrectionSheetProps {
    visible: boolean
    foods: DetectedFood[]
    onClose: () => void
    onCorrect: (corrections: CorrectionResult[]) => void
}

export interface CorrectionResult {
    originalFood: DetectedFood
    action: 'confirmed' | 'removed' | 'replaced'
    replacementName?: string
}

// Curated replacement suggestions (not AI guessing)
const COMMON_REPLACEMENTS: Record<string, string[]> = {
    'sauce': ['Butter', 'Olive oil', 'Garlic butter', 'Cheese sauce', 'No sauce'],
    'rice': ['Cauliflower rice', 'Riced broccoli', 'No rice'],
    'bread': ['Lettuce wrap', 'Cloud bread', 'No bread'],
    'potato': ['Mashed cauliflower', 'Turnip', 'No potato'],
    'pasta': ['Zucchini noodles', 'Shirataki', 'Spaghetti squash'],
    'default': ['Remove item', 'Mark as correct']
}

const QUICK_ADD_OPTIONS = ['Cheese', 'Bread', 'Potatoes', 'Vegetables', 'Sauce', 'Other']

function getConfidenceIcon(confidence: number) {
    const level = getConfidenceLevel(confidence)
    switch (level) {
        case 'high':
            return <CheckCircle2 size={20} color={Colors.ketoSafe} />
        case 'medium':
            return <AlertCircle size={20} color={Colors.ketoBorderline} />
        case 'low':
            return <AlertTriangle size={20} color={Colors.ketoAvoid} />
    }
}

function getConfidenceLabel(confidence: number): string {
    const level = getConfidenceLevel(confidence)
    switch (level) {
        case 'high': return 'High confidence'
        case 'medium': return 'Medium confidence'
        case 'low': return 'Low confidence'
    }
}

export function CorrectionSheet({ visible, foods, onClose, onCorrect }: CorrectionSheetProps) {
    const [corrections, setCorrections] = useState<Map<string, CorrectionResult>>(new Map())
    const [selectedFood, setSelectedFood] = useState<DetectedFood | null>(null)
    const [showQuickAdd, setShowQuickAdd] = useState(false)

    const handleFoodPress = useCallback((food: DetectedFood) => {
        haptics.light()
        setSelectedFood(food)
    }, [])

    const handleAction = useCallback((food: DetectedFood, action: 'confirmed' | 'removed' | 'replaced', replacementName?: string) => {
        haptics.medium()
        const newCorrections = new Map(corrections)
        newCorrections.set(food.name, { originalFood: food, action, replacementName })
        setCorrections(newCorrections)
        setSelectedFood(null)
    }, [corrections])

    const handleSubmit = useCallback(() => {
        haptics.success()
        onCorrect(Array.from(corrections.values()))
        onClose()
    }, [corrections, onCorrect, onClose])

    const getReplacementOptions = (foodName: string) => {
        const lower = foodName.toLowerCase()
        for (const [key, options] of Object.entries(COMMON_REPLACEMENTS)) {
            if (lower.includes(key)) return options
        }
        return COMMON_REPLACEMENTS.default
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <MotiView
                    from={{ translateY: 400 }}
                    animate={{ translateY: 0 }}
                    exit={{ translateY: 400 }}
                    transition={{ type: 'spring', damping: 20 }}
                    style={styles.sheet}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text variant="heading" size="lg">Review items on your plate</Text>
                        <Pressable onPress={onClose} hitSlop={16}>
                            <X size={24} color={Colors.gray500} />
                        </Pressable>
                    </View>

                    {/* Food List */}
                    <ScrollView style={styles.foodList} showsVerticalScrollIndicator={false}>
                        {foods.map((food, index) => {
                            const correction = corrections.get(food.name)
                            const isConfirmed = correction?.action === 'confirmed'
                            const isRemoved = correction?.action === 'removed'
                            const isReplaced = correction?.action === 'replaced'

                            return (
                                <Pressable
                                    key={`${food.name}-${index}`}
                                    style={[
                                        styles.foodItem,
                                        isRemoved && styles.foodItemRemoved
                                    ]}
                                    onPress={() => handleFoodPress(food)}
                                >
                                    <View style={styles.foodIcon}>
                                        {getConfidenceIcon(food.confidence)}
                                    </View>
                                    <View style={styles.foodInfo}>
                                        <Text
                                            variant="body"
                                            weight="semibold"
                                            style={isRemoved ? styles.strikethrough : undefined}
                                        >
                                            {isReplaced ? correction.replacementName : food.name}
                                        </Text>
                                        <Text variant="caption" color={Colors.gray500}>
                                            {getConfidenceLabel(food.confidence)}
                                        </Text>
                                    </View>
                                    {isConfirmed && (
                                        <CheckCircle2 size={20} color={Colors.ketoSafe} />
                                    )}
                                    {isRemoved && (
                                        <Trash2 size={20} color={Colors.ketoAvoid} />
                                    )}
                                    {isReplaced && (
                                        <RefreshCw size={20} color={Colors.ketoBorderline} />
                                    )}
                                </Pressable>
                            )
                        })}

                        {/* Something missing? */}
                        <Pressable
                            style={styles.addMissing}
                            onPress={() => {
                                haptics.light()
                                setShowQuickAdd(!showQuickAdd)
                            }}
                        >
                            <Plus size={20} color={Colors.ketoSafe} />
                            <Text variant="body" color={Colors.ketoSafe}>Something missing?</Text>
                        </Pressable>

                        {showQuickAdd && (
                            <MotiView
                                from={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={styles.quickAddContainer}
                            >
                                {QUICK_ADD_OPTIONS.map(option => (
                                    <Pressable
                                        key={option}
                                        style={styles.quickAddOption}
                                        onPress={() => {
                                            haptics.medium()
                                            // In production, this would add to the foods list
                                            console.log('Add:', option)
                                            setShowQuickAdd(false)
                                        }}
                                    >
                                        <Text variant="body">{option}</Text>
                                    </Pressable>
                                ))}
                            </MotiView>
                        )}
                    </ScrollView>

                    {/* Submit */}
                    <View style={styles.footer}>
                        <Button onPress={handleSubmit} fullWidth>
                            Update Results
                        </Button>
                    </View>

                    {/* Item Action Sheet */}
                    <AnimatePresence>
                        {selectedFood && (
                            <MotiView
                                from={{ opacity: 0, translateY: 100 }}
                                animate={{ opacity: 1, translateY: 0 }}
                                exit={{ opacity: 0, translateY: 100 }}
                                style={styles.actionSheet}
                            >
                                <Text variant="heading" size="base" style={styles.actionTitle}>
                                    {selectedFood.name}
                                </Text>

                                <Text variant="caption" color={Colors.gray500} style={{ marginBottom: Spacing.lg }}>
                                    Replace with similar:
                                </Text>

                                {getReplacementOptions(selectedFood.name).map(option => (
                                    <Pressable
                                        key={option}
                                        style={styles.actionOption}
                                        onPress={() => {
                                            if (option === 'Remove item') {
                                                handleAction(selectedFood, 'removed')
                                            } else if (option === 'Mark as correct') {
                                                handleAction(selectedFood, 'confirmed')
                                            } else {
                                                handleAction(selectedFood, 'replaced', option)
                                            }
                                        }}
                                    >
                                        <Text variant="body">{option}</Text>
                                    </Pressable>
                                ))}

                                <Pressable
                                    style={styles.cancelButton}
                                    onPress={() => setSelectedFood(null)}
                                >
                                    <Text variant="body" color={Colors.gray500}>Cancel</Text>
                                </Pressable>
                            </MotiView>
                        )}
                    </AnimatePresence>
                </MotiView>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: BorderRadius['2xl'],
        borderTopRightRadius: BorderRadius['2xl'],
        paddingTop: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['3xl'],
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    foodList: {
        maxHeight: 300,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    foodItemRemoved: {
        opacity: 0.5,
    },
    foodIcon: {
        marginRight: Spacing.md,
    },
    foodInfo: {
        flex: 1,
    },
    strikethrough: {
        textDecorationLine: 'line-through',
    },
    addMissing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.lg,
    },
    quickAddContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        paddingBottom: Spacing.lg,
    },
    quickAddOption: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.gray100,
        borderRadius: BorderRadius.full,
    },
    footer: {
        marginTop: Spacing.xl,
    },
    actionSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.white,
        borderTopLeftRadius: BorderRadius['2xl'],
        borderTopRightRadius: BorderRadius['2xl'],
        padding: Spacing.xl,
        ...Shadows.xl,
    },
    actionTitle: {
        marginBottom: Spacing.md,
    },
    actionOption: {
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    cancelButton: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },
})
