/**
 * Log Service
 * Silent logging of user corrections for model improvement
 */

import { supabase } from './supabase';

export type UserCorrectionAction = 'confirmed' | 'removed' | 'replaced' | 'untouched';

export interface CorrectionLog {
    scan_id: string;
    food_label: string;
    model_confidence: number;
    user_action: UserCorrectionAction;
    replacement_label?: string;
    timestamp: string;
}

/**
 * Logs a user correction event silently.
 * Does not throw - failures are swallowed to avoid disrupting UX.
 */
export async function logCorrection(log: CorrectionLog): Promise<void> {
    try {
        // For MVP: Log to console. In production, persist to Supabase.
        console.log('[Correction Log]', JSON.stringify(log));

        // Future: Uncomment when corrections table is created
        // await supabase.from('corrections').insert(log);
    } catch (error) {
        // Silent failure - don't disrupt user flow
        console.error('[Correction Log Error]', error);
    }
}

/**
 * Batch log multiple corrections from a single scan.
 */
export async function logBatchCorrections(logs: CorrectionLog[]): Promise<void> {
    for (const log of logs) {
        await logCorrection(log);
    }
}
