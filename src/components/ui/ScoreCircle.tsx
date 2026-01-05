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
                <AnimatedScore value={displayScore} color={scoreColor} />
                <Text variant="caption" weight="semibold" style={styles.label}>
                    {verdict.toUpperCase()}
                </Text>
            </View>
        </View>
    )
}

// Animated score number component
function AnimatedScore({ value, color }: { value: Animated.AnimatedInterpolation<number>; color: string }) {
    const [displayValue, setDisplayValue] = React.useState(0)

    useEffect(() => {
        const listener = value.addListener(({ value: v }) => {
            setDisplayValue(Math.round(v))
        })
        return () => value.removeListener(listener)
    }, [value])

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
