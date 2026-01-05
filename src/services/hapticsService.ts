/**
 * Haptics Service
 * Centralized utility for sensory feedback
 */

import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

export const haptics = {
    /**
     * Light impact for subtle interactions (button press)
     */
    light: () => {
        if (Platform.OS === 'web') return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    },

    /**
     * Medium impact for meaningful transitions
     */
    medium: () => {
        if (Platform.OS === 'web') return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    },

    /**
     * Heavy impact for significant events
     */
    heavy: () => {
        if (Platform.OS === 'web') return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    },

    /**
     * Success notification for positive results
     */
    success: () => {
        if (Platform.OS === 'web') return
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    },

    /**
     * Warning notification
     */
    warning: () => {
        if (Platform.OS === 'web') return
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    },

    /**
     * Error notification for failures
     */
    error: () => {
        if (Platform.OS === 'web') return
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    }
}
