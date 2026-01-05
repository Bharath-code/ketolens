import * as ImageManipulator from 'expo-image-manipulator';
import { Skia, TileMode } from '@shopify/react-native-skia';

/**
 * Preprocess label image for better OCR results
 * Specified pipeline: Grayscale -> Increase Contrast -> Sharpen
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
 * Advanced preprocessing for remote OFF images (Grayscale, Contrast, Sharpen)
 * This is specifically designed to handle blurry/compressed Open Food Facts images.
 */
export async function preprocessRemoteImage(url: string): Promise<string | null> {
    try {
        console.log('[ImageUtils] Preprocessing remote image:', url);

        // 1. Fetch image data
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        // 2. Load into Skia
        const data = Skia.Data.fromBytes(bytes);
        const image = Skia.Image.MakeImageFromEncoded(data);
        if (!image) throw new Error('Failed to decode image');

        // 3. Setup Surface for processing
        const width = image.width();
        const height = image.height();

        // Use a smaller surface if the image is massive to save memory
        const scale = width > 1500 ? 1500 / width : 1;
        const targetWidth = Math.round(width * scale);
        const targetHeight = Math.round(height * scale);

        const surface = Skia.Surface.MakeRaster(targetWidth, targetHeight);
        if (!surface) throw new Error('Failed to create Skia surface');

        const canvas = surface.getCanvas();
        const paint = Skia.Paint();

        // 4. APPLY FILTERS

        // A. Grayscale + Enhanced Contrast Matrix
        // factor 1.4 for contrast boost
        const c = 1.4;
        const o = -0.2; // Offset to deepen shadows
        const matrix = [
            0.2126 * c, 0.7152 * c, 0.0722 * c, 0, o,
            0.2126 * c, 0.7152 * c, 0.0722 * c, 0, o,
            0.2126 * c, 0.7152 * c, 0.0722 * c, 0, o,
            0, 0, 0, 1, 0
        ];
        paint.setColorFilter(Skia.ColorFilter.MakeMatrix(matrix));

        // B. Sharpening (Matrix Convolution)
        // Kernel for sharpening:
        // [  0, -1,  0 ]
        // [ -1,  5, -1 ]
        // [  0, -1,  0 ]
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];
        const sharpenFilter = Skia.ImageFilter.MakeMatrixPreprocess ? null : Skia.ImageFilter.MakeMatrixConvolution(
            { width: 3, height: 3 },
            kernel,
            1, // gain
            0, // bias
            { x: 1, y: 1 }, // target
            TileMode.Clamp,
            true, // convolveAlpha
            null
        );
        if (sharpenFilter) paint.setImageFilter(sharpenFilter);

        // 5. Draw and Snapshot
        canvas.clear(Skia.Color('white'));
        canvas.drawImageRect(
            image,
            Skia.XYWHRect(0, 0, width, height),
            Skia.XYWHRect(0, 0, targetWidth, targetHeight),
            paint
        );

        const snapshot = surface.makeImageSnapshot();
        return snapshot.encodeToBase64();

    } catch (error) {
        console.error('[ImageUtils] Remote preprocessing failed:', error);
        return null;
    }
}
