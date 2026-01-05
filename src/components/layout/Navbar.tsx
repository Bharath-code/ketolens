/**
 * Navbar Component
 * Higher-level navigation header
 */

import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text } from '../atoms/Text'
import { Colors, Spacing, FontSize } from '../../constants/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface NavbarProps {
    title: string
    showBack?: boolean
    onBack?: () => void
    rightElement?: React.ReactNode
}

export function Navbar({
    title,
    showBack = false,
    onBack,
    rightElement
}: NavbarProps) {
    const insets = useSafeAreaInsets()

    return (
        <View style={[styles.navbar, { paddingTop: insets.top + Spacing.md }]}>
            <View style={styles.left}>
                {showBack && (
                    <Pressable onPress={onBack} style={styles.backButton}>
                        <Text variant="body" size="2xl">←</Text>
                    </Pressable>
                )}
            </View>

            <View style={styles.center}>
                <Text variant="heading" size="lg" weight="bold">{title}</Text>
            </View>

            <View style={styles.right}>
                {rightElement || <View style={styles.placeholder} />}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    left: {
        width: 60,
        flexDirection: 'row',
    },
    center: {
        flex: 1,
        alignItems: 'center',
    },
    right: {
        width: 60,
        alignItems: 'flex-end',
    },
    backButton: {
        padding: Spacing.xs,
    },
    placeholder: {
        width: 24,
    }
})
