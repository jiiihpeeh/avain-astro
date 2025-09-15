import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cms, site } from '@/utils/constants';
import { downloadImage } from '@/utils/downloadimages';
import { getEnvMode } from '@/utils/getEnvMode';
import { optimizeSvg } from './optimizesvg';
import { convertImage } from './compressImage';

interface Image {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number;
  height: number;
  formats: null | object;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface PartnerOrSupporter {
  id: number;
  documentId: string;
  nimi: string;
  linkki: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  kuvake: Array<Image>;
}

interface ApiResponse {
  data: PartnerOrSupporter[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface SupporterData {
  imgUrl: string;
  title: string;
  link: string;
}

export default async function fetchSupporters(): Promise<SupporterData[]> {
  const mode = getEnvMode();
  const folder = './public/support';
  const cachePath = path.join(folder, 'supporters-meta.json');

  await fs.ensureDir(folder);

  // 📦 Use cached data in production or preview
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const meta = await fs.readJSON(cachePath);
      //console.log("read from disk")
      return meta.supporters;
    } else {
      console.warn('⚠️ supporters-meta.json missing in production/preview');
      return [];
    }
  }

  // 🛠️ Development or build — fetch fresh from API
  try {
    const response = await axios.get<ApiResponse>(`${cms}/api/tukijat?populate=kuvake`);
    const supporters = response.data.data;

    const supporterData: SupporterData[] = [];

    for (const part of supporters) {
      for (const im of part.kuvake) {
        const filename = `${im.hash}${im.ext}`;
        const url = `${cms}${im.url}`;
        let localPath = await downloadImage(url, filename, 'support');
        const isVector = im.mime === 'image/svg+xml' || im.ext === '.svg';
        if (isVector) {
          const originalPath = `./public/${localPath}`;
          await optimizeSvg(originalPath)
        } else {
          const originalPath = `./public/${localPath}`;
          await convertImage(originalPath, originalPath+".webp", { quality :256, maxWidth: 256, maxHeight :80, format : 'webp'})
          localPath = localPath+".webp"
        }
        supporterData.push({
          imgUrl: `${localPath}`,
          link: part.linkki,
          title: part.nimi
        });
      }
    }

    // ✅ Write cache
    await fs.writeJSON(cachePath, { supporters: supporterData }, { spaces: 2 });

    return supporterData;
  } catch (error) {
    console.error('❌ Error fetching supporters:', error);
    return [];
  }
}
