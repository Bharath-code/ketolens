import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Navbar, Screen } from '../components/layout';
import { Text, Button, Loader } from '../components/atoms';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { MotiView, AnimatePresence } from 'moti';
import { Crown, Check, Zap, Flame, ShieldCheck, X } from 'lucide-react-native';
import { useIAP, type Purchase, type Subscription, ErrorCode } from 'react-native-iap';
import { supabase } from '../services/supabase';
import { haptics } from '../services/hapticsService';
import { AnalyticsService, EVENTS } from '../services/analyticsService';
import { useEffect } from 'react';

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

const SUB_SKUS = ['mealmind_premium_monthly'];

export function PaywallScreen({ onBack, onSuccess, userId, userEmail }: PaywallScreenProps) {
    const {
        connected,
        subscriptions,
        getSubscriptions,
        requestSubscription,
        finishTransaction,
        currentPurchase,
        currentPurchaseError,
    } = useIAP() as any;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch products when connected
    useEffect(() => {
        if (connected) {
            getSubscriptions({ skus: SUB_SKUS });
        }
    }, [connected]);

    useEffect(() => {
        AnalyticsService.track(EVENTS.PAYWALL_VIEWED, { userId });
    }, []);

    // 2. Listen for purchase success
    useEffect(() => {
        const checkPurchase = async () => {
            if (currentPurchase) {
                const receipt = currentPurchase.transactionReceipt;
                if (receipt) {
                    try {
                        setLoading(true);
                        // Verify with backend
                        const { error: verifyError } = await supabase.functions.invoke('verify-purchase', {
                            body: {
                                receipt,
                                platform: currentPurchase.productId.includes('ios') ? 'ios' : 'android',
                                userId
                            },
                        });

                        if (verifyError) throw verifyError;

                        await finishTransaction({ purchase: currentPurchase, isConsumable: false });
                        AnalyticsService.track(EVENTS.PURCHASE_COMPLETED, {
                            productId: currentPurchase.productId,
                            userId
                        });
                        haptics.success();
                        onSuccess();
                    } catch (err: any) {
                        console.error('[IAP] Verification failed:', err);
                        AnalyticsService.track(EVENTS.PURCHASE_FAILED, { error: err.message, userId });
                        setError('Verification failed. Please try "Restore Purchases".');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        };
        checkPurchase();
    }, [currentPurchase]);

    // 3. Listen for errors
    useEffect(() => {
        if (currentPurchaseError) {
            console.warn('[IAP] Purchase error:', currentPurchaseError);
            setLoading(false);
            if (currentPurchaseError.code !== ErrorCode.UserCancelled && (currentPurchaseError.code as any) !== 'E_USER_CANCELLED') {
                setError(currentPurchaseError.message);
            }
        }
    }, [currentPurchaseError]);

    const handleUpgrade = async () => {
        if (!userId) {
            setError('Please sign in to upgrade');
            return;
        }

        setLoading(true);
        setError(null);
        haptics.medium();

        try {
            AnalyticsService.track(EVENTS.PURCHASE_STARTED, { sku: SUB_SKUS[0], userId });
            await requestSubscription({ sku: SUB_SKUS[0] });
        } catch (err: any) {
            console.error('[Paywall] Request Subscription Error:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        // Implementation remains similar but uses direct call for simplicity
        // in a production app, useIAP might have more helpers
        setLoading(true);
        setError(null);
        try {
            // Re-fetch available purchases
            // Note: In some versions of useIAP, you'd call a helper, but RNIap.getAvailablePurchases is still valid
            const { getAvailablePurchases } = require('react-native-iap');
            const purchases = await getAvailablePurchases();
            if (purchases && purchases.length > 0) {
                const lastPurchase = purchases[purchases.length - 1];
                const { error: verifyError } = await supabase.functions.invoke('verify-purchase', {
                    body: { receipt: lastPurchase.transactionReceipt, userId },
                });
                if (!verifyError) {
                    haptics.success();
                    onSuccess();
                } else {
                    throw verifyError;
                }
            } else {
                setError('No previous purchases found.');
            }
        } catch (err: any) {
            setError('Restore failed: ' + err.message);
        } finally {
            setLoading(false);
        }
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

                    {error && (
                        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.errorBox}>
                            <Text variant="body" size="xs" color={Colors.ketoAvoid} align="center">
                                {error}
                            </Text>
                        </MotiView>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <View style={styles.glassCard}>
                        <View style={styles.pricing}>
                            <View>
                                {subscriptions.length > 0 ? (
                                    <Text variant="heading" size="xl" color={Colors.white}>
                                        {(subscriptions[0] as any).localizedPrice || '$9.99'}<Text size="sm" color={Colors.gray400}>/mo</Text>
                                    </Text>
                                ) : (
                                    <View style={styles.pricePlaceholder}>
                                        <Text variant="heading" size="xl" color={Colors.white}>$9.99</Text>
                                    </View>
                                )}
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
                                Start Free Trial
                            </Button>
                        </View>
                        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
                            <Text variant="body" size="xs" color={Colors.gray500} align="center">
                                Restore Purchases
                            </Text>
                        </TouchableOpacity>
                        <Text variant="body" size="xs" color={Colors.gray500} align="center" style={styles.legal}>
                            Cancel anytime in App Store. By continuing, you agree to our Terms and Privacy Policy.
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
        backgroundColor: '#0A0A0A', // Dark OLED-friendly background
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
        filter: 'blur(100px)',
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
        backgroundColor: 'rgba(16, 185, 129, 0.1)', // KetoSafe with low opacity
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        flex: 1,
        gap: 2,
    },
    errorBox: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: BorderRadius.md,
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
    pricePlaceholder: {
        minWidth: 80,
    },
    restoreBtn: {
        marginTop: Spacing.sm,
        padding: Spacing.xs,
    }
});
