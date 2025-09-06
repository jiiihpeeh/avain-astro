import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
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

    const filename = `${logo.hash}${logo.ext}`;
    const localPath = await downloadImage(`${cms}${logo.url}`, filename, 'logo');
    const logoUrl = `${site}${localPath}`;

    // ✅ Write cache
    await fs.writeJSON(cachePath, { logoUrl }, { spaces: 2 });

    return logoUrl;
  } catch (err) {
    console.error('❌ Failed to fetch or process logo image:', err);
    return '';
  }
}
