/**
 * ShareCard Component
 * Card for capturing social media sharing images
 * Uses forwardRef for react-native-view-shot compatibility
 */

import React, { forwardRef } from 'react'
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
    productName?: string
}

export const ShareCard = forwardRef<View, ShareCardProps>(
    function ShareCard({ score, verdict, macros, productName }, ref) {
        return (
            <View ref={ref} style={styles.card} collapsable={false}>
                <View style={[styles.header, styles[`header_${verdict}`] || styles.header_unknown]}>
                    <Text variant="display" size="2xl" color={Colors.white}>KetoLens</Text>
                    <Text variant="caption" size="xs" color="rgba(255,255,255,0.8)">
                        Instant Verdict • ketolens.app
                    </Text>
                </View>

                <View style={styles.body}>
                    {productName && (
                        <Text variant="body" size="sm" color={Colors.gray600} align="center">
                            {productName}
                        </Text>
                    )}
                    <ScoreCircle score={score} verdict={verdict} size={140} animated={false} />
                    <View style={styles.details}>
                        <VerdictPill verdict={verdict} size="lg" />
                        {macros && (
                            <View style={styles.macros}>
                                <MacroStat label="Net Carbs" value={macros.net_carbs} color={Colors.ketoAvoid} unit="g" />
                                <MacroStat label="Fat" value={macros.fat} color={Colors.ketoSafe} unit="g" />
                                <MacroStat label="Protein" value={macros.protein} color={Colors.accentBlue} unit="g" />
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text variant="caption" size="xs" color={Colors.gray400}>
                        Download KetoLens • Free on App Store & Play Store
                    </Text>
                </View>
            </View>
        )
    }
)

function MacroStat({ label, value, color, unit }: { label: string; value: number; color: string; unit: string }) {
    return (
        <View style={styles.stat}>
            <Text variant="caption" size="xs" color={Colors.gray500}>{label}</Text>
            <Text variant="body" size="base" weight="bold" color={color}>{value}{unit}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
        ...Shadows.lg,
        width: 320,
    },
    header: {
        padding: Spacing.lg,
        alignItems: 'center',
        gap: 4,
    },
    header_safe: { backgroundColor: Colors.ketoSafe },
    header_borderline: { backgroundColor: Colors.ketoBorderline },
    header_avoid: { backgroundColor: Colors.ketoAvoid },
    header_unknown: { backgroundColor: Colors.gray500 },

    body: {
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.lg,
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
    },
    footer: {
        padding: Spacing.md,
        alignItems: 'center',
        backgroundColor: Colors.gray50,
        borderTopWidth: 1,
        borderTopColor: Colors.gray100,
    },
})
