import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { optimize as svgoOptimize } from 'svgo';
import { cms, site } from '@/utils/constants';
import { downloadImage } from '@/utils/downloadimages';
import { getEnvMode } from '@/utils/getEnvMode';

// --- Types ---
interface Logo {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: null | any;
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

interface Info {
  id: number;
  title: string;
  description: string;
}

interface IndexData {
  id: number;
  documentId: string;
  otsikko: string;
  kuvaus: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  tavoitteet: string;
  otsikkoTavoitteet: string;
  tyopaja: string;
  tyopajatoiminta: string;
  yksilovalmennus: string;
  yksilovalmennuskuvaus: string;
  info: Info[];
  logo: Logo;
}

interface ApiResponse {
  data: IndexData[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// --- Function ---
export default async function fetchLogoImage(): Promise<string> {
  const mode = getEnvMode();
  const folder = './public/logo';
  const cachePath = path.join(folder, 'logo-meta.json');

  await fs.ensureDir(folder);

  // ✅ Use cache in production/preview
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const meta = await fs.readJSON(cachePath);
      return meta.logoUrl;
    } else {
      console.warn('⚠️ logo-meta.json missing in production/preview');
      return '';
    }
  }

  // 🛠 Fetch from API and cache in dev/build
  try {
    const response = await axios.get<ApiResponse>(`${cms}/api/tervetuloas?populate=logo`);
    const data = response.data.data[0];
    const logo = data?.logo;

    if (!logo || !logo.url || !logo.hash || !logo.ext) {
      console.warn('⚠️ Logo data is missing or incomplete');
      return '';
    }

    const ext = logo.ext.toLowerCase();
    const filename = `${logo.hash}${ext}`;
    const localPath = await downloadImage(`${cms}${logo.url}`, filename, 'logo');
    const filePath = `./public/${localPath}`

    let logoUrl: string;

    // SVG: optimize with svgo
    if (ext === '.svg') {
      const svgOutputPath = path.join(folder, `${logo.hash}.svg`);
      const svgContent = await fs.readFile(filePath, 'utf-8');

      const result = svgoOptimize(svgContent, {
        path: filePath,
        multipass: true,
      });

      // if (result.error) {
      //   console.error('❌ SVGO failed:', result.error);
      //   return '';
      // }

      await fs.writeFile(svgOutputPath, result.data, 'utf-8');
      logoUrl = `${site}logo/${logo.hash}.svg`;

      console.log(`✅ SVG optimized and saved: ${svgOutputPath}`);
    } else {
      // Raster image: convert to WebP
      const isLossless = ['.png', '.bmp', '.tiff'].includes(ext);
      const outputWebpPath = path.join(folder, `${logo.hash}.webp`);
      const publicWebpPath = `/logo/${logo.hash}.webp`;

      try {
	      console.log(filePath)
        const image = sharp(filePath).resize(512);

        await image
          .webp({
            lossless: isLossless,
            quality: isLossless ? undefined : 80,
          })
          .toFile(outputWebpPath);

        logoUrl = `${site}${publicWebpPath}`;
        console.log(`✅ Raster logo converted to WebP: ${outputWebpPath}`);
      } catch (err) {
        console.error('❌ Error processing raster image:', err);
        return '';
      }
    }

    // ✅ Cache the result
    await fs.writeJSON(cachePath, { logoUrl }, { spaces: 2 });
    console.log("🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠🧠logo PAth ", filePath)
    try {
      console.log("trying logo b64")
      const stats = fs.statSync(filePath)
      
  
      if (stats.size < 21*1024){
        console.log("filesize works")
        const imageBuffer = await fs.readFile(filePath, 'utf-8')
        console.log("file read", imageBuffer)

        if (imageBuffer.trim().endsWith('/svg>')) {
                          console.log("file is svg")

          const mimeType = 'image/svg+xml';
          const base64Image = Buffer.from(imageBuffer).toString('base64');
          console.log("base64 formed")
          const logoUrl = `data:${mimeType};base64,${base64Image}`;
              // ✅ Cache the result
          await fs.writeJSON(cachePath, {logoUrl }, { spaces: 2 });
          return logoUrl;
        }  
      }
    } catch (err) {
        console.error('❌ Error processing raster image:', err);
        return '';
      }
    
    return logoUrl;
  } catch (err) {
    console.error('❌ Failed to fetch or process logo image:', err);
    return '';
  }
}
