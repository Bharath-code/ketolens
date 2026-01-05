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
  ProfileScreen
} from './src/screens'
import { Loader } from './src/components/atoms'
import { TabBar } from './src/components/layout'
import { supabase } from './src/services/supabase'
import { View, StyleSheet } from 'react-native'
import { AnimatePresence, MotiView } from 'moti'
import { Colors } from './src/constants/theme'

// Keep the splash screen visible while we fetch resources
SplashScreenNative.preventAutoHideAsync()

// Mock data for demo
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
}

type ScreenName = 'splash' | 'quiz' | 'auth' | 'home' | 'camera' | 'result' | 'profile'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash')
  const [lastImage, setLastImage] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [authInitialized, setAuthInitialized] = useState(false)
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false)
  const [scanCount, setScanCount] = useState(0)

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

  // Handle Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setAuthInitialized(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        // If user logs in, we can proceed to home if they haven't already
        setCurrentScreen(prev => (prev === 'auth' ? 'home' : prev))
      } else {
        // On logout, return to splash/onboarding
        setCurrentScreen('splash')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (fontsLoaded && authInitialized) {
      SplashScreenNative.hideAsync()

      // Initial screen routing
      if (session) {
        setCurrentScreen('home')
      } else {
        // Fresh user starts at Splash
        setCurrentScreen('splash')
      }
    }
  }, [fontsLoaded, authInitialized, session])

  // Navigation handlers
  const handleGetStarted = useCallback(() => {
    setCurrentScreen('quiz')
  }, [])

  const handleQuizComplete = useCallback((data: any) => {
    console.log('Quiz data:', data)
    setHasCompletedQuiz(true)
    setCurrentScreen('home')
  }, [])

  const handleScanMeal = useCallback(() => {
    setCurrentScreen('camera')
  }, [])

  const handleScanProduct = useCallback(() => {
    setCurrentScreen('camera')
  }, [])

  const handleCapture = useCallback((uri: string) => {
    setLastImage(uri)
    setScanCount(prev => prev + 1)
    // Simulate processing time
    setTimeout(() => {
      setCurrentScreen('result')
    }, 1500)
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
    // If it was the first scan and not logged in, maybe show auth
    if (scanCount >= 1 && !session) {
      setCurrentScreen('auth')
    } else {
      setCurrentScreen('home')
    }
  }, [scanCount, session])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
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
            onCapture={handleCapture}
          />
        )
      case 'result':
        return (
          <ResultScreen
            score={MOCK_RESULT.score}
            verdict={MOCK_RESULT.verdict}
            macros={MOCK_RESULT.macros}
            scanType="meal"
            swapSuggestion={MOCK_RESULT.swapSuggestion}
            onBack={handleBack}
            onShare={handleShare}
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
