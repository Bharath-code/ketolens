import { supabase } from './supabase';
import type { ProductData } from './barcodeService';
import type { KetoScore, ParsedIngredient } from '../types';

export interface ShadowProduct {
    id: string;
    barcode: string | null;
    country_code: string;
    product_name: string | null;
    brand: string | null;
    ingredients_raw: string;
    ingredients_normalized: string[];
    source: 'nutritionix' | 'off_image' | 'user_ocr' | 'manual' | 'api' | 'ocr';
    confidence_level: 'high' | 'medium' | 'low';
    last_seen_at: string;
    keto_analysis?: ShadowKetoAnalysis;
}

export interface ShadowKetoAnalysis {
    id: string;
    product_id: string;
    keto_score: number;
    verdict: 'safe' | 'borderline' | 'avoid';
    offenders: any[];
    structural_penalties: any[];
    ruleset_version: string;
}

export const ShadowDbService = {
    /**
     * Lookup a product in the shadow database by barcode and country
     */
    async lookupByBarcode(barcode: string, countryCode: string = 'US'): Promise<ShadowProduct | null> {
        const { data, error } = await supabase
            .from('products_shadow')
            .select('*, keto_analysis(*)')
            .eq('barcode', barcode)
            .eq('country_code', countryCode)
            .single();

        if (error || !data) {
            if (error && error.code !== 'PGRST116') {
                console.error('[ShadowDbService] Lookup error:', error);
            }
            return null;
        }

        // Update last_seen_at and scan_count asynchronously
        supabase
            .from('products_shadow')
            .update({
                last_seen_at: new Date().toISOString(),
                scan_count: (data.scan_count || 0) + 1
            })
            .eq('id', data.id)
            .then(({ error }) => {
                if (error) console.error('[ShadowDbService] Update stat error:', error);
            });

        return data as ShadowProduct;
    },

    /**
     * Save a product to the shadow database
     */
    async saveProduct(
        product: Omit<ShadowProduct, 'id' | 'last_seen_at' | 'keto_analysis'>,
        analysis: Omit<ShadowKetoAnalysis, 'id' | 'product_id'>
    ): Promise<ShadowProduct | null> {
        // 1. Insert product
        const { data: productData, error: productError } = await supabase
            .from('products_shadow')
            .insert([product])
            .select()
            .single();

        if (productError || !productData) {
            console.error('[ShadowDbService] Save product error:', productError);
            return null;
        }

        // 2. Insert analysis
        const { data: analysisData, error: analysisError } = await supabase
            .from('keto_analysis')
            .insert([{
                ...analysis,
                product_id: productData.id
            }])
            .select()
            .single();

        if (analysisError) {
            console.error('[ShadowDbService] Save analysis error:', analysisError);
        }

        return {
            ...productData,
            keto_analysis: analysisData
        } as ShadowProduct;
    },

    /**
     * Log a scan event
     */
    async logScan(event: {
        product_id: string;
        user_id?: string;
        scan_type: 'barcode' | 'ocr' | 'meal';
        model_confidence?: number;
        ocr_confidence?: number;
        country_code?: string;
        device_type?: string;
    }) {
        const { error } = await supabase
            .from('scan_events')
            .insert([event]);

        if (error) {
            console.error('[ShadowDbService] Log scan error:', error);
        }
    },

    /**
     * Submit a correction
     */
    async submitCorrection(correction: {
        product_id: string;
        scan_event_id: string;
        action: 'confirmed' | 'removed' | 'replaced';
        original_label: string;
        corrected_label?: string;
    }) {
        const { error } = await supabase
            .from('corrections')
            .insert([correction]);

        if (error) {
            console.error('[ShadowDbService] Submit correction error:', error);
        }
    },

    /**
     * Fetch known offenders from dictionary
     */
    async getIngredientDictionary() {
        const { data, error } = await supabase
            .from('ingredient_dictionary')
            .select('*');

        if (error) {
            console.error('[ShadowDbService] Dictionary fetch error:', error);
            return [];
        }

        return data;
    }
};
