# TODO

Cose emerse dagli audit ma non ancora risolte — ognuna richiede una decisione o un dato da te prima di poter procedere.

## Immagini

- [ ] **Migrare a `<Image />`/`astro:assets`** (conversione automatica WebP/AVIF + `srcset` responsivo per le 153 immagini usate sul sito). Rimandato di proposito: molte immagini stock verranno probabilmente sostituite a breve, non ha senso ottimizzare la pipeline prima. Quando le immagini definitive sono pronte, è un cambio architetturale che tocca: spostamento da `public/images/` a `src/assets/` (o schema `image()` delle content collections), firma delle props di 7 componenti (Hero, ContentRow, HighlightCards, PostCard, RelatedCard, FeatureShowcase, CtaSplit), compatibilità col media picker di Decap CMS.

## Integrazioni / e-commerce

- [ ] **PerfectGym: `productId` duplicato.** Nel pacchetto "10 sedute" di Personal Training (`src/content/pages/abbonamenti.mdx`), le varianti 60' e 30' puntano entrambe a `productId=95` — un cliente che sceglie la seduta da 30' verrebbe mandato al prodotto sbagliato. Serve il productId corretto dal pannello PerfectGym.
- [ ] **Typeform morto su `/prova-passion-fitness/`.** I 5 CTA della pagina (link a `zgcrbhl8m6b.typeform.com/PassionFitness?...`) risolvono alla pagina generica di marketing di Typeform: il form non esiste più. La pagina non è linkata da nessuna parte del sito — sembra la landing page di una campagna Google Ads (`utm_source=GAds`), quindi se la campagna è ancora attiva sta sprecando budget pubblicitario. Serve un link Typeform aggiornato (o sostituire i CTA con il form n8n usato altrove sul sito).

## Contenuti / link

- [ ] **4 articoli del blog** linkano ancora al vecchio dominio live (`passionfitness.it/dt_workouts/...`, `passionfitness.it/functional-training/`) invece che a route interne — non riscritti durante la migrazione.
- [ ] **Link "MOG e Codice di Condotta"** nel footer (`src/components/layout/Footer.astro`) punta ancora al vecchio dominio (`passionfitness.it/3-codice-di-condotta_mog...`). **Il PDF è già stato migrato** — esiste in `public/documents/2025/01/3-CODICE-DI-CONDOTTA_MOG-DETERMINA-MODULO-SEGNALAZIONE-TUSCOLANA-S.S.D.-ARL-.pdf` — basta aggiornare l'`href` per puntare lì.
- [ ] **UTM stale**: un parametro su `/prova-passion-fitness/` dice ancora `GAds_btn_ILMT` ("I Love My Trainer", il vecchio nome della pagina Personal Training). Solo cosmetico/analytics, non rompe nulla.

## Redirect vecchio sito → nuovo sito

- [ ] **Confermare 3 redirect**: `/i-love-my-trainer/` → `/personal-training/` (alta confidenza, da confermare); `/crossfit/` → dove? (pagina WP esistita, mai migrata); `/pilates/` → dove? (idem).
- [ ] **Serve l'export Google Search Console → Copertura** (o una sitemap.xml salvata prima della migrazione) per completare il confronto vecchie-URL/nuove-URL e generare il resto dei redirect 301 in `public/_redirects`. Attualmente ci sono solo i 53 redirect reali già impostati sul sito WP (plugin Redirection) — mancano le URL indicizzate che non avevano già un redirect.

## Compatibilità cross-browser

- [ ] **`:has()` diffuso in `Hero.astro`** (13 occorrenze) controlla l'intero layout dell'hero su ogni pagina (colonna rossa, colori del testo, gradiente). Supportato da Safari 15.4+, Chrome/Edge 105+, ma **Firefox solo da dicembre 2023 (v121)** — su un browser senza supporto l'hero perderebbe la colonna rossa e i colori del testo, senza errori visibili. Nessun fallback presente. Testare su Firefox non recentissimo, se rilevante per il pubblico del sito.
- [ ] **`dvh` senza fallback `vh`** in `Header.astro:196` (altezza del pannello menu mobile). Altrove sul sito (`Hero.astro`, `HighlightCards.astro`) c'è sempre un `height: …vh` dichiarato prima come fallback; qui manca. Su un browser senza supporto a `dvh` (pre-2022) il pannello del menu mobile potrebbe non riempire correttamente lo schermo. Fix a basso rischio quando si vuole: aggiungere `height: calc(100vh - 100%);` subito prima della riga con `dvh`.
- [ ] **Iframe del form "Porta un Amico"** (`porta-un-amico.mdx`) è cross-origin (`automazione.n8ndevelop.it` embeddato su `passionfitness.it`): Safari (Intelligent Tracking Prevention) blocca in modo aggressivo cookie/storage di terze parti nei frame cross-origin. Se il form n8n si appoggia a quel tipo di storage per il proprio stato interno, potrebbe comportarsi diversamente su Safari rispetto a Chrome. Da verificare su un iPhone/Mac reale compilando davvero il form.

## Tracciamento / consenso

- [x] ~~Google Analytics/GTM non è implementato nel sito nuovo~~ → **GTM (`GTM-N68BT5M8`) + GA4 diretto (`G-N9QTHSFRXY`) installati, con Google Consent Mode v2 di default negato**, vedi audit 10 nel report.
- [ ] **Nel pannello CookieYes, attivare/verificare la sezione "Google Consent Mode (GCM)"** — passaggio manuale nella loro interfaccia, non risolvibile da codice.
- [ ] **Test dal vivo appena il sito è online sul dominio reale** (CookieYes non si inizializza su domini non registrati — non testabile né in locale né su GitHub Pages): Network tab in incognito, senza toccare il banner → nessuna richiesta verso `google-analytics.com`/`analytics.google.com`; poi Accetta → la richiesta parte; GTM in modalità anteprima → il container si carica.
- [ ] **Meta Pixel: nessun blocco del consenso nel codice.** Lo script (`BaseLayout.astro`) parte con `fbq('track', 'PageView')` non appena la pagina carica, senza controllare se l'utente ha accettato i cookie — l'ordine (CookieYes prima nell'head) garantisce solo che il banner *compaia* per primo, non che il Pixel resti bloccato finché non arriva un consenso. **Verificato dal vivo sul sito attuale** (`passionfitness.it`, prima di cliccare Accetta/Rifiuta): oggi nessuna richiesta parte verso `google-analytics.com` o `facebook.net` — il blocco funziona, ma è configurato lato pannello CookieYes (fuori dal codice), non da un controllo nello script. Stesso limite di test del punto sopra: verificabile solo a sito online sul dominio reale.
- [ ] **Meta Pixel: traccia solo `PageView`, nessun evento di conversione.** Con tutti i form esterni (n8n/Typeform/PerfectGym, l'utente lascia il sito al click), non c'è un "submit" da intercettare lato codice — ma non c'è nemmeno un evento `Lead`/click sui bottoni "Prova Ora" prima che l'utente esca. Se serve ottimizzare le campagne Meta sulle conversioni, va aggiunto un listener sui CTA che spari `fbq('track','Lead')` prima della navigazione.
- [ ] **Informativa estesa sui cookie contiene una tabella obsoleta**: elenca cookie del vecchio sito WordPress (Google Analytics, Google Tag Manager, live chat Zopim, Hotjar, sessioni WordPress, Contact Form 7) che non esistono più sul sito nuovo — sembra la scansione automatica di CookieYes fatta sul vecchio sito, migrata as-is. Andrebbe rigenerata con una nuova scansione una volta che il sito nuovo è online, altrimenti la pagina descrive tracker che non ci sono (e non descrive correttamente quello che c'è, cioè solo il Meta Pixel).

## Minori

- [ ] **Hero di Orari Corsi**: unico hero senza immagine/video, il padding inferiore è 24px invece dei consueti 56px delle altre pagine. Valutare se uniformare aggiungendo un'immagine di sfondo o accettando la differenza.
- [ ] **`/palestra/` (hub Fitness)**: il copy attuale è stato riassemblato da testi già presenti altrove sul sito (non scritto da zero) — va riletto ed eventualmente personalizzato.
