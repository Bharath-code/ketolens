import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_SCAN_LIMIT = 5;
const GUEST_SCAN_COUNT_KEY = '@ketolens:guest_scan_count';
const GUEST_SCAN_DATE_KEY = '@ketolens:guest_scan_date';

export interface QuotaStatus {
    canScan: boolean;
    remaining: number;
    total: number;
    isPro: boolean;
}

export const QuotaService = {
    /**
     * Check if user can perform a scan
     */
    async getQuotaStatus(userId?: string): Promise<QuotaStatus> {
        // 1. Check if user is Pro
        let isPro = false;
        if (userId) {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('subscription_status')
                .eq('id', userId)
                .maybeSingle();

            if (!error && data?.subscription_status === 'pro') {
                return { canScan: true, remaining: 999, total: 999, isPro: true };
            }
        }

        // 2. Check Daily Limit
        const today = new Date().toISOString().split('T')[0];
        let currentCount = 0;

        if (userId) {
            // Logged in user: Get from Supabase
            const { data, error } = await supabase
                .from('user_scan_usage')
                .select('count')
                .eq('user_id', userId)
                .eq('scan_date', today)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('[QuotaService] Error fetching scan usage:', error);
            }
            currentCount = data?.count || 0;
        } else {
            // Guest user: Get from AsyncStorage
            const storedDate = await AsyncStorage.getItem(GUEST_SCAN_DATE_KEY);
            if (storedDate === today) {
                const storedCount = await AsyncStorage.getItem(GUEST_SCAN_COUNT_KEY);
                currentCount = storedCount ? parseInt(storedCount) : 0;
            } else {
                // New day for guest
                currentCount = 0;
                await AsyncStorage.setItem(GUEST_SCAN_DATE_KEY, today);
                await AsyncStorage.setItem(GUEST_SCAN_COUNT_KEY, '0');
            }
        }

        const remaining = Math.max(0, FREE_SCAN_LIMIT - currentCount);
        return {
            canScan: remaining > 0,
            remaining,
            total: FREE_SCAN_LIMIT,
            isPro: false
        };
    },

    /**
     * Increment scan count after a successful scan
     */
    async incrementScanCount(userId?: string): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        if (userId) {
            // Logged in user: Upsert to Supabase
            // We use a manual increment since Postgres triggers or complex RPCs aren't strictly necessary for a simple count
            const { data: usage } = await supabase
                .from('user_scan_usage')
                .select('id, count')
                .eq('user_id', userId)
                .eq('scan_date', today)
                .maybeSingle();

            if (usage) {
                await supabase
                    .from('user_scan_usage')
                    .update({ count: usage.count + 1 })
                    .eq('id', usage.id);
            } else {
                await supabase
                    .from('user_scan_usage')
                    .insert({ user_id: userId, scan_date: today, count: 1 });
            }
        } else {
            // Guest user: Update AsyncStorage
            const storedCount = await AsyncStorage.getItem(GUEST_SCAN_COUNT_KEY);
            const nextCount = (storedCount ? parseInt(storedCount) : 0) + 1;
            await AsyncStorage.setItem(GUEST_SCAN_COUNT_KEY, nextCount.toString());
            await AsyncStorage.setItem(GUEST_SCAN_DATE_KEY, today);
        }
    }
};
