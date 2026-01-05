export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            meals: {
                Row: {
                    created_at: string | null
                    foods: Json | null
                    id: string
                    image_url: string | null
                    keto_score: Json | null
                    macros: Json | null
                    swap_suggestion: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    foods?: Json | null
                    id?: string
                    image_url?: string | null
                    keto_score?: Json | null
                    macros?: Json | null
                    swap_suggestion?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    foods?: Json | null
                    id?: string
                    image_url?: string | null
                    keto_score?: Json | null
                    macros?: Json | null
                    swap_suggestion?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "meals_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            product_scans: {
                Row: {
                    alternative_suggestion: string | null
                    barcode: string | null
                    brand: string | null
                    created_at: string | null
                    id: string
                    image_url: string | null
                    ingredients: Json | null
                    keto_score: Json | null
                    product_name: string | null
                    user_id: string
                }
                Insert: {
                    alternative_suggestion?: string | null
                    barcode?: string | null
                    brand?: string | null
                    created_at?: string | null
                    id?: string
                    image_url?: string | null
                    ingredients?: Json | null
                    keto_score?: Json | null
                    product_name?: string | null
                    user_id: string
                }
                Update: {
                    alternative_suggestion?: string | null
                    barcode?: string | null
                    brand?: string | null
                    created_at?: string | null
                    id?: string
                    image_url?: string | null
                    ingredients?: Json | null
                    keto_score?: Json | null
                    product_name?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "product_scans_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    carb_limit: number | null
                    created_at: string | null
                    email: string
                    id: string
                    name: string | null
                    subscription_status: string | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    carb_limit?: number | null
                    created_at?: string | null
                    email: string
                    id: string
                    name?: string | null
                    subscription_status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    carb_limit?: number | null
                    created_at?: string | null
                    email?: string
                    id?: string
                    name?: string | null
                    subscription_status?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
