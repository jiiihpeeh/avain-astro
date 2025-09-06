import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cms, site } from '@/utils/constants';
import { downloadImage } from '@/utils/downloadimages';
import { getEnvMode } from '@/utils/getEnvMode';
import { optimizeSvg } from './optimizesvg';

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

interface SocialMediaEntry {
  id: number;
  documentId: string;
  linkki: string;
  kuvaus: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  kuvake: Image;
}

interface ApiResponse {
  data: SocialMediaEntry[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface Some {
  iconUrl: string;
  url: string;
}

export default async function fetchSocialMedia(): Promise<Some[]> {
  const mode = getEnvMode();
  const folder = './public/some';
  const cachePath = path.join(folder, 'some-meta.json');

  await fs.ensureDir(folder);

  // ✅ Production/preview mode: use cached file
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const meta = await fs.readJSON(cachePath);
      return meta.some;
    } else {
      console.warn('⚠️ some-meta.json missing in production/preview');
      return [];
    }
  }

  // 🛠️ Development/build: fetch from API and cache
  try {
    console.log('Fetching social media data...');
    const response = await axios.get<ApiResponse>(`${cms}/api/somet?populate=kuvake`);
    const socialMediaData = response.data;

    const some: Some[] = [];

    for (const entry of socialMediaData.data) {
      const image = entry.kuvake;
      const fileName = `${image.hash}${image.ext}`;
      const localPath = await downloadImage(`${cms}${image.url}`, fileName, 'some');
      const isVector = image.mime === 'image/svg+xml' || image.ext === '.svg';
      if (isVector) {
        const originalPath = `./public/${localPath}`;
        optimizeSvg(originalPath)
      } 
      some.push({
        iconUrl: `${site}${localPath}`,
        url: entry.linkki
      });
    }

    // ✅ Save cache
    await fs.writeJSON(cachePath, { some }, { spaces: 2 });

    return some;
  } catch (error) {
    console.error('❌ Failed to fetch social media data:', error);
    return [];
  }
}
