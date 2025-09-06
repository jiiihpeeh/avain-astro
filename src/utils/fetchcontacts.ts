import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cms, site } from '@/utils/constants';
import { downloadImage } from '@/utils/downloadimages';
import { convertImage } from '@/utils/compressImage';
import { getEnvMode } from '@/utils/getEnvMode';

interface ImageFormats {
  thumbnail: any;
  medium?: any;
  small?: any;
}

interface Image {
  id: number;
  hash: string;
  ext: string;
  url: string;
  formats: ImageFormats;
}

interface Person {
  nimi: string;
  nimike: string;
  kuvaus: string;
  tervehdys: string;
  puhelin: string;
  email: string | null;
  kuva: Image;
}

interface ApiResponse {
  data: Person[];
}

interface Worker {
  nimi: string;
  nimike: string;
  kuvaus: string;
  tervehdys: string;
  puhelin: string;
  email: string | null;
  kuva: {
    url: string;
  };
}

export async function fetchPersonnel(): Promise<Worker[]> {
  const mode = getEnvMode();
  const folder = './public/henkilo';
  const cachePath = path.join(folder, 'personnel-meta.json');

  await fs.ensureDir(folder);

  // 🚀 Use cached data in production/preview
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const meta = await fs.readJSON(cachePath);
      return meta.personal;
    } else {
      console.warn('⚠️ personnel-meta.json missing in production/preview!');
      return [];
    }
  }

  // 🛠 Fetch and process data in dev/build
  try {
    const res = await axios.get<ApiResponse>(`${cms}/api/tyontekijat?populate=kuva`);
    const people = res.data.data;
    const personal: Worker[] = [];

    for (const person of people) {
      const filename = `${person.kuva.hash}${person.kuva.ext}`;
      const originalPath = await downloadImage(`${cms}${person.kuva.url}`, filename, 'henkilo');

      const webpPath = originalPath.replace(/\.[a-z0-9]+$/i, '_img.webp');
      const fullInputPath = `./public/${originalPath}`;
      const fullOutputPath = `./public/${webpPath}`;

     if (!fs.existsSync(fullOutputPath)) {
        await convertImage(fullInputPath, fullOutputPath, {
          quality: 85,
          maxWidth: 300,
          maxHeight: 300,
          format: 'webp',
        });
      }else {
        console.log("personal image is scaled already")
      }

      personal.push({
        nimi: person.nimi,
        nimike: person.nimike,
        kuvaus: person.kuvaus,
        tervehdys: person.tervehdys,
        puhelin: person.puhelin,
        email: person.email,
        kuva: { url: `${site}${webpPath}` },
      });
    }

    await fs.writeJSON(cachePath, { personal }, { spaces: 2 });
    return personal;
  } catch (err) {
    console.error('❌ Failed to fetch or process personnel data:', err);
    return [];
  }
}


interface Address {
  id: number;
  documentId: string;
  Katuosoite: string;
  Postinumero: string;
  Toimipaikka: string;
  Lisatiedot: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface ApiResponseAdd {
  data: Address[];
}

export async function fetchAddress(): Promise<Address | null> {
  const mode = getEnvMode();
  const cacheDir = './public/cache';
  const cachePath = path.join(cacheDir, 'address-meta.json');

  await fs.ensureDir(cacheDir);

  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const cached = await fs.readJSON(cachePath);
      return cached.address;
    } else {
      console.warn('⚠️ address-meta.json missing in production/preview!');
      return null;
    }
  }

  // Development / build mode — fetch fresh data and cache it
  try {
    const response = await fetch(`${cms}/api/osoittet`);
    const jsonData: ApiResponseAdd = await response.json();
    const address = jsonData.data[0] || null;

    if (address) {
      await fs.writeJSON(cachePath, { address }, { spaces: 2 });
    }

    return address;
  } catch (error) {
    console.error('❌ Failed to fetch or cache address:', error);
    return null;
  }
}