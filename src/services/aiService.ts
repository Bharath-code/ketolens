/**
 * AI Service
 * Integration with Google Gemini and OpenAI for vision-based keto analysis
 * Implements CalAI-inspired Model Cascading for cost optimization
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';
import type { KetoVerdict, Macros, DetectedFood } from '../types';
import { lookupFood } from './foodDatabase';
import { ProductData } from './barcodeService';
import { preprocessRemoteImage } from '../utils/imageUtils';

// API Keys
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export interface AnalysisResult {
    score: number;
    verdict: KetoVerdict;
    reasoning?: string;
    macros: Macros;
    swapSuggestion: string;
    foods: DetectedFood[]; // Now includes per-food confidence
    plateConfidence: number; // Derived: min confidence of high-carb items
}

const SYSTEM_PROMPT = `
You are "Ketolens", an expert AI Keto Nutritionist and Food Scientist providing **dietary guidance** (not medical advice). You analyze food images (plated meals or packaged grocery products) to help keto beginners make better decisions.

ANALYSIS PROTOCOL:

1. Identify the Image Type:
- Grocery Product:
  - Extract ingredients and nutrition info via OCR when visible.
  - Flag common keto-risk ingredients including sugar aliases (dextrose, maltodextrin, corn syrup), high-glycemic sweeteners (maltitol), and inflammatory seed oils (canola, soybean, sunflower).
  - Highlight preservatives, artificial colors, and common fillers that reduce keto quality.
- Plated Meal:
  - Identify visible food components.
  - Estimate portions conservatively using the smallest reasonable serving unless visual cues suggest otherwise.
  - Detect likely hidden carb sources such as breading, glazes, sauces, or starchy vegetables.
- If the image is not food, set verdict to "unknown" and score to 0.

2. Macro & Keto Estimation:
- Estimate macros using typical food values and visible portions.
- Net Carbs = Total Carbs - Fiber - Erythritol/Stevia/Monk Fruit.
- For maltitol or xylitol, subtract approximately 40–50% depending on context.
- Treat all values as estimates, not exact measurements.

3. Keto Score (0–100):
- 90–100: Excellent keto choice (clean ingredients, very low net carbs).
- 75–89: Keto-friendly with minor considerations.
- 50–74: Borderline or dirty keto (fits macros but contains processed fillers or seed oils).
- 0–49: Not keto-friendly (high carb load or sugar-based ingredients).

4. Suggestions:
- Always provide one practical improvement or swap.
- If already excellent, suggest a serving or pairing tip.
- If poor, suggest a realistic keto alternative.

OUTPUT RULES:
- Return raw JSON only.
- Do not include explanations outside the JSON object.
- Keep reasoning to one concise sentence.

JSON STRUCTURE:
{
  "score": number,
  "verdict": "safe" | "borderline" | "avoid" | "unknown",
  "reasoning": "string",
  "macros": {
    "net_carbs": number,
    "fat": number,
    "protein": number,
    "calories": number
  },
  "swapSuggestion": "string",
  "foods": [
    {
      "name": "string",
      "confidence": number (0-1),
      "estimated_portion": "string",
      "carb_risk": "high" | "medium" | "low",
      "is_keto_offender": boolean
    }
  ]
}
`;


/**
 * Main Analysis Entry Point
 * Implements Model Cascading: Gemini for meals (cheap), GPT-4o for products (precision OCR)
 */
export async function analyzePhoto(
    imageSource: string, // Base64 or URL
    type: 'meal' | 'product' = 'meal',
    isUrl: boolean = false
): Promise<AnalysisResult> {
    let finalImageSource = imageSource;
    let finalIsUrl = isUrl;

    // 1. ADVANCED PREPROCESSING FOR REMOTE IMAGES (OFF)
    if (isUrl) {
        try {
            const processedBase64 = await preprocessRemoteImage(imageSource);
            if (processedBase64) {
                finalImageSource = processedBase64;
                finalIsUrl = false; // Now it's a processed base64
                console.log('[AIService] Remote image preprocessed successfully');
            }
        } catch (err) {
            console.error('[AIService] Remote preprocessing failed, falling back to original URL:', err);
        }
    }

    // 2. SELECT DRIVER (Model Cascading Strategy)
    const useOpenAI = type === 'product' && openai && OPENAI_API_KEY;
    let data: AnalysisResult;

    if (useOpenAI) {
        data = await analyzeWithOpenAI(finalImageSource, type, finalIsUrl);
    } else {
        data = await analyzeWithGemini(finalImageSource, type, finalIsUrl);
    }

    // 2. HYBRID DATABASE VERIFICATION + PLATE CONFIDENCE
    let minCarbConfidence = 1.0;

    if (data.foods && data.foods.length > 0) {
        for (const food of data.foods) {
            // Verify against database
            const verifiedMatch = lookupFood(food.name);
            if (verifiedMatch && verifiedMatch.confidence > 0.9) {
                data.reasoning = `${data.reasoning || ''} (Verified: ${verifiedMatch.name})`;
            }

            // Calculate plate confidence (lowest confidence among carb-risky items)
            if (food.carb_risk === 'high' || food.carb_risk === 'medium') {
                minCarbConfidence = Math.min(minCarbConfidence, food.confidence);
            }
        }
    }

    data.plateConfidence = minCarbConfidence;

    return data;
}


/**
 * Gemini Driver (Default - Fast & Cheap)
 */
async function analyzeWithGemini(imageSource: string, type: 'meal' | 'product', isUrl: boolean = false): Promise<AnalysisResult> {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API Key missing. Add EXPO_PUBLIC_GEMINI_API_KEY to .env');
    }

    let inlineData;
    if (isUrl) {
        // Fetch URL and convert to base64 for Gemini (Gemini doesn't support direct URL in generateContent as easily as OpenAI)
        const response = await fetch(imageSource);
        const buffer = await response.arrayBuffer();
        const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        inlineData = {
            data: base64,
            mimeType: "image/jpeg",
        };
    } else {
        inlineData = {
            data: imageSource,
            mimeType: "image/jpeg",
        };
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.1, // Low temp for consistent analytical output
            topP: 0.95,
        }
    });

    const prompt = type === 'meal'
        ? "Analyze this meal for keto suitability."
        : "Analyze this product label/ingredients for keto suitability.";

    const result = await model.generateContent([
        SYSTEM_PROMPT,
        {
            inlineData: inlineData,
        },
        prompt,
    ]);

    return parseJSONResponse(result.response.text());
}

/**
 * OpenAI Driver (Precision Fallback for OCR)
 */
async function analyzeWithOpenAI(imageSource: string, type: 'meal' | 'product', isUrl: boolean = false): Promise<AnalysisResult> {
    if (!openai) throw new Error('OpenAI client not initialized');

    const imageUrl = isUrl ? imageSource : `data:image/jpeg;base64,${imageSource}`;

    const prompt = type === 'meal'
        ? "Analyze this meal for keto suitability. Be analytical."
        : "Extract ingredients from this product label. Focus on hidden sugars and seed oils.";

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
                role: "user",
                content: [
                    { type: "text", text: prompt },
                    {
                        type: "image_url",
                        image_url: {
                            url: imageUrl,
                        },
                    },
                ],
            },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('OpenAI returned empty response');

    return JSON.parse(content);
}

/**
 * Common JSON parser for AI responses
 */
function parseJSONResponse(responseText: string): AnalysisResult {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Invalid AI response format: No JSON object found');
    }
    return JSON.parse(jsonMatch[0]);
}
