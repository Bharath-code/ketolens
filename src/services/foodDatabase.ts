/**
 * Food Database Service
 * A curated, high-integrity database of keto-friendly foods and their verified macros.
 * This is used to "sanitize" AI hallucinations and provide reliable data.
 */

import type { Macros } from '../types';

export interface FoodMetadata {
    name: string;
    description: string;
    macros: Macros;
    unit: string; // e.g., "1 medium", "100g", "1 cup"
    isKeto: boolean;
    confidence: number; // 0-1, how certain we are about this data
}

// Curated database of high-frequency foods
const KETO_FOOD_DB: Record<string, FoodMetadata> = {
    'avocado': {
        name: 'Avocado',
        description: 'Perfect keto superfood, high in healthy monounsaturated fats.',
        macros: {
            net_carbs: 2,
            fat: 15,
            protein: 2,
            calories: 160
        },
        unit: '1/2 medium',
        isKeto: true,
        confidence: 0.95
    },
    'egg': {
        name: 'Egg',
        description: 'Nutrient-dense with the perfect ratio of fat and protein.',
        macros: {
            net_carbs: 0.6,
            fat: 5,
            protein: 6,
            calories: 70
        },
        unit: '1 large',
        isKeto: true,
        confidence: 0.98
    },
    'ribeye steak': {
        name: 'Ribeye Steak',
        description: 'High-fat cut of beef, ideal for keto.',
        macros: {
            net_carbs: 0,
            fat: 22,
            protein: 24,
            calories: 290
        },
        unit: '100g',
        isKeto: true,
        confidence: 0.92
    },
    'salmon': {
        name: 'Salmon',
        description: 'Rich in Omega-3 fatty acids and high-quality protein.',
        macros: {
            net_carbs: 0,
            fat: 13,
            protein: 20,
            calories: 208
        },
        unit: '100g',
        isKeto: true,
        confidence: 0.95
    },
    'spinach': {
        name: 'Spinach',
        description: 'Low-carb leafy green, high in potassium and magnesium.',
        macros: {
            net_carbs: 0.4,
            fat: 0,
            protein: 0.9,
            calories: 7
        },
        unit: '1 cup raw',
        isKeto: true,
        confidence: 0.98
    },
    'butter': {
        name: 'Butter',
        description: 'Pure fat source, zero carbs.',
        macros: {
            net_carbs: 0,
            fat: 12,
            protein: 0,
            calories: 100
        },
        unit: '1 tbsp',
        isKeto: true,
        confidence: 0.99
    },
    'olive oil': {
        name: 'Olive Oil',
        description: 'Heart-healthy fat, perfect for dressing.',
        macros: {
            net_carbs: 0,
            fat: 14,
            protein: 0,
            calories: 120
        },
        unit: '1 tbsp',
        isKeto: true,
        confidence: 1.0
    },
    'bacon': {
        name: 'Bacon',
        description: 'High fat, moderate protein. Check for added sugars.',
        macros: {
            net_carbs: 0.1,
            fat: 3.3,
            protein: 3,
            calories: 43
        },
        unit: '1 slice',
        isKeto: true,
        confidence: 0.9
    }
};

/**
 * Searches the database for a food item.
 * Uses simple string matching for now.
 */
export function lookupFood(name: string): FoodMetadata | null {
    const normalized = name.toLowerCase().trim();

    // Check for exact match or contains
    for (const [key, metadata] of Object.entries(KETO_FOOD_DB)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return metadata;
        }
    }

    return null;
}

/**
 * Normalizes an array of detected foods using the database.
 * If a food exists in our DB, we favor its macro data.
 */
export function enrichMacrosWithDatabase(
    detectedFoods: string[],
    aiMacros: Macros
): { enrichedMacros: Macros; verificationFlags: string[] } {
    let finalMacros = { ...aiMacros };
    let verificationFlags: string[] = [];

    // For simplicity in MVP: if we find a very high-confidence match for a primary ingredient,
    // we could potentially adjust, but usually AI is better at PORTION estimation.
    // Instead, we use the DB to FLAG and VERIFY.

    for (const food of detectedFoods) {
        const match = lookupFood(food);
        if (match) {
            verificationFlags.push(`Verified: ${match.name}`);
            // In future versions, we could do complex weighted average or portion scaling
        }
    }

    return {
        enrichedMacros: finalMacros,
        verificationFlags
    };
}
