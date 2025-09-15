import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import ffmpeg from 'fluent-ffmpeg';
import { mkdir } from './mkdir-p';
interface VideoResolution {
  width: number;
  height: number;
}


export async function downloadImage(url: string, filename: string, subdir: string) {
  const destPath = path.join('public', 'cms-images', subdir, filename);
  mkdir(path.join('public', 'cms-images', subdir))
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


export async function downloadVideo(url: string, filename: string, subdir: string) {
  const destPath = path.join('public', 'cms-images', subdir, filename);
  mkdir(path.join('public', 'cms-images', subdir))

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
  let resolution = await giveResolution(destPath)
  const extension = path.extname(destPath)

  let filebase = `${resolution.width}x${resolution.height}${extension}`
  const newpath = path.join('public', 'cms-images', subdir, filebase)
  fs.renameSync(destPath, newpath)
  return `cms-images/${subdir}/${filebase}`;
}


/**
 * Returns the resolution of a video file.
 * @param videoPath - The path to the video file.
 * @returns A promise resolving to an object with width and height.
 */
export function giveResolution(videoPath: string): Promise<VideoResolution> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      const videoStream = metadata.streams?.find(
        (stream: any) => stream.codec_type === 'video' && stream.width && stream.height
      );

      if (videoStream) {
        resolve({
          width: videoStream.width ?? 0,
          height: videoStream.height ?? 0,
        });
      } else {
        reject(new Error('No valid video stream found.'));
      }
    });
  });
}