import sharp from 'sharp';
import fs from 'fs-extra';
import ffmpeg from 'fluent-ffmpeg';

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

  // Validate input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file does not exist: ${inputPath}`);
    return;
  }

  // Validate quality range
  const finalQuality = Math.max(0, Math.min(100, quality));

 
  try {
    let transformer = sharp(inputPath).rotate(); // respects EXIF orientation

    if (maxWidth || maxHeight) {
      transformer = transformer.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside', // maintain aspect ratio
        withoutEnlargement: true,
      });
      console.log(`Resizing to max ${maxWidth || '∞'} x ${maxHeight || '∞'}`);
    }

    // Apply format-specific compression and chroma subsampling
    switch (format) {
      case 'avif':
        transformer = transformer.avif({ quality });
        break;
      case 'jpeg':
        transformer = transformer.jpeg({
          quality: finalQuality,
          chromaSubsampling: '4:2:0', // Enforce 4:2:0 subsampling for JPEG
        });
        break;
      case 'webp':
      default:
        transformer = transformer.webp({
          quality: finalQuality,
          alphaQuality: finalQuality, // Specify alpha quality for transparency if needed
        });
        break;
    }

    console.log(`Converting ${inputPath} to ${format} with quality ${finalQuality}...`);
    await transformer.toFile(outputPath);
    console.log(`✔️ Converted: ${inputPath} → ${outputPath} (${format})`);
  } catch (error) {
    if ( ! inputPath.endsWith(".png")){
      let newInput =  await retryFFMPEG(inputPath)
      if(newInput){
        await convertImage(newInput, outputPath , { quality: quality, maxHeight: maxHeight, maxWidth: maxWidth} )
        fs.removeSync(newInput)
        return
      }
    }
    if (error instanceof Error) {
      console.error(`❌ Failed to convert ${inputPath}: ${error.message}`);
    } else {
      console.error(`❌ Unknown error while processing ${inputPath}`);
    }
  }
}


function retryFFMPEG(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let outputPath = inputPath + ".png";
    try {
      console.log(`🔄 Fallback: Converting with FFmpeg...`);
      ffmpeg(inputPath)
        .output(outputPath)
        .on('end', () => {
          console.log(`✔️ Converted with FFmpeg: ${inputPath} → ${outputPath}`);
          resolve(outputPath); // Resolves after conversion finishes
        })
        .on('error', (ffmpegError: Error) => {
          console.error(`❌ FFmpeg conversion failed: ${ffmpegError.message}`);
          reject(ffmpegError); // Rejects the promise if there is an error
        })
        .run();
    } catch (ffmpegError) {
      console.error(`❌ FFmpeg fallback failed: ${ffmpegError.message}`);
      reject(ffmpegError); // Rejects if an exception is thrown
    }
  });
}