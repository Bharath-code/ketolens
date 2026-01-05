/**
 * Screen Component
 * Base layout wrapper with safe area and optional scroll
 */

import React from 'react'
import {
    View,
    StyleSheet,
    ScrollView,
    ViewStyle,
    StatusBar,
    Platform
} from 'react-native'
import { Colors } from '../../constants/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ScreenProps {
    children: React.ReactNode
    header?: React.ReactNode
    footer?: React.ReactNode
    backgroundColor?: string
    scrollable?: boolean
    padding?: boolean
}

export function Screen({
    children,
    header,
    footer,
    backgroundColor = Colors.white,
    scrollable = true,
    padding = true,
}: ScreenProps) {
    const insets = useSafeAreaInsets()

    const containerStyle: ViewStyle = {
        flex: 1,
        backgroundColor,
        paddingTop: header ? 0 : insets.top,
        paddingBottom: footer ? 0 : insets.bottom,
    }

    const content = (
        <View style={[styles.content, padding && styles.padding]}>
            {children}
        </View>
    )

    return (
        <View style={containerStyle}>
            <StatusBar barStyle="dark-content" />
            {header}
            {scrollable ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {content}
                </ScrollView>
            ) : (
                content
            )}
            {footer}
        </View>
    )
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
    },
    padding: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
})
