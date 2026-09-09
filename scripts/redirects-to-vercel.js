/**
 * Genera `vercel.json` a partire da `public/_redirects`.
 *
 * `public/_redirects` e' il formato di Netlify. Il sito e' pubblicato su
 * Vercel, che quel file non lo legge: senza questa conversione i 301 della
 * migrazione non esistono in produzione e ogni vecchio indirizzo WordPress
 * ancora indicizzato risponderebbe 404.
 *
 * `_redirects` resta la fonte unica — si continua a modificare quello (o a
 * rigenerarlo con 05-generate-redirects.js) e poi si rilancia questo script.
 * Tenere entrambi i file significa anche che i redirect funzionano su
 * qualunque dei due host: ognuno legge il proprio e ignora l'altro.
 *
 *   node scripts/redirects-to-vercel.js
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'public/_redirects';
const OUT = 'vercel.json';

const righe = readFileSync(SRC, 'utf8')
  .split('\n')
  .map((r) => r.trim())
  .filter((r) => r && !r.startsWith('#'));

const conQuery = [];
const semplici = [];

for (const riga of righe) {
  const [sorgente, destinazione, codice] = riga.split(/\s+/);
  if (!sorgente || !destinazione) throw new Error(`Riga non interpretabile: ${riga}`);

  // 301 -> permanent:true, 302 -> permanent:false. Il codice e' opzionale in
  // Netlify (default 301); qui lo trattiamo allo stesso modo.
  const permanent = (codice ?? '301') !== '302';

  // Netlify confronta i parametri di query scritti nella sorgente; Vercel
  // vuole gli stessi vincoli come clausole `has`, con la sorgente ridotta al
  // solo percorso.
  const [percorso, query] = sorgente.split('?');
  if (query) {
    conQuery.push({
      source: percorso,
      has: [...new URLSearchParams(query)].map(([key, value]) => ({ type: 'query', key, value })),
      destination: destinazione,
      permanent,
    });
    continue;
  }

  // Lo splat di Netlify (`//*`) diventa un parametro nominato in Vercel, che
  // usa path-to-regexp.
  semplici.push({
    source: percorso.replace(/\/\*$/, '/:resto*'),
    destination: destinazione,
    permanent,
  });
}

// Le regole con `has` vanno prima: Vercel applica la prima che combacia, e una
// regola sullo stesso percorso senza vincoli le ruberebbe la precedenza.
const redirects = [...conQuery, ...semplici];

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  // Coerente con `trailingSlash: 'always'` in astro.config.mjs: i canonical, la
  // sitemap e le destinazioni qui sotto finiscono tutti con `/`, e senza questa
  // riga Vercel servirebbe la stessa pagina anche senza barra finale.
  trailingSlash: true,
  redirects,
};

writeFileSync(OUT, JSON.stringify(config, null, 2) + '\n');
console.log(`${OUT}: ${redirects.length} redirect (${conQuery.length} con vincoli di query).`);
