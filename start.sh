#!/bin/sh
 

cd "$(dirname "$0")"
cd "/home/strapi/avain-astro/"
rm /tmp/build-astro.lock
npm run astro build
npm run astro preview
