import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cms, site } from '@/utils/constants';
import { downloadImage } from '@/utils/downloadimages';
import { getEnvMode } from '@/utils/getEnvMode';
import { optimizeSvg } from './optimizesvg';
import { convertImage } from './compressImage';

// --- Types ---
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

// --- Main Function ---
export default async function fetchMemberships(): Promise<SupporterData[]> {
  const mode = getEnvMode();
  const folder = './public/support';
  const cachePath = path.join(folder, 'memberships-meta.json');

  await fs.ensureDir(folder);

  // ✅ Use cached data in production/preview
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const meta = await fs.readJSON(cachePath);
      return meta.memberships;
    } else {
      console.warn('⚠️ memberships-meta.json missing in production/preview');
      return [];
    }
  }

  // 🛠 Development/build: fetch from API and cache locally
  try {
    const response = await axios.get<ApiResponse>(`${cms}/api/jasenyydet?populate=kuvake`);
    const supporters = response.data.data;
    const memberships: SupporterData[] = [];

    for (const part of supporters) {
      for (const image of part.kuvake) {
        const filename = `${image.hash}${image.ext}`;
        const url = `${cms}${image.url}`;
        let localPath = await downloadImage(url, filename, 'support');
        const isVector = image.mime === 'image/svg+xml' || image.ext === '.svg';
        if (isVector) {
          const originalPath = `./public/${localPath}`;
          await optimizeSvg(originalPath)
        } else {
          const originalPath = `./public/${localPath}`;
          await convertImage(originalPath, originalPath+".webp", { quality :80, maxWidth: 256, maxHeight :256, format : 'webp'})
          localPath = localPath+".webp"
        }
        memberships.push({
          imgUrl: `${localPath}`,
          link: part.linkki,
          title: part.nimi
        });
      }
    }

    // ✅ Save cache
    await fs.writeJSON(cachePath, { memberships }, { spaces: 2 });

    return memberships;
  } catch (error) {
    console.error('❌ Failed to fetch memberships:', error);
    return [];
  }
}
