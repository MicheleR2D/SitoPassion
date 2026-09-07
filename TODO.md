# TODO

Cose emerse dagli audit ma non ancora risolte — ognuna richiede una decisione o un dato da te prima di poter procedere.

## Immagini

- [ ] **Migrare a `<Image />`/`astro:assets`** (conversione automatica WebP/AVIF + `srcset` responsivo per le 153 immagini usate sul sito). Rimandato di proposito: molte immagini stock verranno probabilmente sostituite a breve, non ha senso ottimizzare la pipeline prima. Quando le immagini definitive sono pronte, è un cambio architetturale che tocca: spostamento da `public/images/` a `src/assets/` (o schema `image()` delle content collections), firma delle props di 7 componenti (Hero, ContentRow, HighlightCards, PostCard, RelatedCard, FeatureShowcase, CtaSplit), compatibilità col media picker di Decap CMS.

## Integrazioni / e-commerce

- [ ] **PerfectGym: `productId` duplicato.** Nel pacchetto "10 sedute" di Personal Training (`src/content/pages/abbonamenti.mdx`), le varianti 60' e 30' puntano entrambe a `productId=95` — un cliente che sceglie la seduta da 30' verrebbe mandato al prodotto sbagliato. Serve il productId corretto dal pannello PerfectGym.
- [ ] **Typeform morto su `/prova-passion-fitness/`.** I 5 CTA della pagina (link a `zgcrbhl8m6b.typeform.com/PassionFitness?...`) risolvono alla pagina generica di marketing di Typeform: il form non esiste più. La pagina non è linkata da nessuna parte del sito — sembra la landing page di una campagna Google Ads (`utm_source=GAds`), quindi se la campagna è ancora attiva sta sprecando budget pubblicitario. Serve un link Typeform aggiornato (o sostituire i CTA con il form n8n usato altrove sul sito).

## Contenuti / link

- [ ] **4 articoli del blog** linkano ancora al vecchio dominio live (`passionfitness.it/dt_workouts/...`, `passionfitness.it/functional-training/`) invece che a route interne — non riscritti durante la migrazione.
- [ ] **Link "MOG e Codice di Condotta"** nel footer punta ancora al vecchio dominio (`passionfitness.it/3-codice-di-condotta_mog...`): il documento non è stato migrato sul nuovo sito.
- [ ] **UTM stale**: un parametro su `/prova-passion-fitness/` dice ancora `GAds_btn_ILMT` ("I Love My Trainer", il vecchio nome della pagina Personal Training). Solo cosmetico/analytics, non rompe nulla.

## Redirect vecchio sito → nuovo sito

- [ ] **Confermare 3 redirect**: `/i-love-my-trainer/` → `/personal-training/` (alta confidenza, da confermare); `/crossfit/` → dove? (pagina WP esistita, mai migrata); `/pilates/` → dove? (idem).
- [ ] **Serve l'export Google Search Console → Copertura** (o una sitemap.xml salvata prima della migrazione) per completare il confronto vecchie-URL/nuove-URL e generare il resto dei redirect 301 in `public/_redirects`. Attualmente ci sono solo i 53 redirect reali già impostati sul sito WP (plugin Redirection) — mancano le URL indicizzate che non avevano già un redirect.

## Minori

- [ ] **Hero di Orari Corsi**: unico hero senza immagine/video, il padding inferiore è 24px invece dei consueti 56px delle altre pagine. Valutare se uniformare aggiungendo un'immagine di sfondo o accettando la differenza.
- [ ] **`/palestra/` (hub Fitness)**: il copy attuale è stato riassemblato da testi già presenti altrove sul sito (non scritto da zero) — va riletto ed eventualmente personalizzato.
