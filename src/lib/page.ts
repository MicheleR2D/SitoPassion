import { getEntry, render } from 'astro:content';

/**
 * Carica una pagina della collection `pages` e ne rende il contenuto.
 *
 * `getEntry` restituisce `undefined` quando l'id non esiste (file .mdx
 * rinominato o rimosso): passarlo a `render()` produceva un errore di build
 * incomprensibile - e un errore di tipo, dato che tutte le pagine lo
 * facevano senza controllo. Qui il caso viene intercettato con un messaggio
 * che dice quale file manca.
 */
export async function loadPage(id: string) {
  const page = await getEntry('pages', id);
  if (!page) {
    throw new Error(
      `Pagina "${id}" non trovata: manca src/content/pages/${id}.mdx (o l'id non corrisponde al percorso del file).`
    );
  }
  const { Content } = await render(page);
  return { page, Content };
}
