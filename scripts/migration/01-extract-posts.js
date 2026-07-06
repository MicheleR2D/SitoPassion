// Estrae dalle tabelle WP i 78 articoli blog pubblicati con SEO (Yoast), categorie/tag e immagine
// in evidenza reale, e produce normalized-posts.json (intermedio, fuori dal repo).
import fs from 'node:fs';
import { cachePath } from './lib/wp-export.js';
import {
  loadPosts,
  loadPostMeta,
  buildYoastMap,
  buildTaxonomyMap,
  buildAttachmentPathMap,
  buildFeaturedImageMap,
} from './lib/wp-content.js';

const posts = loadPosts();
const postmeta = loadPostMeta();
const yoast = buildYoastMap();
const taxonomyByPostId = buildTaxonomyMap();
const attachmentPathMap = buildAttachmentPathMap(postmeta);
const featuredImageMap = buildFeaturedImageMap(postmeta, attachmentPathMap);

const blogPosts = posts.filter((p) => p.post_type === 'post' && p.post_status === 'publish');

const normalizedPosts = blogPosts.map((p) => {
  const seo = yoast.get(`post:${p.ID}`) || {};
  const tax = taxonomyByPostId.get(p.ID) || { categories: [], tags: [] };
  return {
    wpId: Number(p.ID),
    slug: p.post_name,
    title: p.post_title,
    contentRaw: p.post_content,
    excerpt: p.post_excerpt || undefined,
    categories: tax.categories,
    tags: tax.tags,
    coverImage: featuredImageMap.get(p.ID) || undefined,
    publishedAt: p.post_date,
    modifiedAt: p.post_modified,
    seoTitle: seo.title,
    seoDescription: seo.description,
  };
});

const slugs = new Set();
const duplicates = [];
for (const post of normalizedPosts) {
  if (slugs.has(post.slug)) duplicates.push(post.slug);
  slugs.add(post.slug);
}
if (duplicates.length) {
  console.warn('ATTENZIONE: slug duplicati tra gli articoli blog:', duplicates);
}

fs.writeFileSync(cachePath('normalized-posts.json'), JSON.stringify(normalizedPosts, null, 2));
console.log(`Articoli blog estratti: ${normalizedPosts.length} (attesi 78)`);
