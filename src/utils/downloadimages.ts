import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

export async function downloadImage(url: string, filename: string, subdir: string) {
  const destPath = path.join('public', 'cms-images', subdir, filename);

  // ✅ Skip download if file already exists
  // if (fs.existsSync(destPath)) {
  //   return `cms-images/${subdir}/${filename}`;
  // }

  // If it doesn't exist, fetch and save
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);

  return `cms-images/${subdir}/${filename}`;
}