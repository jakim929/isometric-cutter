import sharp from 'sharp';

/**
 * Crops a square image from the center of the input image using Sharp
 * @param imagePath The path to the input image
 * @param percentage The percentage of the original image size to keep (0-100)
 * @param outputPath The path where the cropped image should be saved
 * @returns A Promise that resolves when the image is processed
 */
export async function cropCenter(
    imagePath: string,
    percentage: number,
    outputPath: string
): Promise<void> {
    if (percentage <= 0 || percentage > 100) {
        throw new Error('Percentage must be between 0 and 100');
    }

    // Get image metadata to determine dimensions
    const metadata = await sharp(imagePath).metadata();
    const originalSize = Math.min(metadata.width || 0, metadata.height || 0);
    const newSize = Math.floor(originalSize * (percentage / 100));

    // Calculate the starting position to center the crop
    const left = Math.floor(((metadata.width || 0) - newSize) / 2);
    const top = Math.floor(((metadata.height || 0) - newSize) / 2);

    // Process the image
    await sharp(imagePath)
        .extract({
            left,
            top,
            width: newSize,
            height: newSize
        })
        .toFile(outputPath);
}
