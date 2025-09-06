import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cms } from '@/utils/constants';
import { getEnvMode } from '@/utils/getEnvMode';

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
  provider_metadata: null | any;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Info {
  id: number;
  title: string;
  description: string;
}

interface Data {
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
  hakemukseen: string;
}

interface ApiResponse {
  data: Data[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface TervetuloaProcessed extends Data {
  tavoitteet: string;
  tyopajatoiminta: string;
  yksilovalmennuskuvaus: string;
  kuvaus: string;
  hakemukseen: string;
}

const folder = './public/tervetuloa';
const cachePath = path.join(folder, 'tervetuloa-meta.json');

export default async function fetchTervetuloa(): Promise<TervetuloaProcessed | null> {
  const mode = getEnvMode();

  await fs.ensureDir(folder);

  // Use cached data in production or preview
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const cached = await fs.readJSON(cachePath);
      return cached.tervetuloa;
    } else {
      console.warn('⚠️ tervetuloa-meta.json missing in production/preview!');
      return null;
    }
  }

  // Dev/build — fetch fresh data and cache it
  try {
    const response = await axios.get<ApiResponse>(
      `${cms}/api/tervetuloas?populate=info&populate=logo`
    );
    if (response.data.data.length === 0) return null;

    const item = response.data.data[0];

    // Convert multiline strings to HTML lists or paragraphs
    const tavoitteet = item.tavoitteet
      .trim()
      .split('\n')
      .map((line) => `<li>${line}</li>`)
      .join('');
    const yksilovalmennuskuvaus = item.yksilovalmennuskuvaus
      .trim()
      .split('\n')
      .map((line) => `<li>${line}</li>`)
      .join('');
    const tyopajatoiminta = item.tyopajatoiminta
      .trim()
      .split('\n')
      .map((line) => `<li>${line}</li>`)
      .join('');
    const kuvaus = item.kuvaus
      .split('\n')
      .map((line) => `<p>${line}</p>`)
      .join('');
    const processed: TervetuloaProcessed = {
      ...item,
      tavoitteet,
      yksilovalmennuskuvaus,
      tyopajatoiminta,
      kuvaus,
    };

    await fs.writeJSON(cachePath, { tervetuloa: processed }, { spaces: 2 });

    return processed;
  } catch (error) {
    console.error('❌ Error fetching tervetuloa data:', error);
    return null;
  }
}
