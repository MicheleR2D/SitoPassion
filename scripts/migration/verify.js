// Guard-rail ripetibile: conta i contenuti prodotti dalla pipeline e verifica che non
// restino riferimenti a media/link non risolti nei file .mdx generati.
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..', '..');
const EXPECTED = { pages: 16, posts: 78, redirects: 54 };

function listMdx(dir) {
  const out = [];
  function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.mdx')) out.push(full);
    }
  }
  walk(dir);
  return out;
}

let failed = false;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failed = true;
  console.log(`${ok ? 'OK' : 'FAIL'}  ${label}: ${actual} (attesi ${expected})`);
}

const pageFiles = listMdx(path.join(REPO_ROOT, 'src/content/pages'));
const postFiles = listMdx(path.join(REPO_ROOT, 'src/content/blog'));
check('pagine (.mdx in src/content/pages)', pageFiles.length, EXPECTED.pages);
check('articoli (.mdx in src/content/blog)', postFiles.length, EXPECTED.posts);

const redirectsPath = path.join(REPO_ROOT, 'public/_redirects');
const redirectLines = fs
  .readFileSync(redirectsPath, 'utf8')
  .split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#'));
check('redirect (righe non-commento in public/_redirects)', redirectLines.length, EXPECTED.redirects);

let missingMedia = 0;
let residualWpContent = 0;
let residualLocalLinkStale = 0;

for (const file of [...pageFiles, ...postFiles]) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(REPO_ROOT, file);

  if (/wp-content/.test(text)) {
    residualWpContent++;
    console.log(`FAIL  residuo "wp-content" in ${rel}`);
  }

  const refs = new Set();
  const cover = text.match(/coverImage:\s*(.+)/);
  if (cover) refs.add(cover[1].trim());
  for (const m of text.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) refs.add(m[1]);
  for (const m of text.matchAll(/(?:src|href)="(\/(?:images|documents|videos)\/[^"]+)"/g)) {
    refs.add(m[1]);
  }
  for (const ref of refs) {
    const clean = ref.replace(/^\//, '').split(/[?#]/)[0];
    if (!fs.existsSync(path.join(REPO_ROOT, 'public', clean))) {
      missingMedia++;
      console.log(`FAIL  media mancante in ${rel} -> ${ref}`);
    }
  }
}

check('riferimenti "wp-content" residui', residualWpContent, 0);
check('riferimenti media mancanti su disco', missingMedia, 0);

if (failed) {
  console.error('\nVerifica FALLITA: vedi i FAIL sopra.');
  process.exitCode = 1;
} else {
  console.log('\nVerifica OK: tutti i conteggi e i controlli sono a posto.');
}
