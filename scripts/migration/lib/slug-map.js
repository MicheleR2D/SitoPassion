// Mappa esplicita slug WordPress (post_name, univoco per tutto il sito) -> path Astro,
// verificata sia da permalink_structure (/%postname%/) sia dai permalink reali cache in
// wp_yoast_indexable. Le pagine WP usano permalink GERARCHICI basati su post_parent
// (non semplicemente flat come i post): "sala-pesi" e "corsi-fitness" hanno post_parent = 3969
// (palestra), quindi il loro URL reale e' /palestra/sala-pesi/ e /palestra/corsi-fitness/,
// non /sala-pesi/ e /corsi-fitness/. Tutte le altre pagine hanno post_parent = 0 (top-level).
export const PAGE_SLUG_MAP = {
  home: 'home',
  palestra: 'palestra',
  'i-love-my-trainer': 'i-love-my-trainer',
  'pilates-reformer': 'pilates-reformer',
  crossfit: 'crossfit',
  'orari-corsi': 'orari-corsi',
  contatti: 'contatti',
  'sala-pesi': 'palestra/sala-pesi',
  'corsi-fitness': 'palestra/corsi-fitness',
  'informativa-privacy': 'informativa-privacy',
  'informativa-estesa-sullutilizzo-dei-cookie': 'informativa-estesa-sullutilizzo-dei-cookie',
  'prova-passion-fitness': 'prova-passion-fitness',
  hyrox: 'hyrox',
  pilates: 'pilates',
  abbonamenti: 'abbonamenti',
  'porta-un-amico': 'porta-un-amico',
};

// Gestita a parte: e' l'indice /blog/, non una voce della collection "pages" con route propria.
export const BLOG_INDEX_WP_SLUG = 'blog';

// Gestita a parte: contenuto libero non strutturato -> src/content/settings/footer.json,
// non e' una pagina/route pubblica.
export const FOOTER_WP_ID = 3977;
