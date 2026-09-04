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
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
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

/**
 * Primo paragrafo utile del corpo markdown/MDX di un contenuto.
 * Scarta import, direttive JSX, titoli, immagini, tabelle e citazioni: resta
 * la prima frase di prosa, che e' quello che serve come descrizione.
 */
export function summaryFromBody(body: string | undefined): string | undefined {
  if (!body) return undefined;

  const withoutJsx = body
    // blocchi di componenti su piu' righe (<PricingGroup ... />)
    .replace(/<[A-Z][\s\S]*?\/>/g, '')
    .replace(/<[A-Z][^>]*>[\s\S]*?<\/[A-Z][^>]*>/g, '');

  for (const rawBlock of withoutJsx.split(/\n\s*\n/)) {
    const block = rawBlock.trim();
    if (!block) continue;
    if (/^(import|export)\s/.test(block)) continue;
    if (block.startsWith('#')) continue;
    if (block.startsWith('|') || block.startsWith('>')) continue;
    if (block.startsWith('!')) continue;
    if (block.startsWith('<')) continue;
    if (/^[-*]\s/.test(block)) continue;

    const text = block
      // link markdown: resta l'etichetta
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_`]/g, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Blocchi troppo corti (una didascalia, una sigla) non descrivono nulla.
    if (text.length < 40) continue;
    return truncate(text);
  }

  return undefined;
}
