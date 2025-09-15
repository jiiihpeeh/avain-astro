import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { downloadImage } from '@/utils/downloadimages';
import { cms, site } from '@/utils/constants';
import { getEnvMode } from '@/utils/getEnvMode';
import { optimize as svgoOptimize } from 'svgo';
import { convertImage } from './compressImage';
import { optimizeSvg } from './optimizesvg';

interface Graphic {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: any;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface GraphicItem {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  grafiikka: Graphic[];
}

interface GraphicsResponse {
  data: GraphicItem[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface ImageData {
  url: string;
  alt: string;
}

export default async function fetchBackgroundGraphics(): Promise<ImageData[]> {
  const mode = getEnvMode();
  const folder = './public/background';
  const cachePath = path.join(folder, 'background-meta.json');

  await fs.ensureDir(folder);

  // 🚀 In production/preview mode, read from disk only
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const cached = await fs.readJSON(cachePath);
      return cached.backgroundGraphics;
    } else {
      console.warn('⚠️ background-meta.json missing in production/preview!');
      return [];
    }
  }

  // 🛠 Development/build mode — fetch from API
  try {
    const response = await axios.get<GraphicsResponse>(`${cms}/api/taustat?populate=grafiikka`);
    const items = response.data.data;

    if (!items.length) return [];

    const graphics = items[0].grafiikka;
    const backgroundGraphics = await Promise.all(
      graphics.map(async (graphic): Promise<ImageData> => {
        console.log("📦 Processing graphic:", graphic);

        const fileUrl = `${cms}${graphic.url}`;
        const filename = `${graphic.hash}${graphic.ext}`;
        console.log(`🔗 Downloading image from: ${fileUrl}`);
        console.log(`📁 Saving as: ${filename}`);

        const localPath = await downloadImage(fileUrl, filename, 'background');
        const originalPath = `./public/${localPath}`;
        const fullOriginalPath = path.resolve(originalPath);

        console.log(`📍 Local path: ${localPath}`);
        console.log(`📍 Original path: ${originalPath}`);
        console.log(`📍 Resolved full path: ${fullOriginalPath}`);

        // Check if vector (SVG)
        const isVector = graphic.mime === 'image/svg+xml' || graphic.ext === '.svg';
        console.log(`🧠 Is vector: ${isVector}`);

        let finalUrlPath = localPath; // default fallback

        if (isVector) {
          console.log(`🧽 Optimizing SVG: ${originalPath}`);
          await optimizeSvg(originalPath);
        } else {
          const parsedPath = path.parse(fullOriginalPath);
          const renamedFilename = `${parsedPath.name}_bitmap${parsedPath.ext}`;
          const renamedFullPath = path.join(parsedPath.dir, renamedFilename);

          console.log(`📄 Parsed path:`, parsedPath);
          console.log(`🔀 Renaming to: ${renamedFullPath}`);

          try {
            await fs.rename(fullOriginalPath, renamedFullPath);
            console.log("🖼️ Bitmap ", fullOriginalPath, " renamed to: ", renamedFullPath);

            // Relative path for web use
            const renamedRelativePath = path
              .join(path.dirname(localPath), renamedFilename)
              .replace(/\\/g, '/');
            console.log(`🌐 Renamed relative path: ${renamedRelativePath}`);

            // WebP conversion naming
            const renamedParsed = path.parse(renamedFullPath);
            const webpFilename = `${renamedParsed.name}.webp`.toLowerCase();
            const webpOutputPath = path
              .join(path.dirname(localPath), webpFilename)
              .replace(/\\/g, '/');
            const webpScaledFile = path
              .join(path.dirname(renamedFullPath), webpFilename)
              .replace(/\\/g, '/');
            const resolvedPath = path.resolve(webpScaledFile);

            console.log(`📎 WebP filename: ${webpFilename}`);
            console.log(`🧭 WebP output path: ${webpOutputPath}`);
            console.log("🔍 Checking for WebP file:", resolvedPath);

            // Assume we always need to convert (or you could check existence)
            console.warn("❌ WebP not found, converting:", webpScaledFile);
            console.log("convertImage ", renamedFullPath, webpScaledFile)
            await convertImage(renamedFullPath, fullOriginalPath, {
              quality: 80,
              maxWidth: 250,
              maxHeight: 250,
            });

            console.log("✅ Converted to WebP:", webpScaledFile);

            // Set final path to WebP for web use
            finalUrlPath = localPath;

          } catch (err) {
            console.error(`❌ Failed to process bitmap image ${fullOriginalPath}:`, err);
          }
        }

        return {
          url: `${finalUrlPath}`,
          alt: graphic.alternativeText || graphic.name,
        };
      })
    );

    await fs.writeJSON(cachePath, { backgroundGraphics }, { spaces: 2 });

    return backgroundGraphics;
  } catch (error) {
    console.error('❌ Failed to fetch or process background graphics:', error);
    return [];
  }
}
