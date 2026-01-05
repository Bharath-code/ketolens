/**
 * KetoLens Type Definitions
 * Shared types for the app
 */

// ===== Keto Verdict Types =====
export type KetoVerdict = 'safe' | 'borderline' | 'avoid' | 'unknown'

export interface KetoScore {
    score: number // 0-100
    verdict: KetoVerdict
    confidence: 'high' | 'medium' | 'low'
}

// ===== User Types =====
export interface User {
    id: string
    email: string
    name?: string
    avatar_url?: string
    carb_limit: number // daily net carb limit (default: 20g)
    subscription_status: SubscriptionStatus
    created_at: string
    updated_at: string
}

export type SubscriptionStatus = 'free' | 'premium' | 'pro'

export interface UserPreferences {
    carb_limit: number
    notifications_enabled: boolean
    dark_mode: boolean
}

// ===== Meal Types =====
export interface Meal {
    id: string
    user_id: string
    image_url: string
    foods: DetectedFood[]
    macros: Macros
    keto_score: KetoScore
    swap_suggestion?: string
    created_at: string
}

export interface DetectedFood {
    name: string
    confidence: number // 0-1
    estimated_portion?: string // e.g., "1/2 cup", "100g"
    carb_risk: 'high' | 'medium' | 'low'
    is_keto_offender: boolean
}

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.85) return 'high'
    if (confidence >= 0.65) return 'medium'
    return 'low'
}


export interface Macros {
    net_carbs: number
    fat: number
    protein: number
    calories: number
    fiber?: number
}

// ===== Product Scan Types =====
export interface ProductScan {
    id: string
    user_id: string
    barcode?: string
    image_url?: string
    product_name?: string
    brand?: string
    ingredients: ParsedIngredient[]
    keto_score: KetoScore
    alternative_suggestion?: string
    created_at: string
}

export interface ParsedIngredient {
    name: string
    is_offender: boolean
    penalty_score: number
    reason?: string
}

// ===== Scan Types (Union) =====
export type ScanResult =
    | { type: 'meal'; data: Meal }
    | { type: 'product'; data: ProductScan }

export type ScanType = 'meal' | 'product'

// ===== Component Prop Types =====
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'
