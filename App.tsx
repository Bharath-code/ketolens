import React, { useState, useCallback, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreenNative from 'expo-splash-screen'
import { Session } from '@supabase/supabase-js'

// Fonts
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins'

// Components
import {
  SplashScreen,
  HomeScreen,
  ResultScreen,
  MealCameraScreen,
  AuthScreen,
  QuizScreen,
  ProfileScreen,
  GroceryScannerScreen,
  PaywallScreen,
  HistoryScreen,
  type HistoryItem
} from './src/screens'
import { Loader } from './src/components/atoms'
import { TabBar } from './src/components/layout'
import * as RNIap from 'react-native-iap'
import { supabase } from './src/services/supabase'
import { analyzePhoto, AnalysisResult } from './src/services/aiService'
import { ProductData } from './src/services/barcodeService'
import { QuotaService } from './src/services/quotaService'
import { preprocessLabelImage } from './src/utils/imageUtils'
import { ProfileService, UserProfile } from './src/services/profileService'
import { AnalyticsService, EVENTS } from './src/services/analyticsService'
import { NotificationService } from './src/services/notificationService'
import { View, StyleSheet } from 'react-native'
import { AnimatePresence, MotiView } from 'moti'
import { Colors } from './src/constants/theme'

// Keep the splash screen visible while we fetch resources
SplashScreenNative.preventAutoHideAsync()

// Mock data for fallback
const MOCK_RESULT = {
  score: 82,
  verdict: 'safe' as const,
  macros: {
    net_carbs: 8,
    fat: 45,
    protein: 32,
    calories: 520,
  },
  swapSuggestion: 'Great choice! This meal fits well within your keto goals.',
  foods: ['Mock Food'],
  plateConfidence: 1.0,
}

type ScreenName = 'splash' | 'quiz' | 'auth' | 'home' | 'camera' | 'grocery-scanner' | 'result' | 'profile' | 'paywall' | 'history'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash')
  const [lastImage, setLastImage] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [productResult, setProductResult] = useState<ProductData | null>(null)
  const [scanType, setScanType] = useState<'meal' | 'product'>('meal')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [quotaStatus, setQuotaStatus] = useState({ canScan: true, remaining: 5, total: 5, isPro: false })

  // Refresh quota
  const refreshQuota = useCallback(async () => {
    const status = await QuotaService.getQuotaStatus(session?.user?.id)
    setQuotaStatus(status)
  }, [session])

  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  })

  // Handle Auth Session and Initial Profile Check
  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        // Sync guest data if it exists
        const guestData = await ProfileService.getGuestData();
        const profile = await ProfileService.getProfile(session.user.id)

        if (guestData) {
          await ProfileService.saveProfile({
            id: session.user.id,
            ...guestData.profileData,
            ...guestData.targets,
          } as UserProfile)
          setHasCompletedQuiz(true)
        } else {
          setHasCompletedQuiz(!!profile)
        }
      }
      setAuthInitialized(true)
    })

    // 2. Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      if (session) {
        // Checking for guest data to sync
        const guestData = await ProfileService.getGuestData();
        if (guestData) {
          await ProfileService.saveProfile({
            id: session.user.id,
            ...guestData.profileData,
            ...guestData.targets,
          } as UserProfile);
          setHasCompletedQuiz(true);
          setCurrentScreen('home');
        } else {
          const profile = await ProfileService.getProfile(session.user.id)
          if (profile) {
            setHasCompletedQuiz(true)
            setCurrentScreen(prev => (prev === 'auth' || prev === 'splash' ? 'home' : prev))
          } else {
            setHasCompletedQuiz(false)
            setCurrentScreen('quiz')
          }
        }
      } else {
        setHasCompletedQuiz(false)
        setCurrentScreen('splash')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Initialize Analytics and Notifications
  useEffect(() => {
    AnalyticsService.init()

    // Setup Notifications
    NotificationService.registerForPushNotificationsAsync()
    NotificationService.scheduleDailyReminder(12, 0) // Default 12 PM lunch reminder
  }, [])

  // Identify user on session change
  useEffect(() => {
    if (session?.user?.id) {
      AnalyticsService.identify(session.user.id, {
        email: session.user.email,
        is_pro: quotaStatus.isPro,
      })
    }
  }, [session, quotaStatus.isPro])

  // Hide Splash Screen when ready
  useEffect(() => {
    if (fontsLoaded && authInitialized) {
      SplashScreenNative.hideAsync()
      if (session) {
        if (hasCompletedQuiz) {
          setCurrentScreen('home')
        } else {
          setCurrentScreen('quiz')
        }
      } else {
        setCurrentScreen('splash')
      }
    }
  }, [fontsLoaded, authInitialized, session, hasCompletedQuiz])

  // Sync quota on session change or screen change
  useEffect(() => {
    if (authInitialized) {
      refreshQuota()
      AnalyticsService.screen(currentScreen)
    }
  }, [authInitialized, session, currentScreen])

  // Navigation handlers
  const handleGetStarted = useCallback(() => {
    // Allow quiz first regardless of session
    setCurrentScreen('quiz')
  }, [])

  const handleQuizComplete = useCallback(async (data: any) => {
    console.log('Quiz data completed:', data)

    const profileData = {
      gender: data[1].toLowerCase() as any,
      age: parseInt(data[2]),
      weight: parseFloat(data[3].value),
      weight_unit: data[3].unit,
      height: parseFloat(data[4].value),
      height_unit: data[4].unit,
      activity_level: data[5].toLowerCase().replace(' ', '_') as any,
      goal: data[6].toLowerCase().replace(' ', '_') as any,
    }
    const targets = ProfileService.calculateTargets(profileData)

    if (session?.user?.id) {
      try {
        await ProfileService.saveProfile({
          id: session.user.id,
          ...profileData,
          ...targets,
        } as UserProfile)

        AnalyticsService.track(EVENTS.ONBOARDING_COMPLETED, { method: 'signed_in' })
        setHasCompletedQuiz(true)
        setCurrentScreen('home')
      } catch (err) {
        console.error('[App] Failed to save profile:', err)
        setHasCompletedQuiz(true)
        setCurrentScreen('home')
      }
    } else {
      // Guest User: Save locally and go to Auth
      await ProfileService.saveGuestData(profileData, targets);
      AnalyticsService.track(EVENTS.QUIZ_COMPLETED, { method: 'guest' })
      setHasCompletedQuiz(true); // Temporarily to allow progression
      setCurrentScreen('auth');
    }
  }, [session])

  const handleScanMeal = useCallback(async () => {
    const { canScan } = await QuotaService.getQuotaStatus(session?.user?.id)
    if (!canScan) {
      setCurrentScreen('paywall')
    } else {
      setCurrentScreen('camera')
    }
  }, [session])

  const handleScanProduct = useCallback(async () => {
    const { canScan } = await QuotaService.getQuotaStatus(session?.user?.id)
    if (!canScan) {
      setCurrentScreen('paywall')
    } else {
      setCurrentScreen('grocery-scanner')
    }
  }, [session])

  // AI-powered meal capture handler
  const handleMealCapture = useCallback(async (uri: string, _base64?: string) => {
    await QuotaService.incrementScanCount(session?.user?.id)
    await refreshQuota()
    setScanCount(prev => prev + 1)
    setScanType('meal')

    try {
      setIsAnalyzing(true)
      AnalyticsService.track(EVENTS.SCAN_STARTED, { type: 'meal' })
      const processed = await preprocessLabelImage(uri)
      setLastImage(processed.uri)
      if (processed.base64) {
        const result = await analyzePhoto(processed.base64, 'meal')
        AnalyticsService.track(EVENTS.SCAN_COMPLETED, {
          type: 'meal',
          score: result.score,
          verdict: result.verdict
        })
        setAnalysisResult(result)
        setProductResult(null)
        setCurrentScreen('result')
      } else {
        throw new Error('Preprocessing failed to produce base64')
      }
    } catch (error: any) {
      console.error('Meal Analysis failed:', error)
      AnalyticsService.track(EVENTS.SCAN_FAILED, { type: 'meal', error: error.message })
      setLastImage(uri)
      setAnalysisResult(MOCK_RESULT as any)
      setProductResult(null)
      setCurrentScreen('result')
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  // Barcode-based product lookup handler (No AI, database only)
  const handleProductScanned = useCallback(async (product: ProductData) => {
    await QuotaService.incrementScanCount(session?.user?.id)
    await refreshQuota()
    setScanCount(prev => prev + 1)
    setScanType('product')
    setProductResult(product)
    setAnalysisResult(null)
    setCurrentScreen('result')

    // AUTOMATIC REFINEMENT LAYER: Fallback to Image OCR if API data is incomplete
    if (product.needsOCR && (product.imageIngredientsUrl || product.imageUrl)) {
      const imageUrl = product.imageIngredientsUrl || product.imageUrl;
      if (imageUrl) {
        console.log('[App] Metadata incomplete, triggering automatic OCR refinement from URL');
        try {
          const refinedResult = await analyzePhoto(imageUrl, 'product', true);
          setProductResult(prev => {
            if (!prev || prev.barcode !== product.barcode) return prev;
            return {
              ...prev,
              ingredients: refinedResult.foods.map(f => f.name),
              ketoScore: refinedResult.score,
              ketoVerdict: refinedResult.verdict,
              swapSuggestion: refinedResult.swapSuggestion,
              needsOCR: false,
              source: 'ocr'
            };
          });
        } catch (err) {
          console.error('[App] Automatic OCR refinement failed:', err);
        }
      }
    }
  }, [])

  const handleProductCapture = useCallback(async (uri: string, _type: 'barcode' | 'ingredients', _data?: string, _base64?: string) => {
    setScanCount(prev => prev + 1)
    try {
      setIsAnalyzing(true)
      const processed = await preprocessLabelImage(uri)
      setLastImage(processed.uri)
      if (processed.base64) {
        const result = await analyzePhoto(processed.base64, 'product')
        setAnalysisResult(result)
        setCurrentScreen('result')
      } else {
        throw new Error('Preprocessing failed to produce base64')
      }
    } catch (error) {
      console.error('Product Analysis failed:', error)
      setLastImage(uri)
      setAnalysisResult(MOCK_RESULT as any)
      setCurrentScreen('result')
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  const handleBack = useCallback(() => {
    setCurrentScreen('home')
  }, [])

  const handleShare = useCallback(() => {
    if (!session) {
      setCurrentScreen('auth')
    } else {
      console.log('Share result')
    }
  }, [session])

  const handleScanAgain = useCallback(() => {
    if (scanCount >= 1 && !session) {
      setCurrentScreen('auth')
    } else {
      setCurrentScreen('home')
    }
  }, [scanCount, session])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    setHasCompletedQuiz(false)
    setCurrentScreen('splash')
  }, [])

  const handleTabChange = useCallback((tab: 'home' | 'scan' | 'history' | 'profile') => {
    if (tab === 'home') setCurrentScreen('home')
    else if (tab === 'scan') setCurrentScreen('camera')
    else if (tab === 'history') setCurrentScreen('history')
    else if (tab === 'profile') setCurrentScreen('profile')
  }, [])

  // Initialize IAP Connection
  useEffect(() => {
    RNIap.initConnection().then((result) => {
      console.log('[IAP] Connection initialized:', result)
    }).catch((err) => {
      console.warn('[IAP] Connection failed:', err)
    })

    return () => {
      RNIap.endConnection()
    }
  }, [])

  if (!fontsLoaded || !authInitialized) {
    return <Loader fullScreen message="Loading KetoLens..." />
  }

  if (isAnalyzing) {
    return <Loader fullScreen message="AI is analyzing your selection..." />
  }

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onGetStarted={handleGetStarted} />
      case 'quiz':
        return <QuizScreen onComplete={handleQuizComplete} />
      case 'auth':
        return <AuthScreen />
      case 'home':
        return (
          <HomeScreen
            userName={session?.user?.email?.split('@')[0] || 'Keto Warrior'}
            scansRemaining={quotaStatus.remaining}
            isPro={quotaStatus.isPro}
            onScanMeal={handleScanMeal}
            onScanProduct={handleScanProduct}
            onViewHistory={() => setCurrentScreen('history')}
          />
        )
      case 'profile':
        return (
          <ProfileScreen
            session={session}
            onLogout={handleLogout}
          />
        )
      case 'camera':
        return (
          <MealCameraScreen
            onBack={handleBack}
            onCapture={handleMealCapture}
          />
        )
      case 'grocery-scanner':
        return (
          <GroceryScannerScreen
            onBack={handleBack}
            onProductScanned={handleProductScanned}
          />
        )
      case 'result':
        return (
          <ResultScreen
            score={scanType === 'product' ? (productResult?.ketoScore ?? 0) : (analysisResult?.score ?? MOCK_RESULT.score)}
            verdict={scanType === 'product' ? (productResult?.ketoVerdict ?? 'avoid') : (analysisResult?.verdict ?? MOCK_RESULT.verdict)}
            macros={scanType === 'product' ? (productResult?.macros ?? MOCK_RESULT.macros) : (analysisResult?.macros ?? MOCK_RESULT.macros)}
            scanType={scanType}
            swapSuggestion={scanType === 'product' ? (productResult?.swapSuggestion ?? '') : (analysisResult?.swapSuggestion ?? MOCK_RESULT.swapSuggestion)}
            foods={analysisResult?.foods ?? []}
            plateConfidence={analysisResult?.plateConfidence ?? 1.0}
            productName={productResult?.name}
            userId={session?.user?.id}
            onBack={handleBack}
            onScanAgain={handleScanAgain}
          />
        )
      case 'paywall':
        return (
          <PaywallScreen
            userId={session?.user?.id}
            userEmail={session?.user?.email}
            onBack={handleBack}
            onSuccess={() => {
              setCurrentScreen('home')
              // Optionally show a "Success" toast here
            }}
          />
        )
      case 'history':
        return (
          <HistoryScreen
            userId={session?.user?.id || ''}
            onItemPress={(item: HistoryItem) => {
              // For now, just log. In future, we could navigate back to ResultScreen with this item's data
              console.log('History item pressed:', item)
            }}
          />
        )
      default:
        return <SplashScreen onGetStarted={handleGetStarted} />
    }
  }

  const showTabBar = ['home', 'profile', 'result', 'history'].includes(currentScreen)
  const activeTab = currentScreen === 'profile' ? 'profile' : currentScreen === 'history' ? 'history' : 'home'

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={[styles.container, { backgroundColor: Colors.white }]}>
        <View style={styles.content}>
          <AnimatePresence>
            <MotiView
              key={currentScreen}
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                type: 'timing',
                duration: 200,
              }}
              style={styles.screenWrapper}
            >
              {renderScreen()}
            </MotiView>
          </AnimatePresence>
        </View>
        {showTabBar && (
          <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </View>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: Colors.white,
  },
})
