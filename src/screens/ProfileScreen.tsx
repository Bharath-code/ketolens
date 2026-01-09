/**
 * ProfileScreen
 * User settings and profile information
 */

import React, { useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, Button, Loader } from '../components/atoms'
import { Colors, Spacing, BorderRadius, Shadows, FontSize } from '../constants/theme'
import { supabase } from '../services/supabase'
import { ProfileService, UserProfile } from '../services/profileService'

interface ProfileScreenProps {
    session: any
    onLogout: () => void
}

export function ProfileScreen({ session, onLogout }: ProfileScreenProps) {
    const [profile, setProfile] = React.useState<UserProfile | null>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const loadProfile = async () => {
            if (session?.user?.id) {
                // Logged in user: fetch from Supabase
                const data = await ProfileService.getProfile(session.user.id);
                setProfile(data);
            } else {
                // Guest user: try to load from local storage
                const guestData = await ProfileService.getGuestData();
                if (guestData) {
                    setProfile({
                        id: 'guest',
                        ...guestData.profileData,
                        ...guestData.targets,
                    } as UserProfile);
                }
            }
            setLoading(false);
        };
        loadProfile();
    }, [session]);

    const userEmail = session?.user?.email || 'User'

    if (loading) {
        return <Loader fullScreen message="Loading profile..." />
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.placeholder} />
                <Text variant="heading" size="xl">Profile</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.profileInfo}>
                    <View style={styles.avatar}>
                        <Text variant="heading" size="5xl">👤</Text>
                    </View>
                    <Text variant="heading" size="xl" style={styles.email}>
                        {userEmail}
                    </Text>
                    <Text variant="body" color={Colors.gray500}>
                        Keto Explorer
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text variant="heading" size="lg" style={styles.sectionTitle}>
                        Keto Targets
                    </Text>
                    <View style={styles.targetGrid}>
                        <View style={styles.targetCard}>
                            <Text variant="caption" color={Colors.gray500} weight="bold">CALORIES</Text>
                            <Text variant="heading" size="xl" color={Colors.ketoSafe}>
                                {profile?.calorie_target || 2000}
                            </Text>
                            <Text variant="caption" color={Colors.gray400}>kcal / day</Text>
                        </View>
                        <View style={[styles.targetCard, { borderLeftWidth: 1, borderLeftColor: Colors.gray100 }]}>
                            <Text variant="caption" color={Colors.gray500} weight="bold">NET CARBS</Text>
                            <Text variant="heading" size="xl" color={Colors.ketoSafe}>
                                {profile?.carb_limit || 50}g
                            </Text>
                            <Text variant="caption" color={Colors.gray400}>daily limit</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text variant="heading" size="lg" style={styles.sectionTitle}>
                        Body Metrics
                    </Text>
                    <View style={styles.metricsList}>
                        <View style={styles.metricItem}>
                            <Text variant="body" color={Colors.gray600}>Age</Text>
                            <Text variant="body" weight="bold">{profile?.age || '--'} years</Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text variant="body" color={Colors.gray600}>Weight</Text>
                            <Text variant="body" weight="bold">
                                {profile?.weight || '--'} {profile?.weight_unit}
                            </Text>
                        </View>
                        <View style={styles.metricItem}>
                            <Text variant="body" color={Colors.gray600}>Height</Text>
                            <Text variant="body" weight="bold">
                                {profile?.height || '--'} {profile?.height_unit}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text variant="heading" size="lg" style={styles.sectionTitle}>
                        App Preferences
                    </Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text variant="body">Measurement Units</Text>
                        <Text variant="body" color={Colors.gray400}>
                            {profile?.weight_unit === 'kg' ? 'Metric' : 'Imperial'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text variant="body">Activity Level</Text>
                        <Text variant="body" color={Colors.gray400}>
                            {profile?.activity_level?.replace('_', ' ') || 'Sedentary'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <Button
                    variant="secondary"
                    onPress={onLogout}
                    containerStyle={styles.logoutBtn}
                >
                    Log Out
                </Button>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholder: {
        width: 40,
    },
    content: {
        padding: Spacing['2xl'],
    },
    profileInfo: {
        alignItems: 'center',
        marginBottom: Spacing['4xl'],
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.gray50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
        ...Shadows.sm,
    },
    email: {
        marginBottom: Spacing.xs,
    },
    section: {
        marginBottom: Spacing['3xl'],
    },
    sectionTitle: {
        marginBottom: Spacing.md,
        color: Colors.gray900,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray50,
    },
    logoutBtn: {
        marginTop: Spacing.xl,
        borderColor: Colors.ketoAvoid,
    },
    targetGrid: {
        flexDirection: 'row',
        backgroundColor: Colors.gray50,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.gray100,
    },
    targetCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    metricsList: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.gray100,
        overflow: 'hidden',
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray50,
    },
})
