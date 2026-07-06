import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

function createTurndownService() {
  const service = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  service.use(gfm); // tabelle GitHub-flavored (i post WP a volte ne contengono)
  service.keep(['iframe', 'video', 'audio']); // embed non convertibili: mantenuti come HTML raw (richiede .mdx)

  // Le figcaption "xr:d:...." sono metadati EXIF/Google Photos finiti per errore nel testo
  // (non contenuto editoriale reale): vanno scartate, non convertite in markdown.
  service.addRule('dropExifFigcaption', {
    filter: (node) => node.nodeName === 'FIGCAPTION' && /^xr:d:/i.test(node.textContent.trim()),
    replacement: () => '',
  });

  return service;
}

const service = createTurndownService();

// Rete di sicurezza: MDX interpreta "{"/"}" fuori dai code-fence come inizio di un'espressione
// JS. Il contenuto migrato e' prosa, non JSX: qualunque graffa letterale rimasta (es. testo o
// CSS non previsti da stripStyleAndScriptTags) va escapata per non rompere la build in modo
// silenzioso e imprevedibile. Non tocca il contenuto dentro i fence ``` per non alterare
// eventuale codice riportato negli articoli.
function escapeMdxBraces(markdown) {
  const segments = markdown.split(/(```[\s\S]*?```)/);
  return segments
    .map((segment, i) => (i % 2 === 1 ? segment : segment.replace(/([{}])/g, '\\$1')))
    .join('');
}

export function htmlToMarkdown(html) {
  return escapeMdxBraces(service.turndown(html).trim());
}
