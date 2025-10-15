import { rotateAndSquish } from './rotateAndSquish';
import sharp from 'sharp';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { applyMasks } from './applyMasks';

const maskMain = async () => {
    const inputImage = 'image-to-mask.png';

    await applyMasks(inputImage);
}

maskMain();