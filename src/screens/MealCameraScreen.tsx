/**
 * MealCameraScreen
 * Camera view for capturing meal photos using expo-camera
 */

import React, { useState, useEffect, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Navbar, Screen } from '../components/layout'
import { Button, Text, Loader } from '../components/atoms'
import { Colors, Spacing, BorderRadius } from '../constants/theme'
import { MotiView } from 'moti'
import { haptics } from '../services/hapticsService'

interface MealCameraScreenProps {
    onBack: () => void
    onCapture: (imageUri: string) => void
}

const { width } = Dimensions.get('window')

export function MealCameraScreen({
    onBack,
    onCapture,
}: MealCameraScreenProps) {
    const [permission, requestPermission] = useCameraPermissions()
    const cameraRef = useRef<CameraView>(null)
    const [isCapturing, setIsCapturing] = useState(false)

    if (!permission) {
        // Camera permissions are still loading
        return <Loader fullScreen message="Requesting camera access..." />
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <Screen scrollable={false} header={<Navbar title="Scan Meal" showBack onBack={onBack} />}>
                <View style={styles.permissionContainer}>
                    <Text variant="body" size="lg" align="center">
                        We need your permission to show the camera
                    </Text>
                    <Button onPress={requestPermission}>Grant Permission</Button>
                </View>
            </Screen>
        )
    }

    const handleCapture = async () => {
        if (cameraRef.current && !isCapturing) {
            try {
                setIsCapturing(true)
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.8,
                    base64: false,
                })
                if (photo) {
                    haptics.success()
                    onCapture(photo.uri)
                }
            } catch (error) {
                console.error('Failed to take picture:', error)
            } finally {
                setIsCapturing(false)
            }
        }
    }

    return (
        <Screen
            scrollable={false}
            padding={false}
            header={<Navbar title="Scan Meal" showBack onBack={onBack} />}
        >
            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                />

                {/* Focus Guide Overlay */}
                <View style={styles.overlay} pointerEvents="none">
                    <MotiView
                        from={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.05, opacity: 1 }}
                        transition={{
                            type: 'timing',
                            duration: 1000,
                            loop: true,
                            repeatReverse: true,
                        }}
                        style={styles.focusGuide}
                    >
                        <View style={[styles.corner, styles.tl]} />
                        <View style={[styles.corner, styles.tr]} />
                        <View style={[styles.corner, styles.bl]} />
                        <View style={[styles.corner, styles.br]} />
                    </MotiView>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <Text variant="body" size="sm" color={Colors.gray400} align="center">
                        Center your meal in the frame
                    </Text>

                    <View style={styles.captureButtonContainer}>
                        <TouchableOpacity
                            style={[styles.captureButton, isCapturing && styles.disabled]}
                            onPress={() => {
                                haptics.medium()
                                handleCapture()
                            }}
                            disabled={isCapturing}
                        >
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {isCapturing && <Loader fullScreen message="Analyzing your meal..." />}
        </Screen>
    )
}

const styles = StyleSheet.create({
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.xl,
        padding: Spacing['3xl'],
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: Colors.black,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    focusGuide: {
        width: width * 0.7,
        height: width * 0.7,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: Colors.white,
    },
    tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
    tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
    br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },

    controls: {
        backgroundColor: Colors.white,
        padding: Spacing['2xl'],
        gap: Spacing.xl,
        paddingBottom: Spacing['4xl'],
    },
    captureButtonContainer: {
        alignItems: 'center',
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: Colors.gray200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.ketoSafe,
    },
    disabled: {
        opacity: 0.5,
    }
})

export default MealCameraScreen
