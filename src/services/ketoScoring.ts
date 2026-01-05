/**
 * Keto Scoring Service
 * Calculate keto scores for meals and products
 */

import {
    INGREDIENT_PENALTIES,
    INGREDIENT_COUNT_PENALTY,
    HIGH_RISK_FOODS,
    getVerdict
} from '../constants/keto'
import type { Macros, KetoScore, ParsedIngredient } from '../types'

/**
 * Calculate keto score for a meal based on macros
 */
export function calculateMealScore(
    macros: Macros,
    carbLimit: number = 20
): KetoScore {
    let score = 100

    // Penalty based on net carbs vs limit
    const carbRatio = macros.net_carbs / carbLimit
    if (carbRatio > 1) {
        // Over limit - heavy penalty
        score -= Math.min(50, (carbRatio - 1) * 50)
    } else if (carbRatio > 0.5) {
        // More than half limit - moderate penalty
        score -= (carbRatio - 0.5) * 30
    }

    // Calculate macro percentages
    const totalMacros = macros.fat + macros.protein + macros.net_carbs
    if (totalMacros > 0) {
        const fatPercent = (macros.fat / totalMacros) * 100
        const carbPercent = (macros.net_carbs / totalMacros) * 100

        // Ideal keto: 70-80% fat, <10% carbs
        if (fatPercent < 60) {
            score -= (60 - fatPercent) * 0.5
        }
        if (carbPercent > 10) {
            score -= (carbPercent - 10) * 2
        }
    }

    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)))

    return {
        score,
        verdict: getVerdict(score),
        confidence: 'medium',
    }
}

/**
 * Calculate keto score for a product based on ingredients
 */
export function calculateProductScore(ingredients: string[]): KetoScore {
    let score = 100
    const parsedIngredients: ParsedIngredient[] = []

    // Normalize ingredients
    const normalizedIngredients = ingredients.map(i => i.toLowerCase().trim())

    // Check each ingredient against blacklist
    for (const ingredient of normalizedIngredients) {
        let foundPenalty = false

        for (const [badIngredient, { penalty, reason }] of Object.entries(INGREDIENT_PENALTIES)) {
            if (ingredient.includes(badIngredient)) {
                score -= penalty
                parsedIngredients.push({
                    name: ingredient,
                    is_offender: true,
                    penalty_score: penalty,
                    reason,
                })
                foundPenalty = true
                break
            }
        }

        if (!foundPenalty) {
            parsedIngredients.push({
                name: ingredient,
                is_offender: false,
                penalty_score: 0,
            })
        }
    }

    // Penalty for too many ingredients
    if (ingredients.length > INGREDIENT_COUNT_PENALTY.THRESHOLD) {
        score -= INGREDIENT_COUNT_PENALTY.PENALTY
    }

    // Clamp score
    score = Math.max(0, Math.min(100, Math.round(score)))

    return {
        score,
        verdict: getVerdict(score),
        confidence: 'high',
    }
}

/**
 * Check if a food item is high-risk for keto
 */
export function isHighRiskFood(foodName: string): boolean {
    const normalized = foodName.toLowerCase()
    return HIGH_RISK_FOODS.some(food => normalized.includes(food))
}

/**
 * Get swap suggestion based on detected foods
 */
export function getSwapSuggestion(foods: string[], verdict: string): string {
    if (verdict === 'safe') {
        return 'Great choice! This meal fits well within your keto goals.'
    }

    // Find high-risk foods
    const riskyFoods = foods.filter(isHighRiskFood)

    if (riskyFoods.length === 0) {
        return 'Consider reducing portion size to lower carb intake.'
    }

    // Provide specific swaps
    const swaps: Record<string, string> = {
        'rice': 'cauliflower rice',
        'bread': 'lettuce wrap or cloud bread',
        'pasta': 'zucchini noodles or shirataki',
        'potato': 'mashed cauliflower',
        'french fries': 'crispy zucchini fries',
    }

    for (const food of riskyFoods) {
        for (const [risky, swap] of Object.entries(swaps)) {
            if (food.toLowerCase().includes(risky)) {
                return `Try swapping ${risky} for ${swap} to make this keto-friendly!`
            }
        }
    }

    return 'Try reducing carb-heavy items and add more healthy fats like avocado or olive oil.'
}
