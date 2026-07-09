// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// BASE_PATH è impostata solo dal workflow di GitHub Pages (ambiente di sviluppo/test):
// il sito finale su Netlify e il dev locale restano sempre alla radice ("/").
const base = process.env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.passionfitness.it',
  base,
  trailingSlash: 'always',
  integrations: [mdx(), sitemap()]
});