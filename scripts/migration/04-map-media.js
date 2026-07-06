// Copia i media reali (foto/video/pdf) da wp-content/uploads nel repo, sotto public/,
// mantenendo l'albero YYYY/MM cosi' i path riscritti da 03-html-to-markdown.js sono una
// semplice sostituzione di prefisso. Scarta le varianti thumbnail generate da WordPress
// (suffisso "-WIDTHxHEIGHT" prima dell'estensione, con eventuali suffissi di deduplica "-N").
import fs from 'node:fs';
import path from 'node:path';
import { ensureUploadsExtracted, cachePath } from './lib/wp-export.js';
import { loadPostMeta } from './lib/wp-content.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
const THUMBNAIL_RE = /-\d{2,5}x\d{2,5}(-\d+)*\.(jpe?g|png|gif|webp|avif)$/i;

// _wp_attached_file e' la fonte di verita' su quale file e' l'originale di un attachment:
// alcuni originali hanno gia' nel nome un pattern "-WIDTHxHEIGHT" (es. rinominati da un tool
// esterno prima dell'upload, tipo "group-cycling-min-1168x600-1.jpg") che il pattern-match
// del filename da solo scambierebbe per una thumbnail generata da WP. Questi vanno protetti
// dall'esclusione anche se ne combaciano il pattern.
const protectedOriginals = new Set(
  loadPostMeta()
    .filter((m) => m.meta_key === '_wp_attached_file')
    .map((m) => m.meta_value)
);

const EXT_DESTINATION = {
  '.jpg': ['images', 'uploads'],
  '.jpeg': ['images', 'uploads'],
  '.png': ['images', 'uploads'],
  '.gif': ['images', 'uploads'],
  '.webp': ['images', 'uploads'],
  '.avif': ['images', 'uploads'],
  '.svg': ['images', 'uploads'],
  '.pdf': ['documents'],
  '.mp4': ['videos'],
  '.webm': ['videos'],
  '.mov': ['videos'],
};

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const uploadsDir = ensureUploadsExtracted();
const allFiles = walk(uploadsDir);

const report = [];
const logoCandidates = [];
let copied = 0;
let skippedThumbnail = 0;
let skippedUnknownExt = 0;

for (const absPath of allFiles) {
  const relPath = path.relative(uploadsDir, absPath).split(path.sep).join('/');
  const ext = path.extname(absPath).toLowerCase();

  if (THUMBNAIL_RE.test(absPath) && !protectedOriginals.has(relPath)) {
    skippedThumbnail++;
    report.push({ relPath, skipped: 'thumbnail-variant' });
    continue;
  }

  const destSegments = EXT_DESTINATION[ext];
  if (!destSegments) {
    skippedUnknownExt++;
    report.push({ relPath, skipped: `unknown-extension(${ext})` });
    continue;
  }

  const destRelPath = path.join('public', ...destSegments, relPath);
  const destAbsPath = path.join(REPO_ROOT, destRelPath);
  fs.mkdirSync(path.dirname(destAbsPath), { recursive: true });
  fs.copyFileSync(absPath, destAbsPath);
  copied++;
  report.push({
    relPath,
    newPath: '/' + destSegments.join('/') + '/' + relPath,
    sizeBytes: fs.statSync(absPath).size,
  });

  if (/logo/i.test(path.basename(absPath)) && destSegments[0] === 'images') {
    // Piu' file "logo*" nel tempo (bozze/demo tema): nessuna scelta automatica affidabile,
    // va selezionato a mano il logo definitivo tra i candidati elencati a fine esecuzione.
    logoCandidates.push({ relPath, newPath: '/images/uploads/' + relPath });
  }
}

fs.writeFileSync(cachePath('media-mapping-report.json'), JSON.stringify(report, null, 2));

console.log(
  `Media copiati: ${copied}, scartati (thumbnail WP): ${skippedThumbnail}, ` +
    `scartati (estensione non gestita): ${skippedUnknownExt}, totale esaminati: ${allFiles.length}`
);

if (logoCandidates.length) {
  console.log(
    `\n${logoCandidates.length} file con "logo" nel nome trovati (nessuna scelta automatica, ` +
      `vanno controllati a mano e referenziati esplicitamente da Header/Footer.astro):`
  );
  for (const c of logoCandidates) console.log(`  ${c.newPath}  (originale: ${c.relPath})`);
}
