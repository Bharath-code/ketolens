/**
 * ProfileScreen
 * User settings and profile information
 */

import React, { useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text, Button } from '../components/atoms'
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme'
import { supabase } from '../services/supabase'

interface ProfileScreenProps {
    session: any
    onLogout: () => void
}

export function ProfileScreen({ session, onLogout }: ProfileScreenProps) {
    const userEmail = session?.user?.email || 'User'

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
                        Account Settings
                    </Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text variant="body">Edit Profile</Text>
                        <Text variant="body" color={Colors.gray400}>→</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text variant="body">Subscription</Text>
                        <Text variant="body" color={Colors.ketoSafe} weight="bold">Free</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text variant="heading" size="lg" style={styles.sectionTitle}>
                        App Preferences
                    </Text>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text variant="body">Daily Carb Goal</Text>
                        <Text variant="body" color={Colors.gray400}>20g</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <Text variant="body">Notifications</Text>
                        <Text variant="body" color={Colors.gray400}>→</Text>
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
})
