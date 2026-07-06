// Helper di join/normalizzazione sui dati wp_* grezzi (posts, postmeta, yoast, termini),
// condivisi dagli script 01/02 di estrazione.
import { loadTable } from './wp-export.js';
import { rowsToObjects } from './columns.js';

export function loadPosts() {
  return rowsToObjects(loadTable('posts'), 'posts');
}

export function loadPostMeta() {
  return rowsToObjects(loadTable('postmeta'), 'postmeta');
}

/** Mappa attachmentId (string) -> path pubblico "/images/uploads/YYYY/MM/file.ext". */
export function buildAttachmentPathMap(postmeta) {
  const map = new Map();
  for (const m of postmeta) {
    if (m.meta_key === '_wp_attached_file') {
      map.set(m.post_id, `/images/uploads/${m.meta_value}`);
    }
  }
  return map;
}

/** Mappa postId (string) -> path pubblico dell'immagine in evidenza (_thumbnail_id -> attachment). */
export function buildFeaturedImageMap(postmeta, attachmentPathMap) {
  const map = new Map();
  for (const m of postmeta) {
    if (m.meta_key === '_thumbnail_id') {
      const path = attachmentPathMap.get(m.meta_value);
      if (path) map.set(m.post_id, path);
    }
  }
  return map;
}

/** Mappa "object_type:object_id" -> { title, description } dai dati SEO reali di Yoast. */
export function buildYoastMap() {
  const rows = rowsToObjects(loadTable('yoast_indexable'), 'yoast_indexable');
  const map = new Map();
  for (const r of rows) {
    if (r.object_id == null) continue;
    map.set(`${r.object_type}:${r.object_id}`, {
      title: r.title || undefined,
      description: r.description || undefined,
    });
  }
  return map;
}

/** Mappa postId (string) -> { categories: string[], tags: string[] }. */
export function buildTaxonomyMap() {
  const relationships = rowsToObjects(loadTable('term_relationships'), 'term_relationships');
  const taxonomy = rowsToObjects(loadTable('term_taxonomy'), 'term_taxonomy');
  const terms = rowsToObjects(loadTable('terms'), 'terms');

  const termById = new Map(terms.map((t) => [t.term_id, t]));
  const taxonomyById = new Map(taxonomy.map((t) => [t.term_taxonomy_id, t]));

  const map = new Map();
  for (const rel of relationships) {
    const tax = taxonomyById.get(rel.term_taxonomy_id);
    if (!tax) continue;
    const term = termById.get(tax.term_id);
    if (!term) continue;
    if (tax.taxonomy !== 'category' && tax.taxonomy !== 'post_tag') continue;

    if (!map.has(rel.object_id)) map.set(rel.object_id, { categories: [], tags: [] });
    const entry = map.get(rel.object_id);
    if (tax.taxonomy === 'category') entry.categories.push(term.name);
    else entry.tags.push(term.name);
  }
  return map;
}
