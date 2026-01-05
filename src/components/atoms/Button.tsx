/**
 * Button Component
 * Primary interactive element with variants, sizes, and loading state
 */

import React, { useCallback, useState } from 'react'
import {
    Pressable,
    Text,
    StyleSheet,
    ActivityIndicator,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native'
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../constants/theme'
import type { ButtonVariant, ButtonSize } from '../../types'

interface ButtonProps {
    variant?: ButtonVariant
    size?: ButtonSize
    children: React.ReactNode
    disabled?: boolean
    loading?: boolean
    onPress?: () => void
    fullWidth?: boolean
    containerStyle?: StyleProp<ViewStyle>
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    disabled = false,
    loading = false,
    onPress,
    fullWidth = false,
    containerStyle,
}: ButtonProps) {
    const [isPressed, setIsPressed] = useState(false)

    const handlePressIn = useCallback(() => {
        if (!disabled && !loading) setIsPressed(true)
    }, [disabled, loading])

    const handlePressOut = useCallback(() => {
        setIsPressed(false)
    }, [])

    const getButtonStyle = (): StyleProp<ViewStyle> => {
        const variantStyles = {
            primary: styles.variant_primary,
            secondary: styles.variant_secondary,
            ghost: styles.variant_ghost,
            danger: styles.variant_danger,
        }
        const sizeStyles = {
            sm: styles.size_sm,
            md: styles.size_md,
            lg: styles.size_lg,
            xl: styles.size_xl,
        }
        return [
            styles.button,
            variantStyles[variant],
            sizeStyles[size],
            isPressed && styles.pressed,
            disabled && styles.disabled,
            fullWidth && styles.fullWidth,
            containerStyle,
        ]
    }

    const getTextStyle = (): StyleProp<TextStyle> => {
        const sizeStyles = {
            sm: styles.text_sm,
            md: styles.text_md,
            lg: styles.text_lg,
            xl: styles.text_xl,
        }
        const colorStyles = {
            primary: styles.textColor_primary,
            secondary: styles.textColor_secondary,
            ghost: styles.textColor_ghost,
            danger: styles.textColor_danger,
        }
        return [styles.text, sizeStyles[size], colorStyles[variant]]
    }

    return (
        <Pressable
            style={getButtonStyle()}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={variant === 'primary' || variant === 'danger' ? Colors.white : Colors.gray700}
                />
            ) : (
                <Text style={getTextStyle()}>{children}</Text>
            )}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
    },

    // Variants
    variant_primary: {
        backgroundColor: Colors.ketoSafe,
        ...Shadows.md,
    },
    variant_secondary: {
        backgroundColor: Colors.gray100,
    },
    variant_ghost: {
        backgroundColor: 'transparent',
    },
    variant_danger: {
        backgroundColor: Colors.ketoAvoid,
        ...Shadows.md,
    },

    // Sizes
    size_sm: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        minHeight: 36,
    },
    size_md: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing['2xl'],
        minHeight: 44,
    },
    size_lg: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing['3xl'],
        minHeight: 52,
    },
    size_xl: {
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing['4xl'],
        minHeight: 60,
    },

    // Text Sizes
    text_sm: { fontSize: FontSize.sm },
    text_md: { fontSize: FontSize.base },
    text_lg: { fontSize: FontSize.lg },
    text_xl: { fontSize: FontSize.xl },

    // Text Colors
    textColor_primary: { color: Colors.white },
    textColor_secondary: { color: Colors.gray900 },
    textColor_ghost: { color: Colors.gray700 },
    textColor_danger: { color: Colors.white },

    text: {
        fontWeight: '600',
    },

    pressed: {
        transform: [{ scale: 0.96 }],
        opacity: 0.9,
    },

    disabled: {
        opacity: 0.5,
    },

    fullWidth: {
        width: '100%',
    },
})
