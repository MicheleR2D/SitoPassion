// Riscrive, dentro l'HTML dei contenuti WP, i riferimenti a media (wp-content/uploads/...)
// e i link interni (passionfitness.it/<slug>/ o /<slug>/) verso i nuovi path/route Astro.
import path from 'node:path';
import { PAGE_SLUG_MAP, BLOG_INDEX_WP_SLUG } from './slug-map.js';

const SITE_HOST_RE = /^https?:\/\/(www\.)?passionfitness\.it/i;
const THUMBNAIL_SUFFIX_RE = /-\d{2,5}x\d{2,5}(-\d+)*(?=\.\w+$)/;
const ALREADY_REWRITTEN_MEDIA_RE = /^\/(images\/uploads|documents|videos)\//;

const MEDIA_ROOT_BY_EXT = {
  '.pdf': '/documents/',
  '.mp4': '/videos/',
  '.webm': '/videos/',
  '.mov': '/videos/',
};

/**
 * Crea il rewriter dei media, usando come base di verita' l'elenco dei file EFFETTIVAMENTE
 * copiati da 04-map-media.js (media-mapping-report.json). Non basta una regex "a naso" per
 * togliere il suffisso "-WIDTHxHEIGHT" delle thumbnail WP: alcuni originali hanno di per se'
 * un nome che contiene quel pattern (es. "allenamento-braccia-curl-1024x640-1.jpg" e'
 * l'unico file realmente esistente, senza contropartita "senza suffisso"). Si prova prima la
 * versione "pulita" (senza suffisso) e si ricade sulla versione originale se e solo se e'
 * quella realmente copiata; se nessuna delle due esiste, si segnala per revisione manuale.
 */
export function makeMediaUrlRewriter(keptRelPaths, unresolvedMedia = []) {
  return function rewriteMediaUrl(url) {
    const marker = 'wp-content/uploads/';
    const idx = url.indexOf(marker);
    if (idx === -1) return url;
    const rawRelPath = url.slice(idx + marker.length).split(/[?#]/)[0];
    const strippedRelPath = rawRelPath.replace(THUMBNAIL_SUFFIX_RE, '');

    let relPath;
    if (keptRelPaths.has(strippedRelPath)) relPath = strippedRelPath;
    else if (keptRelPaths.has(rawRelPath)) relPath = rawRelPath;
    else {
      relPath = strippedRelPath; // best-effort, ma segnalato per revisione
      unresolvedMedia.push(rawRelPath);
    }

    const ext = path.extname(relPath).toLowerCase();
    const root = MEDIA_ROOT_BY_EXT[ext] || '/images/uploads/';
    return root + relPath;
  };
}

/**
 * Crea un rewriter per i link interni, dato l'insieme reale degli slug degli articoli
 * (permalink_structure "/%postname%/", flat). Le pagine invece possono avere permalink
 * gerarchici (vedi slug-map.js): per questo il lookup usa sempre l'ULTIMO segmento del path,
 * che corrisponde al post_name ed e' univoco in tutto il sito indipendentemente dal nesting
 * del link sorgente (nesting corretto o non, dato che i post_name WP sono globalmente unici).
 */
export function makeLinkRewriter({ postSlugs }) {
  return function rewriteLink(url) {
    const isSiteAbsolute = SITE_HOST_RE.test(url);
    if (!isSiteAbsolute && !url.startsWith('/')) return url; // link esterno, invariato

    const withoutHost = url.replace(SITE_HOST_RE, '');
    const [beforeHash, hash = ''] = withoutHost.split('#');
    const [beforePath, queryString = ''] = beforeHash.split('?');
    const trimmedPath = beforePath.replace(/^\/+|\/+$/g, '');
    const query = queryString ? '?' + queryString : '';
    const hashSuffix = hash ? '#' + hash : '';

    if (trimmedPath === '') return '/' + query + hashSuffix;

    const segments = trimmedPath.split('/');
    const leafSlug = segments[segments.length - 1];

    if (segments[0] === 'category') return '/blog/' + query + hashSuffix; // nessun archivio categoria nel nuovo sito
    if (leafSlug === BLOG_INDEX_WP_SLUG) return '/blog/' + query + hashSuffix;
    if (leafSlug in PAGE_SLUG_MAP) return `/${PAGE_SLUG_MAP[leafSlug]}/` + query + hashSuffix;
    if (postSlugs.has(leafSlug)) return `/${leafSlug}/` + query + hashSuffix;

    // Slug non riconosciuto (pagina/post rimosso, o link gia' rotto sul sito originale):
    // lasciato invariato e segnalato dal chiamante per revisione manuale.
    return url;
  };
}

/** Applica le due riscritture (media + link) a tutti gli attributi src="" / href="" dell'HTML. */
export function rewriteHtmlUrls(html, rewriteLink, rewriteMediaUrl) {
  const unresolvedLinks = [];

  const withMedia = html.replace(
    /(src|href)="([^"]*wp-content\/uploads\/[^"]*)"/g,
    (m, attr, url) => `${attr}="${rewriteMediaUrl(url)}"`
  );

  const withLinks = withMedia.replace(/href="([^"]+)"/g, (m, url) => {
    if (ALREADY_REWRITTEN_MEDIA_RE.test(url)) return m; // gia' riscritto sopra come media
    const rewritten = rewriteLink(url);
    if (rewritten === url && (url.startsWith('/') || SITE_HOST_RE.test(url))) {
      unresolvedLinks.push(url);
    }
    return `href="${rewritten}"`;
  });

  // Alcuni widget Elementor (video custom) lasciano l'URL del media come TESTO NUDO nel
  // contenuto (non dentro un attributo src/href) - probabilmente markup del widget non
  // renderizzato lato server. Vanno riscritti comunque: sono file reali ancora referenziabili.
  const withBareMediaUrls = withLinks.replace(
    /(https?:\/\/(?:www\.)?passionfitness\.it)?\/(?:wp-content\/uploads\/)[^\s"'<>)]+/g,
    (m) => rewriteMediaUrl(m)
  );

  return { html: withBareMediaUrls, unresolvedLinks };
}
