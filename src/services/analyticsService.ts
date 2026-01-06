import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let posthog: PostHog | null = null;

export const AnalyticsService = {
    init: async () => {
        if (!POSTHOG_API_KEY) {
            console.warn('[Analytics] PostHog API Key missing');
            return;
        }

        try {
            posthog = await PostHog.init(POSTHOG_API_KEY, {
                host: POSTHOG_HOST,
                persistence: 'localStorage',
                // For a stunning aesthetic, we want to capture everything
                captureLifecycleEvents: true,
                captureScreenViews: true,
            });
            console.log('[Analytics] PostHog initialized');
        } catch (err) {
            console.error('[Analytics] Failed to initialize PostHog:', err);
        }
    },

    identify: (userId: string, properties?: Record<string, any>) => {
        posthog?.identify(userId, properties);
    },

    track: (event: string, properties?: Record<string, any>) => {
        posthog?.capture(event, properties);
    },

    screen: (name: string, properties?: Record<string, any>) => {
        posthog?.screen(name, properties);
    },

    reset: () => {
        posthog?.reset();
    }
};

// Event Names
export const EVENTS = {
    SCAN_STARTED: 'scan_started',
    SCAN_COMPLETED: 'scan_completed',
    SCAN_FAILED: 'scan_failed',
    PAYWALL_VIEWED: 'paywall_viewed',
    PURCHASE_STARTED: 'purchase_started',
    PURCHASE_COMPLETED: 'purchase_completed',
    PURCHASE_FAILED: 'purchase_failed',
    QUIZ_STARTED: 'quiz_started',
    QUIZ_COMPLETED: 'quiz_completed',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    SHARE_CLICKED: 'share_clicked',
};
