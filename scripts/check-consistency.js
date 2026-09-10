// Guard-rail per lo sviluppo: due controlli di coerenza fra pagine che finora
// si facevano a mano con grep pagina per pagina.
//
//   npm run check:consistency
//
// 1. Ordine dei tre box HighlightCards (Orari -> Abbonamenti -> Prova): la
//    convenzione stabilita (vedi sala-pesi.mdx come pagina modello) e' che il
//    box che linka /orari-corsi/ venga prima, poi /abbonamenti/, poi il form
//    "Prova". Riguarda solo le pagine con questo esatto schema a 3 box: le
//    pagine con lo schema a 4 categorie (abbonamenti.mdx, palestra.mdx) non
//    ci rientrano e vengono ignorate.
//
// 2. Stessa pagina di destinazione, immagine diversa: RelatedCard e
//    HighlightCards linkano spesso la stessa pagina (es. /personal-training/)
//    da piu' punti del sito. Se l'immagine usata non e' la stessa ovunque, e'
//    quasi sempre una dimenticanza (l'ultima foto aggiornata non propagata
//    dappertutto) piu' che una scelta voluta - va segnalata, non decisa qui:
//    questo script non sa quale sia "quella giusta", elenca solo il
//    disaccordo perche' lo risolva chi legge.
//
// Uscita 0 se nessun problema; 1 (con elenco) altrimenti.
import fs from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
// Solo contenuto di pagina: i componenti (src/components, src/layouts)
// mettono spesso un esempio d'uso nel commento di intestazione
// (es. RelatedCard.astro: `<RelatedCard ... image="/images/..." />`), che
// altrimenti verrebbe letto come un uso reale e sporcherebbe il controllo 2.
const SCAN_DIRS = ['src/content/pages', 'src/content/blog', 'src/pages'].map((d) =>
  path.join(REPO_ROOT, d)
);
const SCAN_EXTENSIONS = new Set(['.astro', '.mdx']);
// Box di navigazione generici: ogni pagina servizio li illustra apposta con
// una foto in tema con quella pagina (es. "Scopri gli orari" su Hyrox mostra
// una foto Hyrox, su Sala Pesi una cyclette) - qui la differenza e' voluta,
// non e' il caso da controllare al punto 2.
const HUB_HREFS = ['/orari-corsi/', '/abbonamenti/'];

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

function classifyHref(href) {
  if (href.includes('/orari-corsi/')) return 'orari';
  if (href.includes('/abbonamenti/')) return 'abbonamenti';
  if (href.includes('n8ndevelop.it')) return 'prova';
  return 'other';
}

const files = SCAN_DIRS.filter((d) => fs.existsSync(d)).flatMap((d) => walk(d));
let orderFailures = 0;
const imageByHref = new Map(); // href -> [{image, file, line}]

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(REPO_ROOT, file);

  // --- 1. Ordine dei box HighlightCards ---
  for (const hcMatch of text.matchAll(/<HighlightCards\s+items=\{\[([\s\S]*?)\]\}/g)) {
    const body = hcMatch[1];
    const items = [];
    for (const itemMatch of body.matchAll(/\{([^{}]*)\}/g)) {
      const itemBody = itemMatch[1];
      const titleMatch = itemBody.match(/title:\s*['"]([^'"]+)['"]/);
      const hrefMatch = itemBody.match(/href:\s*['"]([^'"]+)['"]/);
      if (!hrefMatch) continue;
      items.push({
        title: titleMatch ? titleMatch[1] : '(senza titolo)',
        href: hrefMatch[1],
        kind: classifyHref(hrefMatch[1]),
        index: hcMatch.index + itemMatch.index,
      });
    }
    const kinds = items.map((i) => i.kind);
    const isThreeBoxPattern =
      items.length === 3 && ['orari', 'abbonamenti', 'prova'].every((k) => kinds.includes(k));
    if (isThreeBoxPattern) {
      const expected = ['orari', 'abbonamenti', 'prova'];
      if (kinds.join(',') !== expected.join(',')) {
        orderFailures++;
        console.error(`FALLITO  ordine box in ${rel}:${lineNumberAt(text, hcMatch.index)}`);
        console.error(`         trovato:  ${items.map((i) => `${i.kind} (${i.title})`).join(' -> ')}`);
        console.error(`         atteso:   orari -> abbonamenti -> prova\n`);
      }
    }
  }

  // --- 2. Immagine per pagina di destinazione (RelatedCard + HighlightCards) ---
  const linkedImageMatches = [
    ...text.matchAll(/<RelatedCard\b[^>]*?\/>/gs),
  ].map((m) => ({ tag: m[0], index: m.index }));

  for (const { tag, index } of linkedImageMatches) {
    const href = tag.match(/href="([^"]+)"/)?.[1];
    const image = tag.match(/image="([^"]+)"/)?.[1];
    if (!href || !image || !href.startsWith('/')) continue;
    if (!imageByHref.has(href)) imageByHref.set(href, []);
    imageByHref.get(href).push({ image, file: rel, line: lineNumberAt(text, index) });
  }

  for (const hcMatch of text.matchAll(/<HighlightCards\s+items=\{\[([\s\S]*?)\]\}/g)) {
    const body = hcMatch[1];
    for (const itemMatch of body.matchAll(/\{([^{}]*)\}/g)) {
      const itemBody = itemMatch[1];
      const hrefMatch = itemBody.match(/href:\s*['"]([^'"]+)['"]/);
      const imageMatch = itemBody.match(/image:\s*['"]([^'"]+)['"]/);
      if (!hrefMatch || !imageMatch) continue;
      const href = hrefMatch[1];
      if (!href.startsWith('/')) continue; // salta gli href verso il form esterno "Prova"
      if (HUB_HREFS.includes(href)) continue; // vedi commento su HUB_HREFS
      if (!imageByHref.has(href)) imageByHref.set(href, []);
      imageByHref
        .get(href)
        .push({ image: imageMatch[1], file: rel, line: lineNumberAt(text, hcMatch.index + itemMatch.index) });
    }
  }
}

let imageMismatches = 0;
for (const [href, usages] of imageByHref) {
  const distinctImages = new Set(usages.map((u) => u.image));
  if (distinctImages.size <= 1) continue;
  imageMismatches++;
  console.error(`FALLITO  immagini diverse per la stessa pagina ${href}:`);
  for (const u of usages) {
    console.error(`         ${u.image}  <-  ${u.file}:${u.line}`);
  }
  console.error('');
}

console.log(
  `Controllati ${files.length} file: ${orderFailures} ordini box sbagliati, ${imageMismatches} pagine con immagini disallineate.\n`
);

if (orderFailures === 0 && imageMismatches === 0) {
  console.log('OK: nessun problema di coerenza trovato.');
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
