#!/bin/sh
 

cd "$(dirname "$0")"
cd "/home/strapi/avain-astro/"
mkdir -p public/scripts/
esbuild src/scripts/lightgallery-init.js --bundle --outfile=public/scripts/lightgallery-init.bundle.js --minify
mkdir -p public/css/
cp node_modules/lightgallery/css/* public/css/
mkdir -p public/fonts/
cp node_modules/lightgallery/fonts/* public/fonts/
mkdir -p public/images/
cp node_modules/lightgallery/images/* public/images/
rm /tmp/build-astro.lock
npm run astro build
npm run astro preview
