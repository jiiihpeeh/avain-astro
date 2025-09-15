import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cms } from '@/utils/constants';
import { downloadImage } from '@/utils/downloadimages';
import { getEnvMode } from '@/utils/getEnvMode';
import { optimizeSvg } from './optimizesvg';
import { convertImage } from './compressImage';

interface Logo {
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

interface Page {
  nimi: string;
  sivu: string;
}

interface SupporterData {
  id: number;
  documentId: string;
  sivut: Page[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  logo: Logo;
}

interface ApiResponse {
  data: SupporterData[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface NavbarData {
  sivut: Page[];
  logoUrl: string;
}

const cacheFolder = './public/navbar';
const cacheFile = path.join(cacheFolder, 'navbar-data.json');

export default async function fetchNavbarData(): Promise<NavbarData> {
  const mode = getEnvMode();

  await fs.ensureDir(cacheFolder);

  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cacheFile)) {
      const cached = await fs.readJSON(cacheFile);
      return cached;
    } else {
      console.warn('⚠️ navbar-data.json missing in production/preview mode');
      return { sivut: [], logoUrl: '' };
    }
  }

  // Development/build: fetch fresh and cache
  try {
    const response = await axios.get<ApiResponse>(`${cms}/api/navigaatiot?populate=logo`);
    const data = response.data;

    if (!data.data.length) {
      return { sivut: [], logoUrl: '' };
    }

    const firstItem = data.data[0];
    const sivut = firstItem.sivut;
    const logo = firstItem.logo;
    const isVector = logo.mime === 'image/svg+xml' || logo.ext === '.svg';


    // Download logo image and get local path
    const fileName = `${logo.hash}${logo.ext}`;
    let logoUrl = await downloadImage(`${cms}${logo.url}`, fileName, 'navbar');
    if (isVector) {
      const originalPath = `./public/${logoUrl}`;
      await optimizeSvg(originalPath)
      const stats = fs.statSync(originalPath)
      if (stats.size < 21*1024){
        const mimeType = 'image/svg+xml'; // or 'image/jpeg', 'image/svg+xml', etc.

        const imageBuffer = fs.readFileSync(originalPath);
        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        logoUrl = dataUrl
      }
    } else {
      const originalPath = `./public/${logoUrl}`;
      await convertImage(originalPath, originalPath+".webp", { quality :82, maxWidth: 100, maxHeight :100, format : 'webp'})
      logoUrl = logoUrl+".webp"
    }
    const result = { sivut, logoUrl };

    // Cache to disk
    await fs.writeJSON(cacheFile, result, { spaces: 2 });

    return result;
  } catch (error) {
    console.error('❌ Failed to fetch navbar data:', error);
    return { sivut: [], logoUrl: '' };
  }
}
