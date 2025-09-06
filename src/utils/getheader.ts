import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { downloadImage } from '@/utils/downloadimages';
import { cms, site } from '@/utils/constants';
import { getEnvMode } from '@/utils/getEnvMode';
import { optimizeSvg } from './optimizesvg';

interface ApiResponse {
  data: {
    favicon: {
      url: string;
      hash: string;
      ext: string;
    };
  }[];
}

export default async function favIconFetch(): Promise<string> {
  const mode = getEnvMode();
  const folder = './public/favicon';
  const cachePath = path.join(folder, 'favicon-meta.json');

  await fs.ensureDir(folder);

  // 🚀 In production/preview mode, read from disk only
  if (mode === 'production' || mode === 'preview') {
    if (await fs.pathExists(cachePath)) {
      const meta = await fs.readJSON(cachePath);
      return meta.fp;
    } else {
      console.warn('⚠️ favicon-meta.json missing in production/preview!');
      return '';
    }
  }

  // 🛠️ Development or build time: always fetch from API
  try {
    console.log("getting favdata")
    const res = await axios.get(`${cms}/api/logot?populate=favicon`);
    const data = res.data as ApiResponse;
    const favicon = data.data[0].favicon;
    console.log(data.data[0])
    const filename = `${favicon.hash}${favicon.ext}`;
    let fp = await downloadImage(`${cms}${favicon.url}`, filename, 'favicon');
    const isVector =  favicon.ext === '.svg';

    if (isVector) {
          const originalPath = `./public/${fp}`;
          optimizeSvg(originalPath)
   }
    console.log(fp)

    // Save metadata for future production/preview use
    await fs.writeJSON(cachePath, { fp }, { spaces: 2 });

    return fp;
  } catch (err) {
    console.error('❌ Failed to fetch or download favicon:', err);
    return '';
  }
}
