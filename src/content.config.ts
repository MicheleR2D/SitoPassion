import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Decap CMS scrive un JSON "flat" (i campi alla radice, come una collection "files" qualsiasi).
// Il loader file() di Astro, se il JSON e' un oggetto flat, tratterebbe OGNI campo come un
// entry separato (rompendo la validazione) invece di un singolo record: questo loader crea
// invece un'unica entry con id fisso a partire da un file JSON flat, cosi' sia Decap
// (scrittura semplice) sia astro:content (getEntry con id noto) restano semplici.
function singletonFile(relPath: string, id: string) {
  return {
    name: `singleton-file:${id}`,
    load: async ({ config, store, parseData, watcher }: any) => {
      const url = new URL(relPath, config.root);
      const filePath = fileURLToPath(url);
      const raw = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      store.clear();
      store.set({ id, data: await parseData({ id, data: raw }) });
      watcher?.add(filePath);
      watcher?.on('change', async (changedPath: string) => {
        if (changedPath !== filePath) return;
        const updated = JSON.parse(await fs.readFile(filePath, 'utf-8'));
        store.clear();
        store.set({ id, data: await parseData({ id, data: updated }) });
      });
    },
  };
}

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  ogImage: z.string().optional(),
  noindex: z.boolean().default(false),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    order: z.number().optional(),
    heroImage: z.string().optional(),
    heroVideo: z.string().optional(),
    heroEyebrow: z.string().optional(),
    // Paragrafo e CTA nel pannello rosso dell'hero, come sulla home.
    // heroText accetta HTML inline (es. <br />) per gestire le andate a capo.
    heroText: z.string().optional(),
    heroCtas: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          // La CTA principale dell'hero e' bianca su tutto il sito (vedi la
          // home): il default sta qui, cosi' le pagine non lo ripetono.
          variant: z
            .enum(['primary', 'white', 'dark-red', 'invert-red', 'ghost-dark', 'ghost-light'])
            .default('white'),
        })
      )
      .optional(),
    seo: seoSchema.optional(),
    wpId: z.number().optional(),
    publishedAt: z.date().optional(),
    updatedAt: z.date().optional(),
    draft: z.boolean().default(false),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().optional(),
    coverImage: z.string().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Passion Fitness'),
    publishedAt: z.date(),
    updatedAt: z.date().optional(),
    seo: seoSchema.optional(),
    wpId: z.number().optional(),
    draft: z.boolean().default(false),
  }),
});

// Nota: le collection `team` e `services` sono state rimosse. Erano dichiarate
// senza alcun file dentro (due warning del glob-loader a ogni build) e nessuna
// pagina le interrogava. Se in futuro servissero, si ridichiarano qui insieme
// ai contenuti.

const footerSettings = defineCollection({
  loader: singletonFile('./src/content/settings/footer.json', 'footer'),
  schema: z.object({
    footerText: z.string().optional(),
    description: z.string().optional(),
    // Dati societari e legali: obbligatori per legge sul sito di una SSD,
    // quindi vivono nei contenuti (editabili) e non nel markup.
    legalNotice: z.string().optional(),
    address: z.string().optional(),
    vatNumber: z.string().optional(),
    registryNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    careersUrl: z.string().optional(),
    openingHours: z
      .array(
        z.object({
          day: z.string(),
          hours: z.string(),
        })
      )
      .optional(),
  }),
});

const siteSettings = defineCollection({
  loader: singletonFile('./src/content/settings/site.json', 'site'),
  schema: z.object({
    siteName: z.string().optional(),
    socials: z.record(z.string(), z.string()).optional(),
  }),
});

export const collections = { pages, blog, footerSettings, siteSettings };
