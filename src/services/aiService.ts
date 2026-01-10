/**
 * AI Service
 * Integration with Supabase Edge Function for secure AI analysis
 * API keys are now stored server-side in the Edge Function
 */

import { supabase } from './supabase';
import type { KetoVerdict, Macros, DetectedFood } from '../types';
import { lookupFood } from './foodDatabase';
import { preprocessRemoteImage } from '../utils/imageUtils';
import { withRetry } from '../utils/retry';

export interface AnalysisResult {
    score: number;
    verdict: KetoVerdict;
    reasoning?: string;
    macros: Macros;
    swapSuggestion: string;
    foods: DetectedFood[];
    plateConfidence: number;
}

/**
 * Main Analysis Entry Point
 * Calls Edge Function which handles AI with server-side API keys
 */
export async function analyzePhoto(
    imageSource: string,
    type: 'meal' | 'product' = 'meal',
    isUrl: boolean = false
): Promise<AnalysisResult> {
    let finalImageSource = imageSource;
    let finalIsUrl = isUrl;

    // Preprocess remote images
    if (isUrl) {
        try {
            const processedBase64 = await preprocessRemoteImage(imageSource);
            if (processedBase64) {
                finalImageSource = processedBase64;
                finalIsUrl = false;
                console.log('[AIService] Remote image preprocessed successfully');
            }
        } catch (err) {
            console.error('[AIService] Preprocessing failed, using original URL:', err);
        }
    }

    // Call Edge Function with retry
    const result = await withRetry(
        async () => {
            const { data, error } = await supabase.functions.invoke('analyze-food', {
                body: {
                    image: finalImageSource,
                    type,
                    isUrl: finalIsUrl,
                },
            });

            if (error) {
                throw new Error(error.message || 'Analysis failed');
            }

            if (data.error) {
                throw new Error(data.error);
            }

            return data as AnalysisResult;
        },
        {
            maxRetries: 3,
            delayMs: 1000,
            onRetry: (attempt, error) => {
                console.log(`[AIService] Retry attempt ${attempt}: ${error.message}`);
            },
        }
    );

    // Hybrid database verification
    if (result.foods && result.foods.length > 0) {
        for (const food of result.foods) {
            const verifiedMatch = lookupFood(food.name);
            if (verifiedMatch && verifiedMatch.confidence > 0.9) {
                result.reasoning = `${result.reasoning || ''} (Verified: ${verifiedMatch.name})`;
            }
        }
    }

    return result;
}
