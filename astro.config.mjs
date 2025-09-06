// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import db from '@astrojs/db';
import node from '@astrojs/node'; // ✅ Import the node adapter
import dotenv from 'dotenv';
import sitemap from 'astro-sitemap';

dotenv.config();

export default defineConfig({
  // experimental: {
  //   session: true, // ✅ Enable session support
  //   serializeConfig: true
  // },
site: 'https://avainasema.org',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: {
    allowedHosts: ['avainasema.org'],
  },
  vite: {
    plugins: [tailwindcss()],
    // build: {
    //   minify: false,  // disables JS and CSS minification completely
    // },
  },
  integrations: [react(), db(),     sitemap({
      customPages: [
        'https://avainasema.org/',
        'https://avainasema.org/henkilokunta',
        'https://avainasema.org/lomake',
        'https://avainasema.org/galleria'
      ],
    }),],
});
