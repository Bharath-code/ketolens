/**
 * ScoreCircle Component
 * Hero component displaying keto score with animated circle
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated, Easing } from 'react-native'
import { Text } from '../atoms/Text'
import { Colors, FontSize } from '../../constants/theme'
import { getVerdictColor } from '../../constants/theme'
import type { KetoVerdict } from '../../types'
import { haptics } from '../../services/hapticsService'

interface ScoreCircleProps {
    score: number
    verdict: KetoVerdict
    size?: number
    animated?: boolean
}

export function ScoreCircle({
    score,
    verdict,
    size = 200,
    animated = true,
}: ScoreCircleProps) {
    const animatedScore = useRef(new Animated.Value(0)).current
    const scoreColor = getVerdictColor(verdict)
    const strokeWidth = 12

    useEffect(() => {
        if (animated) {
            Animated.timing(animatedScore, {
                toValue: score,
                duration: 1200,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: false,
            }).start()
        } else {
            animatedScore.setValue(score)
        }
    }, [score, animated])

    const displayScore = animatedScore.interpolate({
        inputRange: [0, 100],
        outputRange: [0, 100],
        extrapolate: 'clamp',
    })

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Background circle */}
            <View
                style={[
                    styles.circle,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: strokeWidth,
                        borderColor: Colors.gray100,
                    },
                ]}
            />
            {/* Progress circle */}
            <View
                style={[
                    styles.circle,
                    styles.progressCircle,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: strokeWidth,
                        borderColor: scoreColor,
                    },
                ]}
            />
            {/* Score text */}
            <View style={styles.content}>
                <AnimatedScore value={displayScore} color={scoreColor} finalScore={score} />
                <Text variant="caption" weight="semibold" style={styles.label}>
                    {verdict.toUpperCase()}
                </Text>
            </View>
        </View>
    )
}

function AnimatedScore({ value, color, finalScore }: { value: Animated.AnimatedInterpolation<number>; color: string; finalScore: number }) {
    const [displayValue, setDisplayValue] = React.useState(0)
    const hapticMilestones = useRef(new Set<number>()).current

    useEffect(() => {
        const listener = value.addListener(({ value: v }) => {
            const rounded = Math.round(v)
            setDisplayValue(rounded)

            // Trigger haptics at milestones
            if (finalScore > 0) {
                const progress = rounded / finalScore
                if (progress >= 0.25 && !hapticMilestones.has(25)) {
                    haptics.light()
                    hapticMilestones.add(25)
                } else if (progress >= 0.5 && !hapticMilestones.has(50)) {
                    haptics.medium()
                    hapticMilestones.add(50)
                } else if (progress >= 0.75 && !hapticMilestones.has(75)) {
                    haptics.medium()
                    hapticMilestones.add(75)
                } else if (progress >= 1 && !hapticMilestones.has(100)) {
                    haptics.success()
                    hapticMilestones.add(100)
                }
            }
        })
        return () => value.removeListener(listener)
    }, [value, finalScore])

    return (
        <Text
            variant="display"
            size="5xl"
            weight="extrabold"
            color={color}
            style={styles.scoreNumber}
        >
            {displayValue}
        </Text>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
    },
    progressCircle: {
        // The full circle border creates the progress effect
    },
    content: {
        alignItems: 'center',
        gap: 8,
    },
    scoreNumber: {
        lineHeight: 64,
    },
    label: {
        letterSpacing: 2,
        color: Colors.gray600,
    },
})
