import sharp from 'sharp';

/**
 * Applies a mask to an image, where white areas show the image and black areas become transparent
 * @param imageBuffer - The input image buffer
 * @param maskBuffer - The mask buffer (white areas show image, black areas become transparent)
 * @returns Promise<Buffer> - The resulting image buffer with mask applied
 */
export async function applyMask(
    imageBuffer: Buffer,
    maskBuffer: Buffer
): Promise<Buffer> {
    try {
        // Get dimensions of both image and mask
        const imageMetadata = await sharp(imageBuffer).metadata();
        const maskMetadata = await sharp(maskBuffer).metadata();

        if (!imageMetadata.width || !imageMetadata.height || !maskMetadata.width || !maskMetadata.height) {
            throw new Error('Could not determine dimensions');
        }

        // Check aspect ratio (with small tolerance for rounding)
        const imageAspectRatio = imageMetadata.width / imageMetadata.height;
        const maskAspectRatio = maskMetadata.width / maskMetadata.height;
        const aspectTolerance = 0.01;  // 1% tolerance

        if (Math.abs(imageAspectRatio - maskAspectRatio) > aspectTolerance) {
            throw new Error(
                `Aspect ratio mismatch: Image (${imageMetadata.width}x${imageMetadata.height}, ratio: ${imageAspectRatio.toFixed(3)}) ` +
                `vs Mask (${maskMetadata.width}x${maskMetadata.height}, ratio: ${maskAspectRatio.toFixed(3)})`
            );
        }

        // Process the mask to match the image dimensions and convert to grayscale
        const processedMask = await sharp(maskBuffer)
            .resize(imageMetadata.width, imageMetadata.height, {
                fit: 'fill',
                kernel: 'lanczos3'  // High-quality scaling
            })
            .grayscale()
            .toColourspace('b-w')
            .toBuffer();

        // Extract RGB channels from the input image
        const rgbImage = await sharp(imageBuffer)
            .removeAlpha()
            .toBuffer();

        // Create final image with the mask as alpha channel
        return await sharp(rgbImage)
            .joinChannel(processedMask)
            .toBuffer();

    } catch (error) {
        console.error('Error in applyMask:', error);
        throw error;
    }
}
