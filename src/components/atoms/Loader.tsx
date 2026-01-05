/**
 * Loader Component
 * Central activity indicator
 */

import React from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { Text } from './Text'
import { Colors, Spacing } from '../../constants/theme'

interface LoaderProps {
    message?: string
    fullScreen?: boolean
}

export function Loader({ message, fullScreen = false }: LoaderProps) {
    const container = fullScreen ? styles.fullScreen : styles.inline

    return (
        <View style={container}>
            <ActivityIndicator size="large" color={Colors.ketoSafe} />
            {message && (
                <Text variant="body" size="sm" color={Colors.gray500} style={styles.message}>
                    {message}
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
    },
    inline: {
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    message: {
        marginTop: Spacing.md,
    }
})
