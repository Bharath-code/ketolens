/**
 * analyze-food Edge Function
 * Securely proxies AI requests with server-side API keys
 * 
 * Deploy: supabase functions deploy analyze-food
 * Set secrets: 
 *   supabase secrets set GEMINI_API_KEY=your_key
 *   supabase secrets set OPENAI_API_KEY=your_key
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai'
import OpenAI from 'npm:openai'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { image, type = 'meal', isUrl = false } = await req.json()

        if (!image) {
            throw new Error('Missing image parameter')
        }

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

        // Model cascading: Gemini for meals, OpenAI for products (better OCR)
        const useOpenAI = type === 'product' && OPENAI_API_KEY

        let result

        if (useOpenAI) {
            // OpenAI for product labels
            const openai = new OpenAI({ apiKey: OPENAI_API_KEY })
            const imageUrl = isUrl ? image : `data:image/jpeg;base64,${image}`

            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Analyze this product label for keto suitability.' },
                            { type: 'image_url', image_url: { url: imageUrl } },
                        ],
                    },
                ],
                temperature: 0.1,
                response_format: { type: 'json_object' },
            })

            result = JSON.parse(response.choices[0].message.content || '{}')
        } else {
            // Gemini for meals (faster, cheaper)
            if (!GEMINI_API_KEY) {
                throw new Error('GEMINI_API_KEY not configured')
            }

            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: { temperature: 0.1 },
            })

            let inlineData
            if (isUrl) {
                const response = await fetch(image)
                const buffer = await response.arrayBuffer()
                const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
                inlineData = { data: base64, mimeType: 'image/jpeg' }
            } else {
                inlineData = { data: image, mimeType: 'image/jpeg' }
            }

            const genResult = await model.generateContent([
                SYSTEM_PROMPT,
                { inlineData },
                'Analyze this meal for keto suitability.',
            ])

            const text = genResult.response.text()
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            result = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
        }

        // Add plate confidence
        result.plateConfidence = 1.0
        if (result.foods?.length > 0) {
            const carbRiskyFoods = result.foods.filter(
                (f: any) => f.carb_risk === 'high' || f.carb_risk === 'medium'
            )
            if (carbRiskyFoods.length > 0) {
                result.plateConfidence = Math.min(...carbRiskyFoods.map((f: any) => f.confidence || 1))
            }
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error) {
        console.error('[analyze-food] Error:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Analysis failed' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
