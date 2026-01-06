import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from '../atoms/Text';
import { Colors, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';

interface Macro {
    label: string;
    current: number;
    target: number;
    unit: string;
    color: string;
    icon: string;
}

interface MacroSummaryProps {
    macros: Macro[];
}

export function MacroSummary({ macros }: MacroSummaryProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#10B981', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBg}
            />
            <BlurView intensity={20} style={styles.blur}>
                <View style={styles.content}>
                    <Text variant="heading" size="lg" color={Colors.white}>Daily Progress</Text>

                    <View style={styles.macrosRow}>
                        {macros.map((macro, index) => {
                            const progress = Math.min(macro.current / macro.target, 1);
                            return (
                                <View key={macro.label} style={styles.macroItem}>
                                    <View style={styles.macroHeader}>
                                        <Text variant="body" size="2xl">{macro.icon}</Text>
                                        <View>
                                            <Text variant="caption" color="rgba(255,255,255,0.7)" weight="bold">{macro.label}</Text>
                                            <Text variant="body" color={Colors.white} weight="bold">{macro.current}{macro.unit}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.progressContainer}>
                                        <MotiView
                                            from={{ width: '0%' }}
                                            animate={{ width: `${progress * 100}%` }}
                                            transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 200 + index * 100 }}
                                            style={[styles.progressBar, { backgroundColor: Colors.white }]}
                                        />
                                    </View>
                                    <Text variant="caption" color="rgba(255,255,255,0.6)" size="xs">
                                        Goal: {macro.target}{macro.unit}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </BlurView>
        </View>
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 180,
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
        ...Shadows.lg,
        marginBottom: Spacing['3xl'],
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    blur: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
        justifyContent: 'space-between',
    },
    macrosRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    macroItem: {
        flex: 1,
        gap: Spacing.sm,
    },
    macroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    progressContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    }
});
