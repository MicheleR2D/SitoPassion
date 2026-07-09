// Riscrive nei file HTML generati (dist/) tutti i percorsi assoluti scritti a mano
// (href/src/action/poster/srcset che iniziano con "/") aggiungendo il prefisso
// BASE_PATH di GitHub Pages. Astro gestisce automaticamente il `base` config solo
// per i propri asset (_astro/...) e per il routing interno: qualsiasi stringa scritta
// a mano nel markup o nei contenuti .mdx (nav, header, footer, immagini/video nei
// blog post) resta invariata e va corretta qui, una sola volta, dopo la build.
// Eseguito SOLO dal workflow GitHub Pages: build locale, dev e Netlify non sono toccati.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const basePath = process.env.BASE_PATH;

if (!basePath || basePath === '/') {
  console.log('BASE_PATH non impostata: nessuna riscrittura necessaria.');
  process.exit(0);
}

const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
const distDir = join(process.cwd(), 'dist');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (extname(entry.name) === '.html') {
      files.push(fullPath);
    }
  }
  return files;
}

// href="/..." src="/..." action="/..." poster="/...": salta se già prefissato
// (es. asset di Astro sotto /_astro/, già gestiti dal `base` config) o se protocol-relative "//".
const attrPattern = /\b(href|src|action|poster)="(\/(?!\/)[^"]*)"/g;

function rewriteAttrs(html) {
  return html.replace(attrPattern, (match, attr, full) => {
    if (full.startsWith(normalizedBase + '/') || full === normalizedBase) return match;
    return `${attr}="${normalizedBase}${full}"`;
  });
}

// srcset="/a.jpg 1x, /b.jpg 2x"
function rewriteSrcset(html) {
  return html.replace(/\bsrcset="([^"]*)"/g, (match, value) => {
    const rewritten = value
      .split(',')
      .map((part) => {
        const trimmed = part.trim();
        const spaceIdx = trimmed.indexOf(' ');
        const url = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
        const descriptor = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx);
        if (!url.startsWith('/') || url.startsWith('//') || url.startsWith(normalizedBase + '/')) {
          return trimmed;
        }
        return `${normalizedBase}${url}${descriptor}`;
      })
      .join(', ');
    return `srcset="${rewritten}"`;
  });
}

const files = await walk(distDir);
let changed = 0;

for (const file of files) {
  const original = await readFile(file, 'utf8');
  const rewritten = rewriteSrcset(rewriteAttrs(original));
  if (rewritten !== original) {
    await writeFile(file, rewritten, 'utf8');
    changed++;
  }
}

console.log(`Riscritti ${changed}/${files.length} file HTML con prefisso "${normalizedBase}".`);
