/**
 * KetoLens Theme Constants
 * Design tokens for React Native StyleSheet
 */

import type { KetoVerdict } from '../types'

export const Colors = {
    // Keto Status Colors
    ketoSafe: '#10B981',
    ketoSafeDim: 'rgba(16, 185, 129, 0.1)',
    ketoSafeHover: '#059669',

    ketoBorderline: '#FFD700',
    ketoBorderlineDim: 'rgba(255, 215, 0, 0.1)',

    ketoAvoid: '#FF4757',
    ketoAvoidDim: 'rgba(255, 71, 87, 0.1)',

    // Neutrals
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    black: '#000000',

    // Accent
    accentPurple: '#8B5CF6',
    accentBlue: '#3B82F6',

    // Semantic
    primary: '#10B981',
    background: '#FFFFFF',
    card: '#F9FAFB',
    border: '#E5E7EB',
} as const

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
    '6xl': 64,
} as const

export const FontSize = {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
} as const

export const FontWeight = {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
}

export const BorderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
} as const

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 6,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
        elevation: 10,
    },
} as const

export function getVerdictColor(verdict: KetoVerdict): string {
    switch (verdict) {
        case 'safe': return Colors.ketoSafe
        case 'borderline': return Colors.ketoBorderline
        case 'avoid': return Colors.ketoAvoid
        case 'unknown': return Colors.gray500
    }
}
