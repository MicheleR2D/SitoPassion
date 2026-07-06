// Estrae dalle tabelle WP le 16 pagine reali (+ footer a parte, + intro pagina blog a parte)
// e produce JSON normalizzati intermedi (fuori dal repo) consumati da 03-html-to-markdown.js.
import fs from 'node:fs';
import { cachePath } from './lib/wp-export.js';
import { loadPosts, loadPostMeta, buildYoastMap } from './lib/wp-content.js';
import { PAGE_SLUG_MAP, BLOG_INDEX_WP_SLUG, FOOTER_WP_ID } from './lib/slug-map.js';

const posts = loadPosts();
loadPostMeta(); // popola la cache .cache/eTGmm_postmeta.json per riuso da altri script
const yoast = buildYoastMap();

const pages = posts.filter((p) => p.post_type === 'page' && p.post_status === 'publish');

function toNormalized(p) {
  const seo = yoast.get(`page:${p.ID}`) || {};
  return {
    wpId: Number(p.ID),
    slug: p.post_name,
    title: p.post_title,
    contentRaw: p.post_content,
    seoTitle: seo.title,
    seoDescription: seo.description,
    modifiedAt: p.post_modified,
    publishedAt: p.post_date,
  };
}

const footer = pages.find((p) => Number(p.ID) === FOOTER_WP_ID);
const blogIndex = pages.find((p) => p.post_name === BLOG_INDEX_WP_SLUG);
const regularPages = pages.filter(
  (p) => Number(p.ID) !== FOOTER_WP_ID && p.post_name !== BLOG_INDEX_WP_SLUG
);

const missingFromMap = regularPages.filter((p) => !(p.post_name in PAGE_SLUG_MAP));
if (missingFromMap.length) {
  console.warn(
    'ATTENZIONE: pagine trovate nel DB ma assenti da PAGE_SLUG_MAP (slug-map.js):',
    missingFromMap.map((p) => `${p.post_name} (wpId ${p.ID}, "${p.post_title}")`)
  );
}

const normalizedPages = regularPages.map(toNormalized);
const normalizedFooter = footer ? toNormalized(footer) : null;
const normalizedBlogIndex = blogIndex ? toNormalized(blogIndex) : null;

fs.writeFileSync(cachePath('normalized-pages.json'), JSON.stringify(normalizedPages, null, 2));
fs.writeFileSync(cachePath('normalized-footer.json'), JSON.stringify(normalizedFooter, null, 2));
fs.writeFileSync(
  cachePath('normalized-blog-index.json'),
  JSON.stringify(normalizedBlogIndex, null, 2)
);

console.log(
  `Pagine estratte: ${normalizedPages.length} (attese ${Object.keys(PAGE_SLUG_MAP).length}), ` +
    `footer: ${footer ? 'ok' : 'MANCANTE'}, blog index: ${blogIndex ? 'ok' : 'MANCANTE'}`
);
