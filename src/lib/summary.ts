// Riassunti per la meta description e per le card del blog.
//
// Perche' esiste: nessuna pagina ha `seo.description` e nessun articolo ha
// `excerpt` nel frontmatter, quindi 88 pagine su 96 uscivano senza
// <meta name="description">. Invece di riempire a mano 74 frontmatter, la
// descrizione si ricava dal contenuto che c'e' gia'; resta comunque la
// precedenza a `seo.description`/`excerpt` quando vengono compilati.

const MAX_LENGTH = 160;

/** Taglia su un confine di parola e aggiunge i puntini solo se serve. */
function truncate(text: string, max = MAX_LENGTH): string {
  if (text.length <= max) return text;
  // -1: i puntini aggiunti sotto contano come carattere, altrimenti il
  // risultato finale supera max di uno.
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

// " | Passion Fitness", sempre appeso da SEO.astro al title che riceve.
const BRAND_SUFFIX_LENGTH = 19;
const TITLE_MAX = 60;

/**
 * Adatta un titolo reale (H1 di una pagina, titolo di un articolo) al budget
 * del <title> tag, tenendo conto del suffisso di brand che SEO.astro
 * appende sempre. Non aggiunge parole: taglia su un confine di parola,
 * senza puntini (in SERP Google tronca comunque visivamente).
 *
 * Va usata solo per il titolo *ricavato dal contenuto* — se la pagina ha
 * gia' un `seo.title` esplicito in frontmatter, quello va lasciato
 * intoccato: e' una scelta editoriale, non un fallback da correggere.
 */
export function seoTitle(rawTitle: string): string {
  const budget = TITLE_MAX - BRAND_SUFFIX_LENGTH;
  if (rawTitle.length <= budget) return rawTitle;
  const cut = rawTitle.slice(0, budget);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > budget * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/** Testo semplice a partire da HTML inline (es. heroText, che accetta <br />). */
export function textFromHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&(?:quot|#34);/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text ? truncate(text) : undefined;
}

// Sotto questa soglia si prova ad aggiungere il paragrafo successivo, invece
// di fermarsi al primo: una sola frase spesso non arriva a 140 caratteri
// (il minimo consigliato per una meta description), ma il paragrafo dopo e'
// comunque testo reale dell'articolo, non inventato.
const MIN_TARGET = 140;

/**
 * Primi paragrafi utili del corpo markdown/MDX di un contenuto, concatenati
 * finche' non si arriva a una lunghezza decente per una meta description.
 * Scarta import, direttive JSX, titoli, immagini, tabelle e citazioni: si
 * ferma comunque al primo titolo (##), per non saltare da un paragrafo
 * introduttivo a uno di una sezione successiva non correlata.
 */
export function summaryFromBody(body: string | undefined): string | undefined {
  if (!body) return undefined;

  const withoutJsx = body
    // blocchi di componenti su piu' righe (<PricingGroup ... />)
    .replace(/<[A-Z][\s\S]*?\/>/g, '')
    .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '');

  let collected = '';

  for (const rawBlock of withoutJsx.split(/\n\s*\n/)) {
    const block = rawBlock.trim();
    if (!block) continue;
    if (/^(import|export)\s/.test(block)) continue;
    if (block.startsWith('#')) {
      // Un titolo chiude la raccolta: quel che c'e' prima e' l'introduzione,
      // dopo e' un'altra sezione.
      if (collected) break;
      continue;
    }
    if (block.startsWith('|') || block.startsWith('>')) continue;
    if (block.startsWith('!')) continue;
    if (block.startsWith('<')) continue;
    if (/^[-*]\s/.test(block)) continue;
    // Blocco interamente in corsivo/grassetto (_Articolo a cura di..._): e'
    // una didascalia o una firma, non prosa da citare.
    if (/^([*_]).+\1$/.test(block)) continue;
    // Blocco che e' interamente un link markdown ([Prova ora](url)): e' una
    // CTA a se stante, non una frase descrittiva.
    if (/^\[[^\]]+\]\([^)]+\)$/.test(block)) continue;

    const text = block
      // link markdown: resta l'etichetta
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Blocchi troppo corti (una didascalia, una sigla) non descrivono nulla.
    if (text.length < 20) continue;

    collected = collected ? `${collected} ${text}` : text;
    if (collected.length >= MIN_TARGET) break;
  }

  return collected ? truncate(collected) : undefined;
}

/**
 * Descrizione di una pagina statica: parte dal testo dell'hero (breve per
 * design, e' un occhiello) e, se non arriva a una lunghezza decente, lo
 * allunga col primo paragrafo del corpo — sempre testo reale della pagina,
 * mai testo scritto da zero.
 */
export function pageDescription(heroText: string | undefined, body: string | undefined): string | undefined {
  const hero = textFromHtml(heroText);
  if (!hero) return summaryFromBody(body);
  if (hero.length >= MIN_TARGET) return hero;

  const rest = summaryFromBody(body);
  if (!rest) return hero;

  const combined = rest.startsWith(hero) ? rest : `${hero} ${rest}`;
  return truncate(combined);
}
