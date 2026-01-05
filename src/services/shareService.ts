/**
 * Share Service
 * Handles share card capture, referral attribution, and social sharing
 */

import { RefObject } from 'react';
import { View, Share, Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const APP_URL = 'https://ketolens.app';

export interface ShareOptions {
    score: number;
    verdict: string;
    userId?: string;
    productName?: string;
}

/**
 * Capture a view as an image
 */
export async function captureShareCard(viewRef: RefObject<View | null>): Promise<string | null> {
    if (!viewRef.current) {
        console.error('Share card ref is null');
        return null;
    }

    try {
        const uri = await captureRef(viewRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
        });
        return uri;
    } catch (error) {
        console.error('Failed to capture share card:', error);
        return null;
    }
}

/**
 * Generate referral URL with user attribution
 */
export function generateReferralUrl(userId?: string): string {
    if (!userId) {
        return APP_URL;
    }
    return `${APP_URL}/r/${userId}`;
}

/**
 * Generate share message text
 */
export function generateShareMessage(options: ShareOptions): string {
    const { score, verdict, productName } = options;

    const verdictEmoji = verdict === 'safe' ? '✅' : verdict === 'borderline' ? '⚠️' : '❌';
    const item = productName ? `"${productName}"` : 'My meal';

    let message = `${verdictEmoji} ${item} scored ${score}/100 on the Keto scale!\n\n`;

    if (score >= 80) {
        message += '🎉 Keto approved! Staying on track.';
    } else if (score >= 50) {
        message += '🤔 Borderline keto - might need some adjustments.';
    } else {
        message += '😬 Not keto-friendly - time for a swap!';
    }

    const referralUrl = generateReferralUrl(options.userId);
    message += `\n\nCheck your food with KetoLens 👉 ${referralUrl}`;

    return message;
}

/**
 * Share result with native share sheet
 */
export async function shareResult(
    viewRef: RefObject<View | null>,
    options: ShareOptions
): Promise<boolean> {
    try {
        // Capture the share card
        const imageUri = await captureShareCard(viewRef);

        if (!imageUri) {
            // Fallback to text-only share using React Native Share API
            const message = generateShareMessage(options);
            await Share.share({
                message,
                title: 'My KetoLens Result',
            });
            return true;
        }

        // Check if expo-sharing is available
        const isAvailable = await Sharing.isAvailableAsync();

        if (isAvailable) {
            // Share with image using expo-sharing
            await Sharing.shareAsync(imageUri, {
                mimeType: 'image/png',
                dialogTitle: 'Share your KetoLens result',
            });
        } else {
            // Fallback to text share
            const message = generateShareMessage(options);
            await Share.share({
                message,
                title: 'My KetoLens Result',
            });
        }

        return true;
    } catch (error) {
        console.error('Failed to share:', error);

        // Ultimate fallback - just share text
        try {
            const message = generateShareMessage(options);
            await Share.share({
                message,
                title: 'My KetoLens Result',
            });
            return true;
        } catch (fallbackError) {
            console.error('Text share also failed:', fallbackError);
            return false;
        }
    }
}

/**
 * Share text only (for platforms where image sharing is not ideal)
 */
export async function shareTextOnly(options: ShareOptions): Promise<boolean> {
    try {
        const message = generateShareMessage(options);
        await Share.share({
            message,
            title: 'My KetoLens Result',
        });
        return true;
    } catch (error) {
        console.error('Failed to share text:', error);
        return false;
    }
}
