import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Screen } from '../components/layout';
import { Text, Button } from '../components/atoms';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { MotiView } from 'moti';
import { Crown, Zap, Flame, ShieldCheck, X } from 'lucide-react-native';
import { haptics } from '../services/hapticsService';
import { AnalyticsService, EVENTS } from '../services/analyticsService';

interface PaywallScreenProps {
    onBack: () => void;
    onSuccess: () => void;
    userId?: string;
    userEmail?: string;
}

const { width } = Dimensions.get('window');

const PRO_FEATURES = [
    { title: 'Unlimited Scans', description: 'Analyze every meal without limits', icon: Zap },
    { title: 'Deep Ingredient Analysis', description: 'Uncover hidden seed oils and grains', icon: Flame },
    { title: 'Advanced Grocery Lookup', description: 'Detailed reports for millions of products', icon: ShieldCheck },
    { title: 'Personalized Macro Coaching', description: 'Dynamic targets based on your progress', icon: Crown },
];

/**
 * Simplified PaywallScreen without native IAP.
 * 
 * Since KetoLens qualifies for Play Store payment exemptions (digital goods/SaaS),
 * IAP has been removed. This screen now serves as a marketing/upgrade prompt.
 * 
 * For production monetization, consider:
 * - Stripe web checkout (via WebView or external link)
 * - RevenueCat SDK (if IAP is later required)
 * - Server-side subscription management
 */
export function PaywallScreen({ onBack, onSuccess, userId, userEmail }: PaywallScreenProps) {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        AnalyticsService.track(EVENTS.PAYWALL_VIEWED, { userId });
    }, []);

    const handleUpgrade = async () => {
        haptics.medium();
        setLoading(true);

        AnalyticsService.track(EVENTS.PURCHASE_STARTED, { userId });

        // TODO: Replace with your payment flow (e.g., Stripe checkout URL)
        // For now, simulate a coming soon state
        setTimeout(() => {
            setLoading(false);
            // Show coming soon message or open external payment link
            // Linking.openURL('https://your-stripe-checkout-url.com');
        }, 1000);
    };

    const handleRestore = async () => {
        haptics.light();
        // TODO: Implement restore via your backend subscription check
        // For now, this is a placeholder
    };

    return (
        <Screen padding={false} scrollable={false}>
            <View style={styles.container}>
                {/* Background Decor */}
                <View style={styles.glow} />

                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.closeButton}>
                        <X color={Colors.white} size={24} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        style={styles.hero}
                    >
                        <View style={styles.badge}>
                            <Crown size={16} color={Colors.white} />
                            <Text variant="body" size="xs" color={Colors.white} weight="bold">
                                KETOLENS PRO
                            </Text>
                        </View>
                        <Text variant="heading" size="2xl" color={Colors.white} align="center">
                            Unlock Your Full{"\n"}Keto Potential
                        </Text>
                        <Text variant="body" size="base" color={Colors.gray400} align="center" style={styles.subtitle}>
                            Join 10,000+ users transforming their health with precision analytics.
                        </Text>
                    </MotiView>

                    <View style={styles.featuresList}>
                        {PRO_FEATURES.map((feature, index) => (
                            <MotiView
                                key={index}
                                from={{ opacity: 0, translateX: -20 }}
                                animate={{ opacity: 1, translateX: 0 }}
                                transition={{ delay: 200 + index * 100 }}
                                style={styles.featureItem}
                            >
                                <View style={styles.iconContainer}>
                                    <feature.icon size={20} color={Colors.ketoSafe} />
                                </View>
                                <View style={styles.featureText}>
                                    <Text variant="body" size="base" color={Colors.white} weight="bold">
                                        {feature.title}
                                    </Text>
                                    <Text variant="body" size="sm" color={Colors.gray400}>
                                        {feature.description}
                                    </Text>
                                </View>
                            </MotiView>
                        ))}
                    </View>

                    {/* Coming Soon Banner */}
                    <MotiView
                        from={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 600 }}
                        style={styles.comingSoonBanner}
                    >
                        <Text variant="body" size="sm" color={Colors.ketoSafe} align="center" weight="bold">
                            🚀 Pro subscriptions launching soon!
                        </Text>
                    </MotiView>
                </ScrollView>

                <View style={styles.footer}>
                    <View style={styles.glassCard}>
                        <View style={styles.pricing}>
                            <View>
                                <Text variant="heading" size="xl" color={Colors.white}>
                                    $9.99<Text size="sm" color={Colors.gray400}>/mo</Text>
                                </Text>
                                <Text variant="body" size="xs" color={Colors.ketoSafe}>
                                    7-day free trial included
                                </Text>
                            </View>
                            <Button
                                variant="primary"
                                containerStyle={styles.upgradeButton}
                                onPress={handleUpgrade}
                                loading={loading}
                            >
                                Coming Soon
                            </Button>
                        </View>
                        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
                            <Text variant="body" size="xs" color={Colors.gray500} align="center">
                                Restore Purchases
                            </Text>
                        </TouchableOpacity>
                        <Text variant="body" size="xs" color={Colors.gray500} align="center" style={styles.legal}>
                            Cancel anytime. By continuing, you agree to our Terms and Privacy Policy.
                        </Text>
                    </View>
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    glow: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: Colors.ketoSafeDim,
        opacity: 0.3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: Spacing.xl,
        paddingTop: Spacing['3xl'],
        zIndex: 10,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 200,
    },
    hero: {
        alignItems: 'center',
        marginTop: Spacing.xl,
        marginBottom: Spacing['3xl'],
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.md,
    },
    subtitle: {
        marginTop: Spacing.md,
        lineHeight: 22,
    },
    featuresList: {
        gap: Spacing.xl,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.lg,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        flex: 1,
        gap: 2,
    },
    comingSoonBanner: {
        marginTop: Spacing['2xl'],
        padding: Spacing.md,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.xl,
        paddingBottom: Spacing['3xl'],
    },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: Spacing.xl,
        gap: Spacing.lg,
    },
    pricing: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    upgradeButton: {
        minWidth: 160,
    },
    legal: {
        marginTop: Spacing.sm,
    },
    restoreBtn: {
        marginTop: Spacing.sm,
        padding: Spacing.xs,
    }
});
