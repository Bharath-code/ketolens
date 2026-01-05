/**
 * SplashScreen
 * Value proposition and onboarding entry point
 */

import React from 'react'
import { View, StyleSheet, SafeAreaView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Button, Text } from '../components/atoms'
import { Colors, Spacing, BorderRadius } from '../constants/theme'

interface SplashScreenProps {
    onGetStarted: () => void
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
    return (
        <SafeAreaView style={styles.container}>
            {/* Background gradient */}
            <LinearGradient
                colors={[Colors.ketoSafe, 'rgba(16, 185, 129, 0.8)', Colors.white]}
                style={styles.background}
            />

            {/* Content */}
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.logo}>
                    <Text variant="display" size="5xl" align="center">🥗</Text>
                    <Text variant="display" size="4xl" color={Colors.white} align="center">
                        KetoLens
                    </Text>
                </View>

                {/* Tagline */}
                <View style={styles.tagline}>
                    <Text variant="display" size="3xl" align="center" color={Colors.gray900}>
                        Know Before You Eat
                    </Text>
                    <Text variant="body" size="lg" align="center" color={Colors.gray600}>
                        Instant keto verdicts for meals and groceries
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.features}>
                    <FeatureItem icon="📷" text="Snap any meal" />
                    <FeatureItem icon="🏷️" text="Scan product labels" />
                    <FeatureItem icon="✅" text="Get instant verdicts" />
                </View>
            </View>

            {/* CTA */}
            <View style={styles.cta}>
                <Button variant="primary" size="xl" fullWidth onPress={onGetStarted}>
                    Get Started Free
                </Button>
                <Text variant="caption" size="sm" align="center" color={Colors.gray500}>
                    5 free scans • No credit card required
                </Text>
            </View>
        </SafeAreaView>
    )
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.featureItem}>
            <Text variant="body" size="2xl">{icon}</Text>
            <Text variant="body" size="base" weight="medium" color={Colors.gray800}>
                {text}
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing['3xl'],
        paddingTop: Spacing['6xl'],
        gap: Spacing['4xl'],
    },
    logo: {
        alignItems: 'center',
        gap: Spacing.sm,
    },
    tagline: {
        alignItems: 'center',
        gap: Spacing.md,
    },
    features: {
        width: '100%',
        maxWidth: 300,
        gap: Spacing.lg,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
        padding: Spacing.lg,
        backgroundColor: Colors.gray50,
        borderRadius: BorderRadius.xl,
    },
    cta: {
        padding: Spacing['2xl'],
        paddingBottom: Spacing['4xl'],
        gap: Spacing.md,
    },
})

export default SplashScreen
