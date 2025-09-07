import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import { convertImage } from '@/utils/compressImage';
import { cms, site } from '@/utils/constants';
import { getEnvMode } from '@/utils/getEnvMode';

interface ImageData {
  hash: string;
  ext: string;
  url: string;
}

interface KuvaItem {
  kuvaus: string | null;
  kuva: ImageData | null;
}

interface Osa {
  Nimi: string;
  kuva: KuvaItem[];
}

interface Galleria {
  osat: Osa[];
}

interface GalleriaResponse {
  data: Galleria[];
}

export interface ImgInfo {
  original: string;
  thumbnail: string;
  description: string;
  type: 'image' | 'video';
}

export interface BaseGallery {
  description: string;
  images: ImgInfo[];
}

export type Galleries = BaseGallery[];

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

async function convertToWebM(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-c:v libvpx-vp9',      // VP9 video codec
        '-b:v 1.0M',            // target bitrate (adjust as needed)
        '-vf scale=-1:720',     // scale to 720p, preserve aspect ratio
        '-c:a libopus',         // Opus audio codec
        '-b:a 128k',            // audio bitrate
        '-threads 3',           // multi-threaded encoding
        '-row-mt 1',            // enable row-based multithreading (VP9-specific)
        '-deadline good',       // quality/speed tradeoff: good | best | realtime
        '-cpu-used 2',          // higher = faster, lower = better quality (0–6)
        '-tile-columns 4',      // enables parallel decoding (improves seek performance)
        '-frame-parallel 1',    // frame-based parallel decode
        '-auto-alt-ref 1',      // enable alternate reference frames (better compression)
        '-lag-in-frames 25',    // buffer frames for better quality compression
      ])
      .on('end', () => {
        console.log(`✅ Converted video to WebM (720p): ${outputPath}`);
        resolve();
      })
      .on('error', (err: any) => {
        console.error('❌ ffmpeg error:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

async function generateVideoThumbnail(
  inputPath: string,
  thumbnailPath: string,
  timeInSeconds = 1
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Temporary PNG thumbnail path
    const pngThumbnailPath = path.join(
      path.dirname(thumbnailPath),
      path.basename(thumbnailPath, '.webp') + '.png'
    );

    ffmpeg(inputPath)
      .screenshots({
        timestamps: [timeInSeconds],
        filename: path.basename(pngThumbnailPath),
        folder: path.dirname(pngThumbnailPath),
        size: '240x?',  // width 320px, height auto to keep aspect ratio
      })
      .on('end', async () => {
        try {
          // Convert the PNG screenshot to WebP using ffmpeg
          await new Promise((res, rej) => {
            ffmpeg(pngThumbnailPath)
              .outputOptions([
                '-vcodec', 'libwebp',
                '-lossless', '0',
                '-qscale', '75',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
              ])
              .on('end', async () => {
                await fs.remove(pngThumbnailPath);
                console.log(`✅ Converted thumbnail to WebP: ${thumbnailPath}`);
                res(null);
              })
              .on('error', (err) => {
                console.error('❌ WebP conversion error:', err);
                rej(err);
              })
              .save(thumbnailPath);
          });

          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        console.error('❌ Thumbnail generation error:', err);
        reject(err);
      });
  });
}

export default async function fetchGallery(): Promise<Galleries> {
  const mode = getEnvMode();
  const cacheDir = './public/gallery';
  const cachePath = path.join(cacheDir, 'galleryData.json');
  const thumbSize = 240;
  const maxWidth = 2200;
  const maxHeight = 1800;

  await fs.ensureDir(cacheDir);

  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const cached = await fs.readJSON(cachePath);
      return cached;
    } else {
      console.warn('⚠️ galleryData.json missing in production/preview!');
      return [];
    }
  }

  const galleryData: Galleries = [];

  try {
    const response = await axios.get<GalleriaResponse>(
      `${cms}/api/galleriat?populate[osat][populate][kuva][populate]=*`
    );

    for (const galleria of response.data.data) {
      for (const osa of galleria.osat) {
        const galleryEntry: BaseGallery = {
          description: osa.Nimi,
          images: [],
        };

        for (const kuvaItem of osa.kuva) {
          const file = kuvaItem.kuva;
          if (!file || !file.url) continue;

          const fileUrl = `${cms}${file.url}`;
          const filename = `${file.hash}${file.ext}`;
          const baseName = path.join(cacheDir, file.hash);
          const fullFilePath = path.join(cacheDir, filename);
          const isVideo = VIDEO_EXTENSIONS.includes(file.ext.toLowerCase());
          console.log(fullFilePath)

          if (!fs.existsSync(fullFilePath)) {
            const fileRes = await axios.get<ArrayBuffer>(fileUrl, {
              responseType: 'arraybuffer',
            });
            await fs.writeFile(fullFilePath, Buffer.from(fileRes.data));
            console.log(`✅ Downloaded: ${fullFilePath}`);
          }

          if (isVideo) {
            const webmPath = `${baseName}.webm`;
            const thumbnailPath = `${baseName}_thumb.webp`;

            if (!fs.existsSync(webmPath)) {
              await convertToWebM(fullFilePath, webmPath);
            }

            if (!fs.existsSync(thumbnailPath)) {
              await generateVideoThumbnail(fullFilePath, thumbnailPath);
            }

            galleryEntry.images.push({
              original: publicUrl(webmPath),
              thumbnail: publicUrl(thumbnailPath),
              description: kuvaItem.kuvaus ?? '',
              type: 'video',
            });
          } else {
            const variants = {
              webp: {
                view: `${baseName}_img.webp`,
                thumb: `${baseName}_thumb.webp`,
              },
              avif: {
                view: `${baseName}_img.avif`,
                thumb: `${baseName}_thumb.avif`,
              },
              jpeg: {
                view: `${baseName}_img.jpg`,
                thumb: `${baseName}_thumb.jpg`,
              },
            };

            const qualitySettings = {
              webp: { view: 85, thumb: 70 },
              jpeg: { view: 90, thumb: 75 },
              avif: { view: 60, thumb: 40 },
            };

            for (const [format, paths] of Object.entries(variants)) {
              const q = qualitySettings[format as keyof typeof qualitySettings];

              if (!fs.existsSync(paths.view)) {
                await convertImage(fullFilePath, paths.view, {
                  format: format as 'webp' | 'jpeg' | 'avif',
                  quality: q.view,
                  maxWidth,
                  maxHeight,
                });
              }

              if (!fs.existsSync(paths.thumb)) {
                await convertImage(fullFilePath, paths.thumb, {
                  format: format as 'webp' | 'jpeg' | 'avif',
                  quality: q.thumb,
                  maxWidth: thumbSize,
                  maxHeight: thumbSize,
                });
              }
            }

            galleryEntry.images.push({
              original: publicUrl(variants.webp.view),
              thumbnail: publicUrl(variants.webp.thumb),
              description: kuvaItem.kuvaus ?? '',
              type: 'image',
            });
          }
        }

        if (galleryEntry.images.length > 0) {
          galleryData.push(galleryEntry);
        }
      }
    }

    await fs.writeJson(cachePath, galleryData, { spaces: 2 });
    console.log('🎉 Gallery data fetched and cached.');

    return galleryData;
  } catch (err) {
    console.error('❌ Failed to fetch or process gallery:', err);
    return [];
  }

  function publicUrl(filepath: string): string {
    return `${filepath.replace(/^public\//, '').replace(/\.[a-z0-9]+$/i, '')}`;
  }
  function publicUrlVid(filepath: string): string {
    return `${filepath.replace(/^public\//, '')}`;
  }
}
