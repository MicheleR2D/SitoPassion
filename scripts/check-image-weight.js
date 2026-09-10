// Guard-rail per lo sviluppo: ogni immagine referenziata da src/ (pagine,
// componenti, contenuti .mdx) viene controllata sul disco - se supera una
// soglia va probabilmente ricompressa o sostituita con una variante "-scaled"
// (la convenzione gia' in uso nel progetto per gli originali troppo pesanti).
// Non tocca le immagini presenti in public/ ma mai referenziate: quelle sono
// materiale grezzo in attesa di essere usato (es. public/images/nuove/), non
// e' compito di questo controllo deciderne la sorte.
//
//   npm run check:images
//
// Uscita 0 se tutte le immagini referenziate sono sotto la soglia di errore;
// 1 (con elenco) se almeno una la supera. Fra le due soglie stampa un avviso
// ma non fa fallire il comando.
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const SRC_DIR = path.join(REPO_ROOT, 'src');
const PUBLIC_DIR = path.join(REPO_ROOT, 'public');
const SCAN_EXTENSIONS = new Set(['.astro', '.mdx', '.md', '.ts', '.js']);

// Solo immagini raster: gli SVG sono vettoriali (il peso non dipende dalle
// dimensioni visive) e non hanno senso in questo controllo.
const IMAGE_EXT_PATTERN = '(?:jpe?g|png|gif|webp|avif)';
const IMAGE_REF_PATTERN = new RegExp(
  String.raw`['"\`](/(?!/)[^'"\`\s)]+\.${IMAGE_EXT_PATTERN})(?:[?#][^'"\`\s)]*)?['"\`]`,
  'gi'
);

const WARN_BYTES = 500 * 1024; // 500 KB
const FAIL_BYTES = 2 * 1024 * 1024; // 2 MB

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

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

const files = walk(SRC_DIR);
const byImage = new Map(); // ref -> { size, usages: [{file, line}] }

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(REPO_ROOT, file);

  for (const match of text.matchAll(IMAGE_REF_PATTERN)) {
    const ref = match[1];
    const diskPath = path.join(PUBLIC_DIR, ref.replace(/^\//, ''));
    if (!fs.existsSync(diskPath)) continue; // gia' segnalato da check:assets

    if (!byImage.has(ref)) {
      byImage.set(ref, { size: fs.statSync(diskPath).size, usages: [] });
    }
    byImage.get(ref).usages.push({ file: rel, line: lineNumberAt(text, match.index) });
  }
}

const warnings = [];
const failures = [];
for (const [ref, info] of byImage) {
  if (info.size >= FAIL_BYTES) failures.push({ ref, ...info });
  else if (info.size >= WARN_BYTES) warnings.push({ ref, ...info });
}
failures.sort((a, b) => b.size - a.size);
warnings.sort((a, b) => b.size - a.size);

console.log(`Controllate ${byImage.size} immagini referenziate (soglia avviso ${formatKB(WARN_BYTES)}, soglia errore ${formatKB(FAIL_BYTES)}).\n`);

if (warnings.length > 0) {
  console.log(`AVVISO: ${warnings.length} immagini fra le due soglie (funzionano ma andrebbero alleggerite):`);
  for (const w of warnings) {
    console.log(`  ${formatKB(w.size).padStart(8)}  ${w.ref}  (${w.usages[0].file}:${w.usages[0].line}${w.usages.length > 1 ? ` +${w.usages.length - 1} altrove` : ''})`);
  }
  console.log('');
}

if (failures.length === 0) {
  console.log('OK: nessuna immagine referenziata supera la soglia di errore.');
  process.exitCode = 0;
} else {
  console.error(`FALLITO: ${failures.length} immagini sopra ${formatKB(FAIL_BYTES)}:\n`);
  for (const f of failures) {
    console.error(`  ${formatKB(f.size).padStart(8)}  ${f.ref}`);
    for (const u of f.usages) console.error(`            usata in ${u.file}:${u.line}`);
  }
  console.error('\nRicomprimi o sostituisci con una variante "-scaled" (vedi le altre immagini gia\' ottimizzate in public/images/).');
  process.exitCode = 1;
}
