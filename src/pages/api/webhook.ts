import type { APIRoute } from 'astro';
import { exec } from 'child_process';
import fs from 'fs-extra';
import { globby } from 'globby';
import path from 'path';
import { promisify } from 'util';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const execAsync = promisify(exec);
const buildLockPath = '/tmp/build-astro.lock';

function unixTime(){
  return Math.floor(Date.now() / 1000)
}

export const prerender = false;

export const HEAD: APIRoute = async () => {
  return new Response('OK', { status: 200 });
};

export async function readBuildLockTimestamp() {
  try {
    const fileContent = await fs.readFile(buildLockPath, 'utf8');
    const timestamp = Number(fileContent.trim());

    if (isNaN(timestamp)) {
      throw new Error(`Invalid timestamp in lock file: "${fileContent}"`);
    }

    return timestamp;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist
      return null;
    } else {
      // Unexpected error
      throw err;
    }
  }
}


async function extendLockIfNearExpiry(thresholdSeconds = 120, extendTo = 120) {
  const timestamp = await readBuildLockTimestamp();
  const now = unixTime();
  const timeLeft = timestamp ? (timestamp - now) : 0;

  if (timestamp && timeLeft > 0 && timeLeft < thresholdSeconds) {
    const newTimestamp = now + extendTo;
    await fs.writeFile(buildLockPath, `${newTimestamp}`);
    console.log(`🔄 Lock extended to: ${new Date(newTimestamp * 1000).toISOString()}`);
    return true;
  }

  return false;
}

export const POST: APIRoute = async ({ request }) => {
  
  const authHeader = request.headers.get('Authorization');
  const validKey = process.env.WEBHOOK_KEY as string;

  if (authHeader !== validKey) {
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('✅ Auth success');
  

  if (await fs.pathExists(buildLockPath)) {
    console.log('⏳ Build already in progress. Skipping...');
    await extendLockIfNearExpiry()
    return new Response('Build already in progress', { status: 429 });
  }

  await fs.writeFile(buildLockPath, `${unixTime() + 5 * 60}`);

  while (true){
    await sleep(5000)

    if (  unixTime() >  (await readBuildLockTimestamp() ?? 0 )  ){
      break
    }
  }


  try {
    const body = await request.json();
    console.log('✅ Webhook received:', body);
    let buildGallery = await execAsync('npm run generate:gallery', {
      cwd: '/home/strapi/avain-astro',
      env: {
        ...process.env,
        PATH: '/usr/local/bin:/usr/bin:/bin:' + process.env.PATH, // ensure npm is found
      },
    });
    console.log('✅ Build output:\n', buildGallery.stdout);

    // ✅ Clean `./public` except robots and gallery
    const publicDir = path.resolve('./public');
    const keepPatterns = [
      'robots.txt',
      'robots-*.txt',
      'gallery/**',
    ];
    const allFiles = await globby(['**/*'], {
      cwd: publicDir,
      dot: true,
      onlyFiles: false,
    });

    const keepSet = new Set(await globby(keepPatterns, { cwd: publicDir }));
    const filesToDelete = allFiles.filter((f) => !keepSet.has(f));

    for (const file of filesToDelete) {
      const fullPath = path.join(publicDir, file);
      await fs.remove(fullPath);
      console.log('🧹 Removed:', fullPath);
    }

    // ✅ Rebuild directly using npm
    console.log('🛠 Running build...');
    const buildResult = await execAsync('npm run build', {
      cwd: '/home/strapi/avain-astro',
      env: {
        ...process.env,
        PATH: '/usr/local/bin:/usr/bin:/bin:' + process.env.PATH, // ensure npm is found
      },
    });
    console.log('✅ Build output:\n', buildResult.stdout);

    // ✅ Optional: Restart astro.service
    try {
      console.log('🔁 Restarting astro.service...');
      const restartResult = await execAsync('sudo /bin/systemctl restart astro.service', {
        env: process.env,
      });
      console.log('✅ Service restart output:\n', restartResult.stdout);
    } catch (restartError) {
      console.error('❌ Failed to restart service:', restartError);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('❌ Webhook error:', err.stderr || err.message);
    return new Response(JSON.stringify({ error: 'Build or cleanup failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
