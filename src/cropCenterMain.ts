import { cropCenter } from './cropCenter';
import path from 'path';
import fs from 'fs/promises';

async function main() {
    // Hardcoded values
    const inputFolder = 'images-to-crop';
    const outputFolder = 'crop-result';
    const percentage = 50;

    try {
        // Create output folder if it doesn't exist
        await fs.mkdir(outputFolder, { recursive: true });

        // Get all files from input folder
        const files = await fs.readdir(inputFolder);

        // Filter for image files (you can add more extensions if needed)
        const imageFiles = files.filter(file =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );

        if (imageFiles.length === 0) {
            console.error(`No image files found in ${inputFolder}`);
            process.exit(1);
        }

        console.log(`Found ${imageFiles.length} images to process`);

        // Process each image
        for (const file of imageFiles) {
            const inputPath = path.join(inputFolder, file);
            const outputPath = path.join(outputFolder, file);

            console.log(`Processing: ${file}`);
            await cropCenter(inputPath, percentage, outputPath);
            console.log(`Saved: ${file}`);
        }

        console.log(`\nAll images processed successfully!`);
        console.log(`Results saved to: ${path.resolve(outputFolder)}`);
    } catch (error) {
        console.error('Error processing images:', error);
        process.exit(1);
    }
}

main(); 