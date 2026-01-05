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
  GroceryScannerScreen
} from './src/screens'
import { Loader } from './src/components/atoms'
import { TabBar } from './src/components/layout'
import { supabase } from './src/services/supabase'
import { analyzePhoto, AnalysisResult } from './src/services/aiService'
import { ProductData } from './src/services/barcodeService'
import { preprocessLabelImage } from './src/utils/imageUtils'
import { ProfileService, UserProfile } from './src/services/profileService'
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

type ScreenName = 'splash' | 'quiz' | 'auth' | 'home' | 'camera' | 'grocery-scanner' | 'result' | 'profile'

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
      setHasCompletedQuiz(true); // Temporarily to allow progression
      setCurrentScreen('auth');
    }
  }, [session])

  const handleScanMeal = useCallback(() => {
    setCurrentScreen('camera')
  }, [])

  const handleScanProduct = useCallback(() => {
    setCurrentScreen('grocery-scanner')
  }, [])

  // AI-powered meal capture handler
  const handleMealCapture = useCallback(async (uri: string, _base64?: string) => {
    setScanCount(prev => prev + 1)
    setScanType('meal')

    try {
      setIsAnalyzing(true)
      const processed = await preprocessLabelImage(uri)
      setLastImage(processed.uri)
      if (processed.base64) {
        const result = await analyzePhoto(processed.base64, 'meal')
        setAnalysisResult(result)
        setProductResult(null)
        setCurrentScreen('result')
      } else {
        throw new Error('Preprocessing failed to produce base64')
      }
    } catch (error) {
      console.error('Meal Analysis failed:', error)
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

  const handleTabChange = useCallback((tab: 'home' | 'scan' | 'profile') => {
    if (tab === 'home') setCurrentScreen('home')
    else if (tab === 'scan') setCurrentScreen('camera')
    else if (tab === 'profile') setCurrentScreen('profile')
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
            onScanMeal={handleScanMeal}
            onScanProduct={handleScanProduct}
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
      default:
        return <SplashScreen onGetStarted={handleGetStarted} />
    }
  }

  const showTabBar = ['home', 'profile', 'result'].includes(currentScreen)
  const activeTab = currentScreen === 'profile' ? 'profile' : 'home'

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
