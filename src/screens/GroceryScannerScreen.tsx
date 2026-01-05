/**
 * GroceryScannerScreen
 * Barcode-only scanner for product lookup
 * Uses Open Food Facts database for verified nutrition data
 */

import React, { useState, useCallback } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'
import { Navbar, Screen } from '../components/layout'
import { Button, Text, Loader } from '../components/atoms'
import { Colors, Spacing, BorderRadius } from '../constants/theme'
import { MotiView } from 'moti'
import { haptics } from '../services/hapticsService'
import { lookupProduct, ProductData } from '../services/barcodeService'
import { Barcode, CheckCircle } from 'lucide-react-native'

interface GroceryScannerScreenProps {
    onBack: () => void
    onProductScanned: (product: ProductData) => void
}

const { width } = Dimensions.get('window')

export function GroceryScannerScreen({
    onBack,
    onProductScanned,
}: GroceryScannerScreenProps) {
    const [permission, requestPermission] = useCameraPermissions()
    const [scanned, setScanned] = useState(false)
    const [isLookingUp, setIsLookingUp] = useState(false)
    const [lastBarcode, setLastBarcode] = useState<string | null>(null)

    const handleBarcodeScanned = useCallback(async (result: BarcodeScanningResult) => {
        if (scanned || isLookingUp) return

        setScanned(true)
        setLastBarcode(result.data)
        haptics.success()

        try {
            setIsLookingUp(true)
            const product = await lookupProduct(result.data)

            if (!product.found) {
                haptics.warning()
                // Show "Not Found" state or suggest OCR
                // For now, we'll still pass it to ResultScreen which can show the "Not Found" message
            }

            onProductScanned(product)
        } catch (error) {
            console.error('Product lookup failed:', error)
            // Reset to allow re-scan
            setScanned(false)
        } finally {
            setIsLookingUp(false)
        }
    }, [scanned, isLookingUp, onProductScanned])

    const handleRescan = useCallback(() => {
        setScanned(false)
        setLastBarcode(null)
    }, [])

    if (!permission) {
        return <Loader fullScreen message="Requesting camera access..." />
    }

    if (!permission.granted) {
        return (
            <Screen scrollable={false} header={<Navbar title="Product Scanner" showBack onBack={onBack} />}>
                <View style={styles.permissionContainer}>
                    <Barcode size={64} color={Colors.gray400} />
                    <Text variant="heading" size="lg" align="center">
                        Camera Access Required
                    </Text>
                    <Text variant="body" size="base" color={Colors.gray500} align="center">
                        We need camera access to scan product barcodes
                    </Text>
                    <Button onPress={requestPermission}>Grant Permission</Button>
                </View>
            </Screen>
        )
    }

    if (isLookingUp) {
        return <Loader fullScreen message="Looking up product..." />
    }

    return (
        <Screen
            scrollable={false}
            padding={false}
            header={<Navbar title="Scan Product" showBack onBack={onBack} />}
        >
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
                    }}
                />

                {/* Scanning Overlay */}
                <View style={styles.overlay} pointerEvents="none">
                    <MotiView
                        from={{ opacity: 0.5, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'timing', duration: 500 }}
                        style={styles.scanFrame}
                    >
                        {/* Animated scan line */}
                        <MotiView
                            from={{ translateY: -80 }}
                            animate={{ translateY: 80 }}
                            transition={{
                                type: 'timing',
                                duration: 1500,
                                loop: true,
                                repeatReverse: true,
                            }}
                            style={styles.scanLine}
                        />

                        {/* Corner markers */}
                        <View style={[styles.corner, styles.tl]} />
                        <View style={[styles.corner, styles.tr]} />
                        <View style={[styles.corner, styles.bl]} />
                        <View style={[styles.corner, styles.br]} />

                        {/* Scanned indicator */}
                        {scanned && (
                            <MotiView
                                from={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={styles.scannedIndicator}
                            >
                                <CheckCircle size={48} color={Colors.ketoSafe} />
                            </MotiView>
                        )}
                    </MotiView>
                </View>

                {/* Bottom Controls */}
                <View style={styles.controls}>
                    <View style={styles.instructionBadge}>
                        <Barcode size={20} color={Colors.ketoSafe} />
                        <Text variant="body" size="sm" color={Colors.gray600}>
                            Point camera at product barcode
                        </Text>
                    </View>

                    {scanned && !isLookingUp && (
                        <Button variant="secondary" onPress={handleRescan}>
                            Scan Again
                        </Button>
                    )}
                </View>
            </View>
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanFrame: {
        width: width * 0.8,
        height: 180,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanLine: {
        position: 'absolute',
        width: '90%',
        height: 2,
        backgroundColor: Colors.ketoSafe,
        shadowColor: Colors.ketoSafe,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: Colors.white,
    },
    tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
    tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
    br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
    scannedIndicator: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 40,
        padding: Spacing.lg,
    },
    controls: {
        backgroundColor: Colors.white,
        padding: Spacing.xl,
        gap: Spacing.lg,
        paddingBottom: Spacing['3xl'],
        alignItems: 'center',
    },
    instructionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.ketoSafeDim,
        borderRadius: BorderRadius.full,
    },
})
