import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { applyMask } from './applyMask.js';

export async function applyMasks(inputImagePath: string) {
    try {
        // Create output directory if it doesn't exist
        await mkdir('output', { recursive: true });

        // Read the input image
        const imageBuffer = await readFile(inputImagePath);
        const inputFileName = inputImagePath.split('/').pop()?.replace('.png', '') || 'image';

        // Get all PNG files from masks directory
        const files = await readdir('masks');
        const maskFiles = files.filter(file => file.endsWith('.png'));

        console.log(`Found ${maskFiles.length} masks to apply`);

        // Process each mask
        for (const maskFile of maskFiles) {
            console.log(`Processing with mask: ${maskFile}...`);

            // Read the mask
            const maskBuffer = await readFile(join('masks', maskFile));

            // Apply the mask
            const resultBuffer = await applyMask(imageBuffer, maskBuffer);

            // Save the result with a name that includes both input and mask
            const outputFileName = `${inputFileName}_${maskFile}`;
            await writeFile(join('output', outputFileName), resultBuffer);
            console.log(`Saved ${outputFileName}`);
        }

        console.log('All masks processed successfully!');
    } catch (error) {
        console.error('Error processing images:', error);
        process.exit(1);
    }
} 