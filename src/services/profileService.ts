import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_PROFILE_KEY = '@ketolens:guest_profile';
const GUEST_TARGETS_KEY = '@ketolens:guest_targets';

export interface UserProfile {
    id: string;
    age: number;
    weight: number;
    weight_unit: 'kg' | 'lbs';
    height: number;
    height_unit: 'cm' | 'ft';
    gender: 'male' | 'female' | 'other';
    activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
    goal: 'lose_weight' | 'maintain' | 'build_muscle';
    calorie_target: number;
    carb_limit: number;
}

export const ProfileService = {
    /**
     * Calculate TDEE using Mifflin-St Jeor
     */
    calculateTargets(profile: Omit<UserProfile, 'id' | 'calorie_target' | 'carb_limit'>): { calorie_target: number; carb_limit: number } {
        // 1. Convert to metric
        const weightKg = profile.weight_unit === 'lbs' ? profile.weight * 0.453592 : profile.weight;
        const heightCm = profile.height_unit === 'ft' ? profile.height * 30.48 : profile.height;

        // 2. Base BMR
        let bmr = 0;
        if (profile.gender === 'male') {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * profile.age) + 5;
        } else {
            bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * profile.age) - 161;
        }

        // 3. Apply Activity Multiplier
        const multipliers = {
            sedentary: 1.2,
            lightly_active: 1.375,
            moderately_active: 1.55,
            very_active: 1.725
        };
        const tdee = bmr * multipliers[profile.activity_level];

        // 4. Adjust for goal
        let calorieTarget = tdee;
        if (profile.goal === 'lose_weight') {
            calorieTarget -= 500; // 500 kcal deficit
        } else if (profile.goal === 'build_muscle') {
            calorieTarget += 300; // 300 kcal surplus
        }

        return {
            calorie_target: Math.round(calorieTarget),
            carb_limit: 50 // Default per user request
        };
    },

    async getProfile(userId: string): Promise<UserProfile | null> {
        // Use limit(1) instead of maybeSingle() to handle RLS/PostgREST weirdness 
        // that leads to PGRST116 even when rows are 0.
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .limit(1);

        if (error) {
            // Only log actual errors, not "no rows found"
            if (error.code !== 'PGRST116') {
                console.error('[ProfileService] Error fetching profile:', error);
            }
            return null;
        }

        return (data && data.length > 0) ? (data[0] as UserProfile) : null;
    },

    async saveProfile(profile: UserProfile): Promise<boolean> {
        const { error } = await supabase
            .from('user_profiles')
            .upsert(profile);

        if (error) {
            console.error('[ProfileService] Error saving profile:', error);
            return false;
        }

        // Clear guest data upon successful save
        await this.clearGuestData();
        return true;
    },

    async saveGuestData(profileData: any, targets: any): Promise<void> {
        try {
            await AsyncStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profileData));
            await AsyncStorage.setItem(GUEST_TARGETS_KEY, JSON.stringify(targets));
        } catch (err) {
            console.error('[ProfileService] Error saving guest data:', err);
        }
    },

    async getGuestData(): Promise<{ profileData: any, targets: any } | null> {
        try {
            const profileJson = await AsyncStorage.getItem(GUEST_PROFILE_KEY);
            const targetsJson = await AsyncStorage.getItem(GUEST_TARGETS_KEY);

            if (profileJson && targetsJson) {
                return {
                    profileData: JSON.parse(profileJson),
                    targets: JSON.parse(targetsJson)
                };
            }
        } catch (err) {
            console.error('[ProfileService] Error loading guest data:', err);
        }
        return null;
    },

    async clearGuestData(): Promise<void> {
        try {
            await AsyncStorage.removeItem(GUEST_PROFILE_KEY);
            await AsyncStorage.removeItem(GUEST_TARGETS_KEY);
        } catch (err) {
            console.error('[ProfileService] Error clearing guest data:', err);
        }
    }
};
