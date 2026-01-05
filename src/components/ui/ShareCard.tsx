/**
 * ShareCard Component
 * Card for capturing social media sharing images
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../atoms/Text'
import { ScoreCircle } from './ScoreCircle'
import { VerdictPill } from './VerdictPill'
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme'
import type { KetoVerdict, Macros } from '../../types'

interface ShareCardProps {
    score: number
    verdict: KetoVerdict
    macros?: Macros
}

export function ShareCard({ score, verdict, macros }: ShareCardProps) {
    return (
        <View style={styles.card}>
            <View style={[styles.header, styles[`header_${verdict}`]]}>
                <Text variant="display" size="2xl" color={Colors.white}>KetoLens</Text>
                <Text variant="caption" size="xs" color="rgba(255,255,255,0.8)">
                    Instant Verdict • keto-lens.app
                </Text>
            </View>

            <View style={styles.body}>
                <ScoreCircle score={score} verdict={verdict} size={150} animated={false} />
                <View style={styles.details}>
                    <VerdictPill verdict={verdict} size="sm" />
                    {macros && (
                        <View style={styles.macros}>
                            <MacroStat label="Carbs" value={macros.net_carbs} color={Colors.ketoAvoid} />
                            <MacroStat label="Fat" value={macros.fat} color={Colors.ketoSafe} />
                            <MacroStat label="Prot" value={macros.protein} color={Colors.accentBlue} />
                        </View>
                    )}
                </View>
            </View>
        </View>
    )
}

function MacroStat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <View style={styles.stat}>
            <Text variant="caption" size="xs" color={Colors.gray500}>{label}</Text>
            <Text variant="body" size="base" weight="bold" color={color}>{value}g</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.lg,
        width: 300,
    },
    header: {
        padding: Spacing.lg,
        alignItems: 'center',
        gap: 4,
    },
    header_safe: { backgroundColor: Colors.ketoSafe },
    header_borderline: { backgroundColor: Colors.ketoBorderline },
    header_avoid: { backgroundColor: Colors.ketoAvoid },

    body: {
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.xl,
    },
    details: {
        alignItems: 'center',
        gap: Spacing.lg,
    },
    macros: {
        flexDirection: 'row',
        gap: Spacing.xl,
    },
    stat: {
        alignItems: 'center',
    }
})
