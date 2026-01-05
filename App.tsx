/**
 * KetoLens App
 * Main application entry point with font loading and navigation
 */

import React, { useState, useCallback, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreenNative from 'expo-splash-screen'

// Fonts
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter'
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins'

// Components
import { SplashScreen, HomeScreen, ResultScreen, MealCameraScreen } from './src/screens'
import { Loader } from './src/components/atoms'

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

type ScreenName = 'splash' | 'home' | 'camera' | 'result'

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('splash')
  const [lastImage, setLastImage] = useState<string | null>(null)

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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreenNative.hideAsync()
    }
  }, [fontsLoaded])

  // Navigation handlers
  const handleGetStarted = useCallback(() => {
    setCurrentScreen('home')
  }, [])

  const handleScanMeal = useCallback(() => {
    setCurrentScreen('camera')
  }, [])

  const handleScanProduct = useCallback(() => {
    // For now, product scanning uses same camera
    setCurrentScreen('camera')
  }, [])

  const handleCapture = useCallback((uri: string) => {
    setLastImage(uri)
    // Simulate processing time
    setTimeout(() => {
      setCurrentScreen('result')
    }, 1500)
  }, [])

  const handleBack = useCallback(() => {
    setCurrentScreen('home')
  }, [])

  const handleShare = useCallback(() => {
    console.log('Share result')
  }, [])

  const handleScanAgain = useCallback(() => {
    setCurrentScreen('home')
  }, [])

  if (!fontsLoaded) {
    return <Loader fullScreen message="Loading KetoLens..." />
  }

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onGetStarted={handleGetStarted} />

      case 'home':
        return (
          <HomeScreen
            onScanMeal={handleScanMeal}
            onScanProduct={handleScanProduct}
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

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {renderScreen()}
    </SafeAreaProvider>
  )
}
