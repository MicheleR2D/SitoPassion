// Genera public/_redirects (formato Netlify, compatibile anche con Cloudflare Pages) dai 54
// redirect 301 reali del plugin Redirection - requisito SEO esplicito, non negoziabile.
import fs from 'node:fs';
import path from 'node:path';
import { loadTable, cachePath } from './lib/wp-export.js';
import { rowsToObjects } from './lib/columns.js';
import { PAGE_SLUG_MAP, BLOG_INDEX_WP_SLUG } from './lib/slug-map.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
const SITE_HOST_RE = /^https?:\/\/(www\.)?passionfitness\.it/i;

function readCache(name) {
  return JSON.parse(fs.readFileSync(cachePath(name), 'utf8'));
}

/** Path relativo se il target e' sul nostro sito, altrimenti l'URL assoluto esterno invariato
 *  (es. il redirect del QR code "porta un amico" verso un form esterno n8n). */
function toRelativeOrAbsolute(url) {
  if (SITE_HOST_RE.test(url)) return '/' + url.replace(SITE_HOST_RE, '').replace(/^\/+/, '');
  if (/^https?:\/\//i.test(url)) return url; // dominio esterno, lasciato assoluto
  return '/' + url.replace(/^\/+/, '');
}

function isExternal(target) {
  return /^https?:\/\//i.test(target) && !SITE_HOST_RE.test(target);
}

function knownDestination(relPath, postSlugs) {
  if (isExternal(relPath)) return true; // fuori dal nostro dominio, non c'e' nulla da verificare
  const slug = relPath.replace(/^\/+|\/+$/g, '').split('/').pop();
  if (slug === '' || slug === BLOG_INDEX_WP_SLUG) return true;
  return slug in PAGE_SLUG_MAP || postSlugs.has(slug);
}

const items = rowsToObjects(loadTable('redirection_items'), 'redirection_items');
const enabled = items
  .filter((r) => r.status === 'enabled')
  .sort((a, b) => Number(a.position) - Number(b.position));

const normalizedPosts = readCache('normalized-posts.json');
const postSlugs = new Set(normalizedPosts.map((p) => p.slug));

const lines = [
  '# Generato da scripts/migration/05-generate-redirects.js dai redirect 301 reali del sito WP.',
  '# Non modificare a mano: rilanciare lo script se i redirect di origine cambiano.',
];
const regexSkipped = [];
const staleTargets = [];

for (const r of enabled) {
  if (Number(r.regex) === 1) {
    regexSkipped.push(r);
    continue;
  }
  const source = toRelativeOrAbsolute(r.url);
  const target = toRelativeOrAbsolute(r.action_data || '');
  if (!knownDestination(target, postSlugs)) staleTargets.push({ source, target });
  lines.push(`${source}  ${target}  ${r.action_code || 301}`);
}

fs.writeFileSync(path.join(REPO_ROOT, 'public', '_redirects'), lines.join('\n') + '\n');

console.log(`Redirect scritti: ${enabled.length - regexSkipped.length}/${enabled.length} (attesi 54 abilitati)`);
if (regexSkipped.length) {
  console.warn(`\n${regexSkipped.length} redirect con match regex saltati (da rivedere a mano):`);
  for (const r of regexSkipped) console.warn(`  ${r.url} -> ${r.action_data}`);
}
if (staleTargets.length) {
  console.warn(`\n${staleTargets.length} redirect puntano a slug non presenti nel sito migrato:`);
  for (const s of staleTargets) console.warn(`  ${s.source} -> ${s.target}`);
}
