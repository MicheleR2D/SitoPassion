// Converte le pagine/articoli normalizzati (HTML Gutenberg) in .mdx con frontmatter,
// dentro src/content/pages e src/content/blog. Passo piu' delicato della pipeline:
// va ispezionato a campione l'output prima di considerarlo definitivo (vedi verify.js).
import fs from 'node:fs';
import path from 'node:path';
import { stringify as toYaml } from 'yaml';
import { cachePath } from './lib/wp-export.js';
import { stripGutenbergComments, stripStyleAndScriptTags } from './lib/gutenberg-strip.js';
import { rewriteHtmlUrls, makeLinkRewriter, makeMediaUrlRewriter } from './lib/rewrite-urls.js';
import { htmlToMarkdown } from './lib/html-to-md.js';
import { PAGE_SLUG_MAP } from './lib/slug-map.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');

function readCache(name) {
  return JSON.parse(fs.readFileSync(cachePath(name), 'utf8'));
}

const normalizedPages = readCache('normalized-pages.json');
const normalizedPosts = readCache('normalized-posts.json');

function toDate(wpDateString) {
  if (!wpDateString || wpDateString === '0000-00-00 00:00:00') return undefined;
  return new Date(wpDateString.replace(' ', 'T'));
}

const postSlugs = new Set(normalizedPosts.map((p) => p.slug));
const rewriteLink = makeLinkRewriter({ postSlugs });

const mediaReport = readCache('media-mapping-report.json');
const keptRelPaths = new Set(mediaReport.filter((m) => m.newPath).map((m) => m.relPath));
const unresolvedMedia = [];
const rewriteMediaUrl = makeMediaUrlRewriter(keptRelPaths, unresolvedMedia);

const allUnresolvedLinks = [];

function convertBody(contentRaw, label) {
  const stripped = stripStyleAndScriptTags(stripGutenbergComments(contentRaw || ''));
  const { html, unresolvedLinks } = rewriteHtmlUrls(stripped, rewriteLink, rewriteMediaUrl);
  for (const url of unresolvedLinks) allUnresolvedLinks.push({ label, url });
  return htmlToMarkdown(html);
}

function writeContentFile(dir, slug, frontmatter, body) {
  const cleanFrontmatter = Object.fromEntries(
    Object.entries(frontmatter).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const yaml = toYaml(cleanFrontmatter).trim();
  const destPath = path.join(REPO_ROOT, dir, `${slug}.mdx`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, `---\n${yaml}\n---\n\n${body}\n`);
  return destPath;
}

let pagesWritten = 0;
for (const p of normalizedPages) {
  const astroSlug = PAGE_SLUG_MAP[p.slug];
  if (!astroSlug) {
    console.warn(`Salto pagina "${p.slug}" (wpId ${p.wpId}): assente da PAGE_SLUG_MAP`);
    continue;
  }
  const body = convertBody(p.contentRaw, `page:${p.slug}`);
  writeContentFile('src/content/pages', astroSlug, {
    title: p.title,
    slug: astroSlug,
    wpId: p.wpId,
    publishedAt: toDate(p.publishedAt),
    updatedAt: toDate(p.modifiedAt),
    draft: false,
    seo:
      p.seoTitle || p.seoDescription
        ? { title: p.seoTitle, description: p.seoDescription }
        : undefined,
  }, body);
  pagesWritten++;
}

let postsWritten = 0;
for (const post of normalizedPosts) {
  const body = convertBody(post.contentRaw, `post:${post.slug}`);
  writeContentFile('src/content/blog', post.slug, {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    categories: post.categories,
    tags: post.tags,
    author: 'Passion Fitness',
    publishedAt: toDate(post.publishedAt),
    updatedAt: toDate(post.modifiedAt),
    wpId: post.wpId,
    draft: false,
    seo:
      post.seoTitle || post.seoDescription
        ? { title: post.seoTitle, description: post.seoDescription }
        : undefined,
  }, body);
  postsWritten++;
}

console.log(`Pagine scritte: ${pagesWritten}/${normalizedPages.length}`);
console.log(`Articoli scritti: ${postsWritten}/${normalizedPosts.length}`);

if (allUnresolvedLinks.length) {
  console.warn(`\n${allUnresolvedLinks.length} link interni non risolti (rivedere a mano):`);
  for (const u of allUnresolvedLinks.slice(0, 50)) console.warn(`  [${u.label}] ${u.url}`);
  if (allUnresolvedLinks.length > 50) console.warn(`  ... e altri ${allUnresolvedLinks.length - 50}`);
}

if (unresolvedMedia.length) {
  console.warn(
    `\n${unresolvedMedia.length} riferimenti media senza file corrispondente copiato ` +
      `(ne' la versione con suffisso ne' quella senza - controllare in wp-content/uploads):`
  );
  for (const m of new Set(unresolvedMedia)) console.warn(`  ${m}`);
}
