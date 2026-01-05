/**
 * Barcode Service
 * Lookup product data from Open Food Facts API
 * Free, open-source database with no authentication required
 */

import { calculateProductScore } from './ketoScoring';
import type { Macros, KetoVerdict } from '../types';

const API_BASE = 'https://world.openfoodfacts.org/api/v0/product';

export interface ProductData {
    found: boolean;
    barcode: string;
    name: string;
    brand: string;
    macros: Macros;
    ingredients: string[];
    ketoScore: number;
    ketoVerdict: KetoVerdict;
    swapSuggestion: string;
    imageUrl?: string;
}

interface OpenFoodFactsNutriments {
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
    'proteins_100g'?: number;
    'energy-kcal_100g'?: number;
    'fiber_100g'?: number;
    'sugars_100g'?: number;
}

interface OpenFoodFactsProduct {
    product_name?: string;
    brands?: string;
    nutriments?: OpenFoodFactsNutriments;
    ingredients_text?: string;
    image_url?: string;
}

interface OpenFoodFactsResponse {
    status: number;
    product?: OpenFoodFactsProduct;
}

/**
 * Lookup a product by barcode
 */
export async function lookupProduct(barcode: string): Promise<ProductData> {
    try {
        const response = await fetch(`${API_BASE}/${barcode}.json`, {
            headers: {
                'User-Agent': 'KetoLens/1.0 (https://ketolens.app)',
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data: OpenFoodFactsResponse = await response.json();

        if (data.status !== 1 || !data.product) {
            return {
                found: false,
                barcode,
                name: 'Product not found',
                brand: '',
                macros: { net_carbs: 0, fat: 0, protein: 0, calories: 0 },
                ingredients: [],
                ketoScore: 0,
                ketoVerdict: 'avoid',
                swapSuggestion: 'We couldn\'t find this product in our database. Try a different item or scan a meal instead.',
            };
        }

        const product = data.product;
        const nutriments = product.nutriments || {};

        // Calculate net carbs (carbs - fiber)
        const totalCarbs = nutriments['carbohydrates_100g'] || 0;
        const fiber = nutriments['fiber_100g'] || 0;
        const netCarbs = Math.max(0, totalCarbs - fiber);

        const macros: Macros = {
            net_carbs: Math.round(netCarbs * 10) / 10,
            fat: Math.round((nutriments['fat_100g'] || 0) * 10) / 10,
            protein: Math.round((nutriments['proteins_100g'] || 0) * 10) / 10,
            calories: Math.round(nutriments['energy-kcal_100g'] || 0),
            fiber: Math.round(fiber * 10) / 10,
        };

        // Parse ingredients
        const ingredientsText = product.ingredients_text || '';
        const ingredients = ingredientsText
            .split(/[,;]/)
            .map(i => i.trim().toLowerCase())
            .filter(i => i.length > 0);

        // Calculate keto score
        const ketoResult = calculateProductScore(ingredients);

        // Adjust score based on net carbs (per 100g)
        let adjustedScore = ketoResult.score;
        if (netCarbs > 20) {
            adjustedScore = Math.max(0, adjustedScore - 30);
        } else if (netCarbs > 10) {
            adjustedScore = Math.max(0, adjustedScore - 15);
        } else if (netCarbs > 5) {
            adjustedScore = Math.max(0, adjustedScore - 5);
        }

        // Generate swap suggestion
        const swapSuggestion = generateSwapSuggestion(adjustedScore, netCarbs, ingredients);

        return {
            found: true,
            barcode,
            name: product.product_name || 'Unknown Product',
            brand: product.brands || '',
            macros,
            ingredients,
            ketoScore: adjustedScore,
            ketoVerdict: adjustedScore >= 75 ? 'safe' : adjustedScore >= 50 ? 'borderline' : 'avoid',
            swapSuggestion,
            imageUrl: product.image_url,
        };

    } catch (error) {
        console.error('Barcode lookup error:', error);
        return {
            found: false,
            barcode,
            name: 'Lookup failed',
            brand: '',
            macros: { net_carbs: 0, fat: 0, protein: 0, calories: 0 },
            ingredients: [],
            ketoScore: 0,
            ketoVerdict: 'avoid',
            swapSuggestion: 'Unable to fetch product data. Please check your connection and try again.',
        };
    }
}

/**
 * Generate keto-friendly swap suggestion based on analysis
 */
function generateSwapSuggestion(score: number, netCarbs: number, ingredients: string[]): string {
    if (score >= 85) {
        return 'Excellent keto choice! This product fits well within your daily carb limit.';
    }

    if (score >= 75) {
        return 'Good pick! Watch your portion size to stay within your carb budget.';
    }

    // Check for common offenders
    const hasSugar = ingredients.some(i =>
        i.includes('sugar') || i.includes('syrup') || i.includes('dextrose') || i.includes('maltodextrin')
    );
    const hasSeedOils = ingredients.some(i =>
        i.includes('canola') || i.includes('soybean oil') || i.includes('sunflower oil') || i.includes('vegetable oil')
    );

    if (hasSugar && netCarbs > 10) {
        return 'High sugar content. Look for a sugar-free or stevia-sweetened alternative.';
    }

    if (hasSeedOils) {
        return 'Contains inflammatory seed oils. Try a version made with olive oil or avocado oil.';
    }

    if (netCarbs > 15) {
        return `${netCarbs}g net carbs per 100g is too high. Look for a lower-carb alternative.`;
    }

    return 'Consider a cleaner keto option with fewer processed ingredients.';
}
