// Rimuove i marcatori di blocco Gutenberg (<!-- wp:xxx {...} --> / <!-- /wp:xxx -->),
// mantenendo l'HTML reale contenuto in mezzo: i blocchi core producono gia' HTML semantico
// valido, non serve un parser Gutenberg vero e proprio.
const WP_COMMENT_RE = /<!--\s*\/?wp:[a-zA-Z0-9/_-]*(\s+\{[\s\S]*?\})?\s*(\/)?-->/g;

export function stripGutenbergComments(html) {
  return html.replace(WP_COMMENT_RE, '').trim();
}

// Alcune pagine incorporano un blocco <style> CSS grezzo (residuo di widget Elementor/HTML
// custom incollato nell'editor): turndown non ha una regola per <style>/<script>, quindi il
// loro TESTO finisce come contenuto visibile in markdown - e le parentesi graffe del CSS
// rompono poi il parser MDX. Vanno rimossi interamente (tag + contenuto), non solo i tag.
const STYLE_OR_SCRIPT_RE = /<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi;

export function stripStyleAndScriptTags(html) {
  return html.replace(STYLE_OR_SCRIPT_RE, '').trim();
}
