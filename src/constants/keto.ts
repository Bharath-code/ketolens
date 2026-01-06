/**
 * Keto Scoring Constants
 * Based on MVP PRD ingredient blacklist and scoring rules
 */

import type { KetoVerdict } from '../types'

// ===== Score Thresholds =====
export const SCORE_THRESHOLDS = {
    SAFE: 80,      // 80-100 = Keto-safe (green)
    BORDERLINE: 60 // 60-79 = Borderline (yellow), <60 = Avoid (red)
} as const

// ===== Free Tier Limits =====
export const FREE_TIER = {
    MAX_SCANS: 5,
    MAX_HISTORY_DAYS: 7
} as const

// ===== Default User Settings =====
export const DEFAULT_CARB_LIMIT = 20 // grams per day

// ===== Ingredient Blacklist with Penalties =====
export const INGREDIENT_PENALTIES: Record<string, { penalty: number; reason: string }> = {
    // Sugars (severe penalties)
    'sugar': { penalty: 25, reason: 'Pure sugar' },
    'cane sugar': { penalty: 25, reason: 'Pure sugar' },
    'brown sugar': { penalty: 25, reason: 'Pure sugar' },
    'high fructose corn syrup': { penalty: 30, reason: 'Highly processed sugar' },
    'corn syrup': { penalty: 25, reason: 'Processed sugar' },
    'agave nectar': { penalty: 20, reason: 'High fructose content' },
    'honey': { penalty: 15, reason: 'Natural but high carb' },
    'maple syrup': { penalty: 15, reason: 'Natural but high carb' },
    'molasses': { penalty: 20, reason: 'High sugar content' },
    'dextrose': { penalty: 20, reason: 'Sugar form' },
    'fructose': { penalty: 20, reason: 'Sugar form' },
    'glucose': { penalty: 20, reason: 'Sugar form' },
    'sucrose': { penalty: 25, reason: 'Table sugar' },
    'maltodextrin': { penalty: 25, reason: 'Higher glycemic than sugar' },

    // Starches
    'cornstarch': { penalty: 15, reason: 'Pure starch' },
    'modified food starch': { penalty: 15, reason: 'Starch filler' },
    'potato starch': { penalty: 15, reason: 'High starch' },
    'tapioca starch': { penalty: 15, reason: 'High starch' },

    // Wheat/Grains
    'wheat': { penalty: 15, reason: 'Grain-based carbs' },
    'wheat flour': { penalty: 18, reason: 'Refined grain' },
    'enriched wheat flour': { penalty: 18, reason: 'Refined grain' },
    'bread crumbs': { penalty: 15, reason: 'Wheat-based' },
    'rice flour': { penalty: 15, reason: 'High carb flour' },
    'corn flour': { penalty: 15, reason: 'High carb flour' },
    'oat flour': { penalty: 12, reason: 'Grain flour' },

    // Questionable additives
    'natural flavors': { penalty: 5, reason: 'Potentially contains hidden carbs' },
    'artificial flavors': { penalty: 3, reason: 'Minor concern' },
    'carrageenan': { penalty: 3, reason: 'Controversial additive' },

    // Red flag indicators
    'fruit juice concentrate': { penalty: 15, reason: 'Concentrated sugar' },
    'evaporated cane juice': { penalty: 20, reason: 'Sugar in disguise' },
    'rice syrup': { penalty: 20, reason: 'High glycemic' },
    'barley malt': { penalty: 15, reason: 'Malt sugar' }
} as const

// ===== Ingredient Count Penalty =====
export const INGREDIENT_COUNT_PENALTY = {
    THRESHOLD: 10,
    PENALTY: 10
} as const

// ===== High-Risk Foods =====
export const HIGH_RISK_FOODS = [
    'rice', 'bread', 'pasta', 'noodles', 'potato', 'french fries',
    'chips', 'crackers', 'cereal', 'pizza', 'tortilla', 'corn',
    'beans', 'soda', 'juice', 'candy', 'cake', 'cookies',
    'ice cream', 'donut', 'bagel', 'muffin'
] as const

// ===== Keto-Friendly Foods =====
export const KETO_FRIENDLY_FOODS = [
    'avocado', 'eggs', 'cheese', 'butter', 'bacon', 'salmon',
    'chicken', 'beef', 'pork', 'olive oil', 'coconut oil',
    'almonds', 'walnuts', 'spinach', 'broccoli', 'cauliflower',
    'zucchini', 'asparagus', 'mushrooms', 'lettuce'
] as const

// ===== Helper Functions =====
export function getVerdict(score: number): KetoVerdict {
    if (score >= SCORE_THRESHOLDS.SAFE) return 'safe'
    if (score >= SCORE_THRESHOLDS.BORDERLINE) return 'borderline'
    return 'avoid'
}

export function getVerdictLabel(verdict: KetoVerdict): string {
    switch (verdict) {
        case 'safe': return 'KETO-SAFE'
        case 'borderline': return 'BORDERLINE'
        case 'avoid': return 'AVOID'
        case 'unknown': return 'UNKNOWN'
    }
}

export function getVerdictEmoji(verdict: KetoVerdict): string {
    switch (verdict) {
        case 'safe': return '✓'
        case 'borderline': return '⚠'
        case 'avoid': return '✕'
        case 'unknown': return '?'
    }
}
