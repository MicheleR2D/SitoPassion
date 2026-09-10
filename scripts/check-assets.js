// Guard-rail per lo sviluppo (non legato alla migrazione una tantum): scansiona
// tutto il sorgente del sito (pagine, componenti, layout, contenuti .mdx) alla
// ricerca di riferimenti a file statici (immagini, video, documenti, font) e
// verifica che ognuno esista davvero sotto public/. Prende sia gli attributi
// HTML (`src="/images/..."`) sia le proprietà negli oggetti JS/Astro
// (`image: '/images/...'`, `video: "/videos/..."`) — il bug che il controllo
// di migrazione (verify.js) non intercettava, perche' guarda solo il primo
// caso.
//
//   npm run check:assets
//
// Uscita 0 se tutti i riferimenti risolvono; 1 (con elenco) altrimenti.
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const SCAN_EXTENSIONS = new Set(['.astro', '.mdx', '.md', '.ts', '.js']);

// Estensioni dei soli asset statici serviti da public/: un href a una ROTTA
// del sito (es. "/palestra/sala-pesi/") non ha estensione e viene ignorato di
// proposito - qui si controllano solo i file, non i link interni.
const ASSET_EXT_PATTERN =
  '(?:jpe?g|png|gif|svg|webp|avif|ico|mp4|webm|mov|pdf|woff2?|ttf|otf|css)';
// Cattura il contenuto fra apici (singoli, doppi, o backtick) che inizia con
// "/" (percorso assoluto da public/) e finisce con una delle estensioni sopra.
// Esclude "//..." (URL protocol-relative) e "http(s)://..." grazie al
// `(?!/)` dopo la prima barra.
const ASSET_REF_PATTERN = new RegExp(
  String.raw`['"\`](/(?!/)[^'"\`\s)]+\.${ASSET_EXT_PATTERN})(?:[?#][^'"\`\s)]*)?['"\`]`,
  'gi'
);

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split('\n').length;
}

// Poster dei video: ContentRow.astro deriva il percorso a runtime
// (`/images/poster/<nome-video-senza-estensione>.webp`, vedi il commento li'),
// quindi non e' mai una stringa letterale che ASSET_REF_PATTERN possa
// intercettare. Lo ricostruiamo qui a partire da ogni `video:`/`heroVideo:`
// trovato, cosi' un video nuovo senza il suo poster (generato a mano con
// scripts/genera-poster.sh) non passa inosservato.
const VIDEO_REF_PATTERN = /(?:video|heroVideo)\s*[:=]\s*['"`](\/videos\/[^'"`\s]+)['"`]/g;

const files = walk(SRC_DIR);
const missing = [];
let totalRefs = 0;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(REPO_ROOT, file);
  const seen = new Set();

  for (const match of text.matchAll(ASSET_REF_PATTERN)) {
    const ref = match[1];
    totalRefs++;
    const diskPath = path.join(PUBLIC_DIR, ref.replace(/^\//, ''));
    if (!fs.existsSync(diskPath)) {
      const key = ref + '@' + match.index;
      if (seen.has(key)) continue;
      seen.add(key);
      missing.push({ file: rel, line: lineNumberAt(text, match.index), ref });
    }
  }

  for (const match of text.matchAll(VIDEO_REF_PATTERN)) {
    const videoRef = match[1];
    totalRefs++;
    const baseName = path.basename(videoRef).replace(/\.[^.]+$/, '');
    const posterRef = `/images/poster/${baseName}.webp`;
    const diskPath = path.join(PUBLIC_DIR, 'images/poster', `${baseName}.webp`);
    if (!fs.existsSync(diskPath)) {
      missing.push({
        file: rel,
        line: lineNumberAt(text, match.index),
        ref: `${posterRef}  (poster derivato da ${videoRef})`,
      });
    }
  }
}

console.log(`Controllati ${files.length} file sorgente, ${totalRefs} riferimenti ad asset trovati.\n`);

if (missing.length === 0) {
  console.log('OK: tutti i riferimenti ad asset statici risolvono a un file reale in public/.');
  process.exitCode = 0;
} else {
  console.error(`FALLITO: ${missing.length} riferimenti ad asset mancanti su disco:\n`);
  for (const m of missing) {
    console.error(`  ${m.file}:${m.line}  ->  ${m.ref}`);
  }
  process.exitCode = 1;
}
