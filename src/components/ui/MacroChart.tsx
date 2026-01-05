/**
 * MacroChart Component
 * Visual breakdown of macro nutrients
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text } from '../atoms/Text'
import { Colors, Spacing, BorderRadius } from '../../constants/theme'
import type { Macros } from '../../types'

interface MacroChartProps {
    macros: Macros
    showLabels?: boolean
}

interface MacroItemProps {
    label: string
    value: number
    unit: string
    color: string
    percentage?: number
}

function MacroItem({ label, value, unit, color, percentage }: MacroItemProps) {
    return (
        <View style={styles.macroItem}>
            <View style={[styles.macroDot, { backgroundColor: color }]} />
            <View style={styles.macroInfo}>
                <Text variant="body" size="sm" weight="medium">
                    {label}
                </Text>
                <Text variant="body" size="sm" weight="semibold" color={Colors.gray900}>
                    {value}{unit}
                    {percentage !== undefined && (
                        <Text variant="caption" size="sm" color={Colors.gray500}>
                            {' '}({percentage}%)
                        </Text>
                    )}
                </Text>
            </View>
        </View>
    )
}

export function MacroChart({ macros, showLabels = true }: MacroChartProps) {
    const total = macros.fat + macros.protein + macros.net_carbs
    const fatPercent = total > 0 ? Math.round((macros.fat / total) * 100) : 0
    const proteinPercent = total > 0 ? Math.round((macros.protein / total) * 100) : 0
    const carbPercent = total > 0 ? Math.round((macros.net_carbs / total) * 100) : 0

    return (
        <View style={styles.container}>
            {/* Bar visualization */}
            <View style={styles.bar}>
                <View style={[styles.barSegment, styles.barFat, { flex: fatPercent || 1 }]} />
                <View style={[styles.barSegment, styles.barProtein, { flex: proteinPercent || 1 }]} />
                <View style={[styles.barSegment, styles.barCarbs, { flex: carbPercent || 1 }]} />
            </View>

            {/* Legend */}
            {showLabels && (
                <View style={styles.legend}>
                    <MacroItem
                        label="Fat"
                        value={macros.fat}
                        unit="g"
                        color={Colors.ketoSafe}
                        percentage={fatPercent}
                    />
                    <MacroItem
                        label="Protein"
                        value={macros.protein}
                        unit="g"
                        color={Colors.accentBlue}
                        percentage={proteinPercent}
                    />
                    <MacroItem
                        label="Net Carbs"
                        value={macros.net_carbs}
                        unit="g"
                        color={Colors.ketoAvoid}
                        percentage={carbPercent}
                    />
                </View>
            )}

            {/* Calories */}
            {macros.calories > 0 && (
                <View style={styles.calories}>
                    <Text variant="heading" size="xl" weight="bold" color={Colors.gray900}>
                        {macros.calories}
                    </Text>
                    <Text variant="caption" size="sm" color={Colors.gray500}>
                        kcal
                    </Text>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.lg,
    },
    bar: {
        flexDirection: 'row',
        height: 12,
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        backgroundColor: Colors.gray100,
    },
    barSegment: {
        height: '100%',
    },
    barFat: {
        backgroundColor: Colors.ketoSafe,
    },
    barProtein: {
        backgroundColor: Colors.accentBlue,
    },
    barCarbs: {
        backgroundColor: Colors.ketoAvoid,
    },
    legend: {
        gap: Spacing.md,
    },
    macroItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    macroDot: {
        width: 12,
        height: 12,
        borderRadius: BorderRadius.full,
    },
    macroInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    calories: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: Spacing.xs,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.gray200,
    },
})
