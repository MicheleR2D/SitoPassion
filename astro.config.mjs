// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// BASE_PATH è impostata solo dal workflow di GitHub Pages (ambiente di sviluppo/test):
// il sito finale su Netlify e il dev locale restano sempre alla radice ("/").
const base = process.env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
  // Con www: e' il dominio che risponde 200 su Vercel (verificato il
  // 2026-09-10 che passionfitness.it fa 308 verso www.passionfitness.it —
  // direzione decisa nella configurazione dei domini su Vercel, non qui).
  // Da qui derivano sitemap.xml, i canonical di ogni pagina, og:url e gli
  // URL del BreadcrumbList — un valore sbagliato qui genera un'intera
  // sitemap di URL che rediriggono, invece delle URL finali.
  // Se un domani su Vercel si rimette l'apex come dominio primario, qui e in
  // public/robots.txt si torna a 'https://passionfitness.it'.
  site: 'https://www.passionfitness.it',
  base,
  trailingSlash: 'always',
  integrations: [
    mdx(),
    sitemap({
      // /prenotazione/ e' una pagina di prova marcata noindex (vedi il
      // commento in cima a src/pages/prenotazione.astro): tenerla nella
      // sitemap significa proporla a Google come pagina da indicizzare e
      // poi dirle di no nell'HTML — in Search Console diventa un errore
      // "URL inviato contrassegnato come noindex". Fuori dalla sitemap.
      filter: (page) => !page.includes('/prenotazione/'),
    }),
  ]
});