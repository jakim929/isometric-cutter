import sharp from 'sharp';

export const rotateAndSquish = async (image: sharp.Sharp) => {
    // First ensure the image has an alpha channel
    const withAlpha = await image.ensureAlpha();

    // Rotate the image with background set to transparent
    const rotated = await withAlpha.rotate(45, {
        background: { r: 0, g: 0, b: 0, alpha: 0 }
    });

    // Get the dimensions after rotation
    const metadata = await rotated.metadata();
    const width = metadata.width || 0;

    // Then resize to half height while preserving transparency
    return rotated.resize(width, Math.floor(width / 2), {
        fit: 'fill',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
};

