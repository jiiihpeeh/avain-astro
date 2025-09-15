import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Ensures a directory exists. Creates it if it doesn't.
 * @param dirPath - The path to the directory.
 */
export async function mkdir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    // Directory created or already exists.
  } catch (err) {
    console.error(`Failed to create directory "${dirPath}":`, err);
    throw err;
  }
}