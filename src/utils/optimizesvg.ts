import { optimize as svgoOptimize } from 'svgo';
import fs from 'fs-extra';

export async function optimizeSvg(originalPath: string){

    try {
        const svgContent = await fs.readFile(originalPath, 'utf-8');
        const result = svgoOptimize(svgContent, {
            path: originalPath,
            multipass: true,
    });
        await fs.writeFile(originalPath, result.data, 'utf-8');
        console.log(`✅ SVG optimized and saved: ${originalPath}`);
    } catch (error) {
        console.warn(`⚠️ Failed to optimize SVG ${originalPath}:`, error);
    }
}