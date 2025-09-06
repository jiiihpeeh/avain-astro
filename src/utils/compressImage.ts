import sharp from 'sharp';

interface ConvertImageOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'avif' | 'jpeg';
}

/**
 * Compress and convert an image to WebP, AVIF, or JPEG, preserving aspect ratio and rotation.
 *
 * @param inputPath - Path to the original image.
 * @param outputPath - Where to save the converted image.
 * @param options - Quality, size, and output format options.
 */
export async function convertImage(
  inputPath: string,
  outputPath: string,
  options: ConvertImageOptions = {}
): Promise<void> {
  const {
    quality = 80,
    maxWidth,
    maxHeight,
    format = 'webp',
  } = options;

  try {
    let transformer = sharp(inputPath).rotate(); // respects EXIF orientation

    if (maxWidth || maxHeight) {
      transformer = transformer.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside', // maintain aspect ratio
        withoutEnlargement: true,
      });
    }

    // Apply format-specific compression
    switch (format) {
      case 'avif':
        transformer = transformer.avif({ quality });
        break;
      case 'jpeg':
        transformer = transformer.jpeg({ quality });
        break;
      case 'webp':
      default:
        transformer = transformer.webp({ quality });
        break;
    }

    await transformer.toFile(outputPath);
    console.log(`✔️ Converted: ${inputPath} → ${outputPath} (${format})`);
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath}:`, error);
  }
}