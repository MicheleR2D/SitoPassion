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

const team = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string().optional(),
    bio: z.string().optional(),
    order: z.number().default(0),
    socials: z
      .object({
        instagram: z.string().url().optional(),
        facebook: z.string().url().optional(),
      })
      .optional(),
    active: z.boolean().default(true),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    category: z
      .enum(['fitness', 'personal-training', 'pilates', 'crossfit', 'hyrox', 'sala-pesi'])
      .optional(),
    icon: z.string().optional(),
    order: z.number().default(0),
    linkedPage: z.string().optional(),
  }),
});

const footerSettings = defineCollection({
  loader: singletonFile('./src/content/settings/footer.json', 'footer'),
  schema: z.object({
    footerText: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
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

export const collections = { pages, blog, team, services, footerSettings, siteSettings };
