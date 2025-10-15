import { rotateAndSquish } from './rotateAndSquish';
import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join } from 'path';

async function main() {
    try {
        const preprocessedDir = './preprocessed';
        const processedDir = './processed';

        // Get all PNG files from preprocessed directory
        const files = await readdir(preprocessedDir);
        const pngFiles = files.filter(file => file.endsWith('.png'));

        console.log(`Found ${pngFiles.length} files to process`);

        for (const file of pngFiles) {
            console.log(`Processing ${file}...`);
            const inputPath = join(preprocessedDir, file);
            const outputPath = join(processedDir, file);

            // Load the image and ensure it has an alpha channel
            const image = await sharp(inputPath).ensureAlpha();

            // Process the image
            const processed = await rotateAndSquish(image);

            // Save with PNG format to preserve transparency
            await processed.png().toFile(outputPath);
            console.log(`Completed processing ${file}`);
        }

        console.log('All files processed successfully!');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the main function
main();
