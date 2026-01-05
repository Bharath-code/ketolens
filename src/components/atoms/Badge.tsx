/**
 * Badge Component
 * Small status indicator
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from './Text'
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme'
import { getVerdictColor } from '../../constants/theme'

interface BadgeProps {
    label: string
    verdict?: 'safe' | 'borderline' | 'avoid'
    color?: string
}

export function Badge({ label, verdict, color }: BadgeProps) {
    const bgColor = color || (verdict ? getVerdictColor(verdict) : Colors.gray100)
    const isYellow = verdict === 'borderline'

    return (
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <Text
                variant="caption"
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
    badge: {
        alignSelf: 'flex-start',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: BorderRadius.sm,
    },
    label: {
        fontSize: 10,
        letterSpacing: 0.5,
    }
})
