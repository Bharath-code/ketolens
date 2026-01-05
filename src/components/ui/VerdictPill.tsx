/**
 * VerdictPill Component
 * Pill-shaped badge showing keto verdict
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../atoms/Text'
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme'
import { getVerdictLabel, getVerdictEmoji } from '../../constants/keto'
import { getVerdictColor } from '../../constants/theme'
import type { KetoVerdict } from '../../types'

interface VerdictPillProps {
    verdict: KetoVerdict
    size?: 'sm' | 'md' | 'lg'
}

export function VerdictPill({ verdict, size = 'md' }: VerdictPillProps) {
    const label = getVerdictLabel(verdict)
    const emoji = getVerdictEmoji(verdict)
    const color = getVerdictColor(verdict)
    const isYellow = verdict === 'borderline'

    return (
        <View style={[styles.pill, styles[size], { backgroundColor: color }, Shadows.md]}>
            <Text
                variant="body"
                weight="bold"
                color={isYellow ? Colors.gray900 : Colors.white}
                style={styles.emoji}
            >
                {emoji}
            </Text>
            <Text
                variant="body"
                weight="bold"
                color={isYellow ? Colors.gray900 : Colors.white}
                style={styles.label}
            >
                {label}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.full,
        gap: Spacing.sm,
    },
    sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
    },
    md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing['2xl'],
    },
    emoji: {
        fontSize: 16,
    },
    label: {
        letterSpacing: 1,
    },
})
