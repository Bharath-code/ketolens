/**
 * Text Component
 * Typography component with semantic variants
 */

import React from 'react'
import { Text as RNText, StyleSheet, TextStyle } from 'react-native'
import { Colors, FontSize, FontWeight } from '../../constants/theme'

type TextVariant = 'display' | 'heading' | 'body' | 'caption'
type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
type TextWeightType = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold'

interface TextProps {
    variant?: TextVariant
    size?: TextSize
    weight?: TextWeightType
    color?: string
    align?: 'left' | 'center' | 'right'
    children: React.ReactNode
    style?: TextStyle
}

export function Text({
    variant = 'body',
    size,
    weight,
    color,
    align,
    children,
    style,
}: TextProps) {
    const textStyles: TextStyle[] = [
        styles[variant],
        size && styles[`size_${size}`],
        weight && styles[`weight_${weight}`],
        align && { textAlign: align },
        color && { color },
        style,
    ].filter(Boolean) as TextStyle[]

    return <RNText style={textStyles}>{children}</RNText>
}

const styles = StyleSheet.create({
    display: {
        fontSize: FontSize['4xl'],
        fontWeight: FontWeight.extrabold,
        color: Colors.gray900,
        lineHeight: FontSize['4xl'] * 1.2,
    },
    heading: {
        fontSize: FontSize['2xl'],
        fontWeight: FontWeight.bold,
        color: Colors.gray900,
        lineHeight: FontSize['2xl'] * 1.3,
    },
    body: {
        fontSize: FontSize.base,
        fontWeight: FontWeight.regular,
        color: Colors.gray700,
        lineHeight: FontSize.base * 1.5,
    },
    caption: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.regular,
        color: Colors.gray500,
        lineHeight: FontSize.sm * 1.5,
    },

    // Size overrides
    size_xs: { fontSize: FontSize.xs },
    size_sm: { fontSize: FontSize.sm },
    size_base: { fontSize: FontSize.base },
    size_lg: { fontSize: FontSize.lg },
    size_xl: { fontSize: FontSize.xl },
    'size_2xl': { fontSize: FontSize['2xl'] },
    'size_3xl': { fontSize: FontSize['3xl'] },
    'size_4xl': { fontSize: FontSize['4xl'] },
    'size_5xl': { fontSize: FontSize['5xl'] },

    // Weight overrides
    weight_regular: { fontWeight: FontWeight.regular },
    weight_medium: { fontWeight: FontWeight.medium },
    weight_semibold: { fontWeight: FontWeight.semibold },
    weight_bold: { fontWeight: FontWeight.bold },
    weight_extrabold: { fontWeight: FontWeight.extrabold },
})
