/**
 * Barcode Service
 * Lookup product data from Open Food Facts API
 * Free, open-source database with no authentication required
 */

import { calculateProductScore } from './ketoScoring';
import { ShadowDbService } from './shadowDbService';
import type { Macros, KetoVerdict } from '../types';

const API_BASE = 'https://world.openfoodfacts.org/api/v0/product';

export interface ProductData {
    id?: string; // Shadow DB ID
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
    imageIngredientsUrl?: string;
    imageNutritionUrl?: string;
    source: 'shadow' | 'api' | 'ocr' | 'manual';
    needsOCR?: boolean;
}

const BARCODE_REGEX = /^[0-9]{8,14}$/;

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
 * Lookup a product by barcode with multi-layer fallback
 */
export async function lookupProduct(barcode: string, countryCode: string = 'US'): Promise<ProductData> {
    console.log('[BarcodeService] Multi-layer lookup for:', barcode);

    // 0. Layer 0: Barcode Validation
    if (!BARCODE_REGEX.test(barcode)) {
        console.warn('[BarcodeService] Invalid barcode format:', barcode);
        return {
            found: false,
            barcode,
            name: 'Invalid barcode',
            brand: '',
            macros: { net_carbs: 0, fat: 0, protein: 0, calories: 0 },
            ingredients: [],
            ketoScore: 0,
            ketoVerdict: 'avoid',
            swapSuggestion: 'Please scan a valid product barcode (8-14 digits).',
            source: 'api'
        };
    }

    // 1. Layer 1: Check Shadow DB
    try {
        const cached = await ShadowDbService.lookupByBarcode(barcode, countryCode);
        if (cached && cached.keto_analysis) {
            console.log('[BarcodeService] Found in Shadow DB');
            return {
                id: cached.id,
                found: true,
                barcode: cached.barcode || barcode,
                name: cached.product_name || `Product #${barcode.slice(-4)}`,
                brand: cached.brand || '',
                macros: { net_carbs: 0, fat: 0, protein: 0, calories: 0 }, // Macros might need separate table in future
                ingredients: cached.ingredients_normalized || [],
                ketoScore: cached.keto_analysis.keto_score,
                ketoVerdict: cached.keto_analysis.verdict as KetoVerdict,
                swapSuggestion: generateSwapSuggestion(cached.keto_analysis.keto_score, 0, cached.ingredients_normalized || []),
                source: 'shadow'
            };
        }
    } catch (err) {
        console.error('[BarcodeService] Shadow DB lookup failed:', err);
    }

    // 2. Layer 2: API Lookup (Open Food Facts)
    const apiResult = await lookupProductFromAPI(barcode);

    if (apiResult.found) {
        // Handle "Found but Incomplete" (needs OCR from images)
        if (apiResult.needsOCR && (apiResult.imageIngredientsUrl || apiResult.imageUrl)) {
            console.log('[BarcodeService] Metadata incomplete, triggering OCR from image');
        }

        // Save to Shadow DB for future hits
        try {
            await ShadowDbService.saveProduct({
                barcode: apiResult.barcode,
                country_code: countryCode,
                product_name: apiResult.name === 'Scanned product' ? null : apiResult.name,
                brand: apiResult.brand,
                ingredients_raw: apiResult.ingredients.join(', '),
                ingredients_normalized: apiResult.ingredients,
                source: apiResult.needsOCR ? 'ocr' : 'api',
                confidence_level: apiResult.needsOCR ? 'low' : 'high'
            }, {
                keto_score: apiResult.ketoScore,
                verdict: mapVerdict(apiResult.ketoVerdict),
                offenders: [],
                structural_penalties: [],
                ruleset_version: 'v1'
            });
        } catch (err) {
            console.error('[BarcodeService] Failed to save to Shadow DB:', err);
        }

        return apiResult;
    }

    return apiResult;
}

/**
 * Internal API lookup
 */
async function lookupProductFromAPI(barcode: string): Promise<ProductData> {
    const url = `${API_BASE}/${barcode}.json`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'KetoLens/1.0 (https://ketolens.app)',
            },
        });

        console.log('[BarcodeService] Response status:', response.status);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data: OpenFoodFactsResponse = await response.json();
        console.log('[BarcodeService] API Response:', JSON.stringify(data, null, 2));

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
                source: 'api'
            };
        }

        const product = data.product;
        const completeness = (product as any).completeness || 0;
        const isVeryIncomplete = completeness < 0.5;

        // Extract useful images
        const imageIngredientsUrl = (product as any).image_ingredients_url;
        const imageNutritionUrl = (product as any).image_nutrition_url;
        const imageFrontUrl = (product as any).image_front_url || product.image_url;

        const nutriments = product.nutriments || {};

        // Check if product has meaningful data
        const hasNutritionData = !isVeryIncomplete && Object.keys(nutriments).length > 0 && (
            nutriments['carbohydrates_100g'] !== undefined ||
            nutriments['fat_100g'] !== undefined ||
            nutriments['proteins_100g'] !== undefined
        );

        console.log('[BarcodeService] Completeness:', completeness);
        console.log('[BarcodeService] Has nutrition data:', hasNutritionData);
        console.log('[BarcodeService] Product name:', product.product_name);

        // If product exists but has no nutrition data or is very incomplete, signal OCR fallback
        if (!hasNutritionData || isVeryIncomplete) {
            return {
                found: true,
                barcode,
                name: product.product_name || 'Scanned product',
                brand: product.brands || '',
                macros: { net_carbs: 0, fat: 0, protein: 0, calories: 0 },
                ingredients: [],
                ketoScore: 50, // Neutral score for incomplete data
                ketoVerdict: 'borderline',
                swapSuggestion: 'Analyzing label images for better accuracy...',
                imageUrl: imageFrontUrl,
                imageIngredientsUrl,
                imageNutritionUrl,
                source: 'api',
                needsOCR: true
            };
        }

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

        // Use product name, brand, or barcode as fallback
        let productName = product.product_name;
        if (!productName && product.brands) {
            productName = product.brands;
        }
        if (!productName) {
            productName = `Product #${barcode.slice(-4)}`;
        }

        return {
            found: true,
            barcode,
            name: productName || 'Scanned product',
            brand: product.brands || '',
            macros,
            ingredients,
            ketoScore: adjustedScore,
            ketoVerdict: adjustedScore >= 75 ? 'safe' : adjustedScore >= 50 ? 'borderline' : 'avoid',
            swapSuggestion,
            imageUrl: imageFrontUrl,
            imageIngredientsUrl,
            imageNutritionUrl,
            source: 'api',
            needsOCR: isVeryIncomplete || ingredients.length === 0
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
            source: 'api'
        };
    }
}

function mapVerdict(v: KetoVerdict): 'safe' | 'borderline' | 'avoid' {
    if (v === 'safe') return 'safe';
    if (v === 'avoid') return 'avoid';
    return 'borderline';
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
    const hasSugar = ingredients.some((i: string) =>
        i.includes('sugar') || i.includes('syrup') || i.includes('dextrose') || i.includes('maltodextrin')
    );
    const hasSeedOils = ingredients.some((i: string) =>
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
