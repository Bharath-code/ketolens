import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

/**
 * Preprocess label image for better OCR results
 * Pipeline: Resize -> Compress
 */
export async function preprocessLabelImage(uri: string): Promise<{ uri: string; base64?: string }> {
    try {
        const result = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1200 } }],
            {
                compress: 0.85,
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true
            }
        );

        return {
            uri: result.uri,
            base64: result.base64
        };
    } catch (error) {
        console.error('[ImageUtils] Preprocessing error:', error);
        return { uri }; // Return original on failure
    }
}

/**
 * Preprocessing for remote images (e.g., Open Food Facts).
 * Downloads, resizes, and returns base64 for AI analysis.
 */
export async function preprocessRemoteImage(url: string): Promise<string | null> {
    try {
        console.log('[ImageUtils] Preprocessing remote image:', url);

        // Download to temp file
        const fileName = `temp_${Date.now()}.jpg`;
        const localUri = `${FileSystem.cacheDirectory}${fileName}`;
        
        const downloadResult = await FileSystem.downloadAsync(url, localUri);
        if (downloadResult.status !== 200) {
            throw new Error(`Download failed with status: ${downloadResult.status}`);
        }

        // Process with ImageManipulator (resize + compress)
        const result = await ImageManipulator.manipulateAsync(
            downloadResult.uri,
            [{ resize: { width: 1200 } }],
            {
                compress: 0.85,
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true
            }
        );

        // Cleanup temp file
        await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});

        return result.base64 ?? null;
    } catch (error) {
        console.error('[ImageUtils] Remote preprocessing failed:', error);
        return null;
    }
}
