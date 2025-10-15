import fs from 'fs';
import sharp from 'sharp';

/**
 * Configuration for the isometric tile cutter
 */
interface IsometricCutterConfig {
    // Input SVG file path
    inputPath: string;
    // Output PNG file path
    outputPath: string;
    // Number of columns to divide the SVG into (default: 3)
    columns?: number;
    // Number of rows to divide the SVG into (default: 3)
    rows?: number;
    // Background color for the output image (default: transparent)
    background?: { r: number; g: number; b: number; alpha: number };
    // Output format (default: 'png')
    outputFormat?: 'png' | 'jpg' | 'webp';
    // Quality for jpg/webp output (default: 90)
    quality?: number;
    // Scale factor for the output resolution (default: 1)
    scale?: number;
    // Padding between tiles in pixels (default: 0)
    padding?: number;
}

/**
 * Creates a diamond mask for isometric tiles
 */
async function createDiamondMask(width: number, height: number): Promise<Buffer> {
    // Create an SVG diamond shape
    const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}" fill="white" />
    </svg>
    `;

    return await sharp(Buffer.from(svg)).toBuffer();
}

/**
 * Helper function to ensure all values are integers
 */
function ensureIntegerRect(rect: { left: number, top: number, width: number, height: number }) {
    return {
        left: Math.floor(rect.left),
        top: Math.floor(rect.top),
        width: Math.floor(rect.width),
        height: Math.floor(rect.height)
    };
}

/**
 * Cuts an isometric SVG tile into a grid of diamond-shaped tiles and outputs as a single image
 */
export async function cutIsometricTile(config: IsometricCutterConfig): Promise<void> {
    const {
        inputPath,
        outputPath,
        columns = 3,
        rows = 3,
        background = { r: 0, g: 0, b: 0, alpha: 0 },
        outputFormat = 'png',
        quality = 90,
        scale = 1,
        padding = 0
    } = config;

    try {
        // Read SVG file
        const svgBuffer = fs.readFileSync(inputPath);

        // Get original dimensions
        const metadata = await sharp(svgBuffer).metadata();
        const originalWidth = metadata.width || 256;
        const originalHeight = metadata.height || 128;

        // Verify 2:1 aspect ratio for isometric tiles
        if (originalWidth !== originalHeight * 2) {
            console.warn(`Warning: SVG doesn't have 2:1 aspect ratio (${originalWidth}x${originalHeight})`);
        }

        // Calculate base tile dimensions

        const baseTileWidth = Math.floor(originalWidth / columns);
        const baseTileHeight = Math.floor(originalHeight / rows);

        // Debug info
        console.log(`Original dimensions: ${originalWidth}x${originalHeight}`);
        console.log(`Base tile dimensions: ${baseTileWidth}x${baseTileHeight}`);

        // Define extraction rectangles using a staggered row approach for isometric layout
        // This follows the 5-row pattern:
        //      1
        //     1 1
        //    1 1 1
        //     1 1
        //      1
        const extractionRects = [
            // Row 1 (1 tile)
            { left: baseTileWidth, top: 0, width: baseTileWidth, height: baseTileHeight },               // Top

            // Row 2 (2 tiles)
            { left: baseTileWidth / 2, top: Math.floor(baseTileHeight / 2), width: baseTileWidth, height: baseTileHeight },          // Top-Left
            { left: Math.floor(baseTileWidth * 3 / 2), top: Math.floor(baseTileHeight / 2), width: baseTileWidth, height: baseTileHeight }, // Top-Right

            // Row 3 (3 tiles)
            { left: 0, top: baseTileHeight, width: baseTileWidth, height: baseTileHeight },              // Left
            { left: baseTileWidth, top: baseTileHeight, width: baseTileWidth, height: baseTileHeight },  // Center
            { left: baseTileWidth * 2, top: baseTileHeight, width: baseTileWidth, height: baseTileHeight }, // Right

            // Row 4 (2 tiles)
            { left: baseTileWidth / 2, top: Math.floor(baseTileHeight * 3 / 2), width: baseTileWidth, height: baseTileHeight },          // Bottom-Left
            { left: Math.floor(baseTileWidth * 3 / 2), top: Math.floor(baseTileHeight * 3 / 2), width: baseTileWidth, height: baseTileHeight }, // Bottom-Right

            // Row 5 (1 tile)
            { left: baseTileWidth, top: baseTileHeight * 2, width: baseTileWidth, height: baseTileHeight }  // Bottom
        ].map(ensureIntegerRect);

        // Create an array to store the diamond tiles
        const tiles: Buffer[] = [];

        // Extract each tile using the staggered layout extraction rectangles
        for (let i = 0; i < extractionRects.length; i++) {
            const rect = extractionRects[i];
            console.log(`Extracting tile ${i} using rectangle:`, rect);

            // Create a diamond mask that matches the extraction size
            const diamondMask = await createDiamondMask(rect.width, rect.height);

            try {
                // Extract the tile
                const extractedTile = await sharp(svgBuffer)
                    .extract(rect);

                // Apply the diamond mask
                const maskedTile = await extractedTile
                    .composite([{ input: diamondMask, blend: 'dest-in' }]);

                // Resize if needed and convert to buffer
                const finalTile = await maskedTile
                    .resize(Math.round(rect.width * scale))
                    .ensureAlpha()
                    .toBuffer();

                tiles.push(finalTile);
            } catch (error) {
                console.error(`Error processing tile ${i}:`, error);
                // Create an empty transparent tile as a fallback
                const emptyTile = await sharp({
                    create: {
                        width: rect.width,
                        height: rect.height,
                        channels: 4,
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    }
                })
                    .resize(Math.round(rect.width * scale))
                    .toBuffer();

                tiles.push(emptyTile);
            }
        }

        console.log(`Created ${tiles.length} diamond tiles`);

        // Calculate output dimensions with padding and scaling
        const scaledTileWidth = Math.round(baseTileWidth * scale);
        const scaledTileHeight = Math.round(baseTileHeight * scale);
        const outputWidth = (scaledTileWidth * columns) + (padding * (columns - 1));
        const outputHeight = (scaledTileHeight * rows) + (padding * (rows - 1));

        // Create input objects for the composite operation
        const compositeInputs = tiles.map((tile, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            const x = col * (scaledTileWidth + padding);
            const y = row * (scaledTileHeight + padding);

            return {
                input: tile,
                left: x,
                top: y
            };
        });

        // Set up the output image pipeline
        const outputImage = sharp({
            create: {
                width: outputWidth,
                height: outputHeight,
                channels: 4,
                background
            }
        }).composite(compositeInputs);

        // Select output format
        switch (outputFormat) {
            case 'jpg':
                await outputImage.jpeg({ quality }).toFile(outputPath);
                break;
            case 'webp':
                await outputImage.webp({ quality }).toFile(outputPath);
                break;
            case 'png':
            default:
                await outputImage.png().toFile(outputPath);
        }

        console.log(`Successfully processed SVG and saved to ${outputPath}`);
    } catch (error) {
        console.error('Error processing SVG:', error);
        throw error;
    }
}

/**
 * Helper function to generate a grid of frames from a single isometric tile
 */
export async function processIsometricTile(
    inputPath: string,
    outputPath: string,
    options: Partial<IsometricCutterConfig> = {}
): Promise<void> {
    return cutIsometricTile({
        inputPath,
        outputPath,
        ...options
    });
} 