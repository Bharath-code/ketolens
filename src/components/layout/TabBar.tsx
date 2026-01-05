/**
 * TabBar Component
 * Bottom navigation bar
 */

import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from '../atoms/Text'
import { Colors, Spacing, Shadows } from '../../constants/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface TabBarProps {
    activeTab: 'home' | 'scan' | 'profile'
    onTabChange: (tab: 'home' | 'scan' | 'profile') => void
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
    const insets = useSafeAreaInsets()

    return (
        <View style={[styles.tabBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
            <TabItem
                icon="🏠"
                label="Home"
                active={activeTab === 'home'}
                onPress={() => onTabChange('home')}
            />
            <TabItem
                icon="📷"
                label="Scan"
                active={activeTab === 'scan'}
                onPress={() => onTabChange('scan')}
            />
            <TabItem
                icon="👤"
                label="Profile"
                active={activeTab === 'profile'}
                onPress={() => onTabChange('profile')}
            />
        </View>
    )
}

function TabItem({
    icon,
    label,
    active,
    onPress
}: {
    icon: string;
    label: string;
    active: boolean;
    onPress: () => void
}) {
    return (
        <Pressable onPress={onPress} style={styles.tabItem}>
            <Text style={[styles.icon, active ? styles.activeIcon : null] as any}>{icon}</Text>
            <Text
                variant="caption"
                weight={active ? 'bold' : 'medium'}
                color={active ? Colors.ketoSafe : Colors.gray500}
            >
                {label}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: Colors.white,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.gray100,
        ...Shadows.lg,
    },
    tabItem: {
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.xl,
    },
    icon: {
        fontSize: 24,
        opacity: 0.6,
    },
    activeIcon: {
        opacity: 1,
    }
})
