# Report audit tecnici

Registro di tutti gli audit tecnici richiesti sul sito (correttezza, SEO, redirect, form/integrazioni, performance, favicon/404): cosa è stato controllato, cosa è stato corretto, cosa resta da fare. Aggiornato a mano dopo ogni audit — la sezione "Da fare" di ciascuno confluisce anche in [TODO.md](../TODO.md).

Ultimo aggiornamento: 2026-09-07.

---

## 1. Audit di correttezza (build, typecheck, link, componenti)

**Obiettivo**: nessun errore di build/tipo, nessun link rotto, componenti condivisi coerenti su tutte le pagine.

### Trovato e corretto

- **Build**: 2 warning (`glob-loader` su collection `team`/`services`, dichiarate senza contenuti e mai interrogate) → collection rimosse da `src/content.config.ts`. Build ora **0 warning**.
- **Typecheck assente**: `tsconfig.json` estendeva `astro/tsconfigs/strict` ma non veniva mai eseguito (mancava `@astrojs/check`). Installato (`npm i -D @astrojs/check typescript`) e aggiunto script `npm run check`.
- **40 errori di tipo** una volta attivato il typecheck, di cui:
  - 26 dovuti a `getEntry()` (può restituire `undefined`) passato senza controllo a `render()` su 13 pagine → creato `src/lib/page.ts` (`loadPage()`), che centralizza il caricamento e lancia un errore leggibile se il file manca. Le 13 pagine sono passate da ~6 righe a 4.
  - Script client non tipizzati in `Hero.astro`, `ScheduleSection.astro`, `Header.astro` → tipizzati.
  - **Bug reale trovato dal typecheck**: `RelatedCard.astro` richiedeva `image: string` ma riceve `coverImage` (opzionale) dai post del blog — 1 post su 74 non ha copertina, quindi sarebbe uscito `src="undefined"`. `image` reso opzionale + placeholder.
  - `npm run check` ora: **0 errori, 0 warning**.
- **Link interni**: 104 URL interne uniche, tutte risolvono a una route reale; tutte le ancore (`#id`) verificate esistenti nella pagina di destinazione. Zero asset (immagini/video) mancanti tra quelli referenziati.
- **`<h1>` duplicato** su `/prova-passion-fitness/` (`# PASSION FITNESS` nel corpo markdown, oltre all'H1 dell'Hero) → declassato a `##` in `src/content/pages/prova-passion-fitness.mdx`. Copy visibile invariato, solo il livello del tag.
- **`/palestra/` pagina vuota** (`src/content/pages/palestra.mdx` aveva solo il frontmatter): verificato che l'URL risponde 200 sul sito WP attuale (quindi va preservata, non eliminata) → trasformata in hub page (hero + 4 box + intro + CTA + correlate). **Il copy è riassemblato da testi già presenti altrove sul sito, non scritto da zero** — segnalato, da rileggere.
- **`robots.txt` assente** e pannello `/admin/` (Decap CMS) indicizzabile → creato `public/robots.txt` (`Disallow: /admin/` + sitemap) e aggiunto `<meta name="robots" content="noindex, nofollow">` in `public/admin/index.html`.
- **Codice/contenuto morto rimosso**: `src/components/ui/ServiceCard.astro` (mai importato, 92 righe), `src/content/pages/home.mdx` (200 righe, orfano — la home vive in `src/pages/index.astro`).

### Verificato, nessun problema

- Import non utilizzati: 0 (dopo aver scartato i falsi positivi `import type`).
- Props non tipizzate: tutti i 19 componenti che usano `Astro.props` hanno `interface Props`.
- Chiavi duplicate in liste: non applicabile in Astro (rendering server-side, no VDOM) — controllato l'equivalente reale, **0 id HTML duplicati** su tutte le 96 pagine.
- Stati null/undefined: tutti gli accessi ad array/oggetti protetti (`?.`, `.length > 0`, ecc.) tranne il bug RelatedCard sopra.
- Header/Footer/`<title>`/canonical: esattamente 1 per pagina su tutte le 95 pagine.

### Da fare

- Nessuno di sostanza per questo audit specifico — tutto quanto emerso è stato risolto o (per `/palestra/`) segnalato esplicitamente. Vedi [TODO.md](../TODO.md) per gli item minori collegati (hero Orari Corsi, copy `/palestra/`).

---

## 2. Audit SEO on-page

**Obiettivo**: title/description ottimizzati, gerarchia H coerente, alt text, Open Graph/Twitter, structured data.

### Trovato e corretto

- **Bug reali nel generatore automatico di description** (`src/lib/summary.ts`, creato per popolare le 88 pagine senza `seo.description`):
  - la firma in corsivo di un articolo (`_Articolo a cura di..._`) veniva letta come descrizione → filtro aggiunto.
  - un link-CTA da solo in un paragrafo (`[PROVA GRATIS](url)`) veniva letto come descrizione → filtro aggiunto.
  - off-by-one: alcune description arrivavano a 161 caratteri (1 oltre il limite) per il calcolo dei puntini di troncamento → corretto.
- **Home page**: la meta description riusava `footerText` ("Passion Fitness | Palestre Roma | Passion Fitness Tuscolana", mai stata una frase) → sostituita con testo reale già visibile in pagina (`src/pages/index.astro`).
- **7 pagine di paginazione blog** (`/blog/2/` … `/blog/7/`): title e description identici tra loro (contenuto duplicato per Google) → template con numero di pagina in `src/pages/blog/[...page].astro`.
- **Title troppo lunghi** (86 pagine fuori dal range 50-60 prima dell'intervento): creato `seoTitle()` che tronca su confine di parola solo il tag `<title>`, mai l'H1 visibile. **Open Graph/Twitter usano il titolo per esteso** (`ogTitle`), non quello troncato — altrimenti un titolo lungo sarebbe apparso tagliato anche condiviso su Facebook/Twitter.
- **Alt text**: `Hero.astro` e `PostCard.astro` avevano `alt=""` hardcoded su ogni immagine hero/copertina (253 immagini coinvolte) → ora usano il titolo reale della pagina/articolo come default. Corretto anche 1 caso isolato di `![]()` con alt vuoto in `esercizi-bicipiti-guida.mdx` ("Anatomia dei bicipiti", ricavato dalla sezione in cui è inserita).
- **Gerarchia heading**: `HighlightCards` e `PostCard` usavano `<h3>` per i titoli delle card pur essendo spesso il primo contenuto dopo l'H1 (salto H1→H3 su 15 pagine) → promossi a `<h2>`. Verificato zero regressioni visive (font-size invariato via computed style).
- **Structured data (JSON-LD)**: aggiunto `HealthClub` (LocalBusiness) sitewide con indirizzo/telefono/email/orari/social reali (già in `footer.json`/`site.json`) + `BreadcrumbList` con gerarchia reale (es. Home › Fitness › Sala Pesi).
- **Open Graph/Twitter**: aggiunti `og:site_name`, `twitter:title/description/image`; `og:image` ora ha un fallback al logo quando la pagina non ne ha uno proprio (prima mancava del tutto).
- `sitemap.xml`/`robots.txt` verificati corretti (95 URL, `/admin/` escluso).

### Da fare

- **35 pagine restano sotto il target ideale** di title (50-60) o description (140-160): quasi tutte titoli/testi reali già corti di loro (titoli WP originali, pagine legali, pagine JSX senza prosa markdown). **Non ho inventato copy per allungarli** — se vuoi, posso intervenire pagina per pagina ma serve nuovo testo da te.
- Vedi anche [TODO.md](../TODO.md): il link "MOG e Codice di Condotta" nel footer punta ancora al vecchio dominio (non un problema SEO in senso stretto, ma tocca i link del footer verificati qui).

---

## 3. Mappatura redirect vecchio sito → nuovo sito

**Obiettivo**: redirect 301 da WordPress al nuovo sito Astro, per non perdere ranking Google.

### Trovato

- Mappate le 88 route generate dal nuovo sito.
- **Trovati 53 redirect 301 reali già esistenti** in `public/_redirects` (generati da `scripts/migration/05-generate-redirects.js` a partire dal plugin Redirection del sito WP live — dati reali, non inventati). Verificato: nessuna catena A→B→C, tutti i target validi.
- Da `scripts/migration/lib/slug-map.js` (mappa reale slug-WP → path-Astro dell'epoca della migrazione) emergono **3 casi non coperti** dal file `_redirects` attuale:
  - `/i-love-my-trainer/` → `/personal-training/` (alta confidenza: rinominata dopo la migrazione, confermato da cronologia git — ma non ancora confermato da te)
  - `/crossfit/` → pagina WP esistita, mai migrata, destinazione da decidere
  - `/pilates/` → idem

### Bloccato

- **Manca l'export Google Search Console → Copertura (o una sitemap.xml salvata prima della migrazione)**: senza quella lista non posso confrontare le URL indicizzate del vecchio sito con le nuove route, e non genero redirect per URL che non mi hai confermato. Richiesto due volte, non ancora fornito.

### Da fare

- Fornire l'export Search Console / vecchia sitemap.xml.
- Confermare i 3 redirect sopra.
- Una volta disponibili i dati: confronto completo, generazione dei redirect 301 mancanti in `public/_redirects`.

---

## 4. Audit form e integrazioni

**Obiettivo**: verificare che form e integrazioni puntino a endpoint di produzione funzionanti.

### Trovato

- **Nessun `<form>` nativo esiste sul sito**: ogni "form" è un link esterno o un iframe verso un servizio terzo (n8n, Typeform, PerfectGym). Verificata la raggiungibilità di ogni endpoint con sole richieste GET (nessun dato inviato, rispettato il vincolo):
  - **Form "Prova Ora" (n8n)**: OK, raggiungibile, validazione client-side presente, UTM coerente per pagina.
  - **Form "Porta un Amico" (n8n)**: OK, iframe e redirect QR-code puntano allo stesso ID.
  - **Typeform CV/carriere**: OK, raggiungibile.
  - **PerfectGym (acquisto abbonamenti)**: portale raggiungibile, ma SPA client-side (non verificabile nel dettaglio senza login).
  - **WhatsApp click-to-chat**: OK, nessuna integrazione Spoki trovata.
  - **Nessuna integrazione Stripe** sul sito.
  - **Nessuna credenziale/chiave/endpoint di staging hardcoded** trovato in tutto il codice.
- 🔴 **Bug trovato — Typeform morto su `/prova-passion-fitness/`**: i 5 CTA della pagina risolvono alla pagina generica di marketing di Typeform (il form/slug specifico non esiste più). La pagina non è linkata da nessuna parte del sito — i parametri `utm_source=GAds` suggeriscono sia la landing page di una campagna Google Ads ancora attiva, che quindi spreca budget pubblicitario portando traffico a un form morto.
- 🟠 **Bug ri-confermato — PerfectGym `productId` duplicato**: nel pacchetto "10 sedute" di Personal Training, le varianti 60' e 30' puntano entrambe a `productId=95` (già noto da un audit precedente, ancora presente).
- Nessun form di **newsletter** esiste sul sito.
- Validazione/errori/conferma per i form **non esistono nel codice del sito** perché non esistono `<form>` nativi — tutto delegato ai servizi terzi (verificato presente lì).

### Da fare

- **Typeform morto**: serve un link Typeform aggiornato, o sostituire i 5 CTA col form n8n usato altrove.
- **`productId=95` duplicato**: serve il productId corretto per la seduta PT da 30' dal pannello PerfectGym.
- (Trovati per caso, fuori ambito) 4 articoli del blog con link interni al vecchio dominio live WP (`dt_workouts`, `functional-training`); un parametro UTM stale (`GAds_btn_ILMT`, il vecchio nome di Personal Training).

---

## 5. Audit performance

**Obiettivo**: ottimizzare senza alterare funzionalità o layout visibile.

### Trovato e corretto

- **3 immagini enormi sostituite con varianti già esistenti**: WordPress genera automaticamente una versione "-scaled" per gli upload più grandi, presenti in `public/images/` ma mai usate.

  | File | Prima | Dopo | Uso |
  |---|---|---|---|
  | `MRZ01923.jpeg` | 12,4 MB | 411 KB | card Sala Pesi |
  | `MRZ08109.jpeg` | 7,9 MB | 379 KB | usata 9 volte (Personal Training, 8 pagine + galleria) |
  | `hyrox-hh-96.jpg` | 2,9 MB | 779 KB | hero + galleria Hyrox |

  **-21,6 MB** di peso immagini tolti dal sito, zero perdita di qualità percepibile (stessa foto, 1707×2560px, verificato). Nessuna ricompressione fatta manualmente: solo la referenza corretta a un file già esistente.
- **`fetchpriority="high"`** sull'immagine hero (`Hero.astro`) — è quasi sempre l'elemento LCP della pagina.
- **Preload del font** self-hosted (`anton-latin.woff2`) + **preconnect** a `cdn-cookieyes.com` e `connect.facebook.net` in `BaseLayout.astro`, senza toccare lo script CookieYes stesso (solo righe aggiunte prima).

### Verificato, già a posto

- **Hydration**: non applicabile, nessun framework UI installato (no React/Vue/Svelte) — sito 100% HTML statico.
- **Bundle JS**: zero file JS esterni; tutti gli script sono inline e minificati (~4KB totali sulla home). Verificato che gli script specifici di un componente non vengono inclusi sulle pagine che non li usano.
- **Bundle CSS**: 48,8 KB totali su tutto il sito, nessun gonfiamento anomalo.
- **Font**: già ottimale — autoospitato, `font-display: swap`, font body = stack di sistema (zero richieste esterne anche prima del mio intervento).
- **Lazy loading**: già presente su quasi tutte le immagini dei componenti.
- **CLS**: già prevenuto via CSS (posizionamento assoluto in contenitori pre-dimensionati) in tutti i componenti, anche senza attributi `width`/`height` espliciti.

### Da fare

- **Migrazione a `<Image />`/`astro:assets`** (conversione automatica WebP/AVIF + `srcset` responsivo per le 153 immagini usate): rimandata di proposito, in `TODO.md`, perché molte immagini stock verranno probabilmente sostituite a breve — non ha senso ottimizzare la pipeline prima. È un cambio architetturale (sposta le immagini da `public/` a `src/assets/`, tocca 7 componenti, interagisce col media picker di Decap CMS).

---

## 6. Audit favicon, apple-touch-icon, pagina 404

**Obiettivo**: verificare presenza e correttezza di favicon/apple-touch-icon, e l'esistenza di una pagina 404 personalizzata.

### Trovato e corretto

- **Favicon/apple-touch-icon**: già tutti presenti e corretti. 5 file in `public/` (`favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `icon-512.png`, `apple-touch-icon.png`), tutti validi e con le dimensioni pixel corrispondenti a quelle dichiarate (verificato con `file`: 16×16, 32×32, 512×512, 180×180 — dimensione standard Apple). Referenziati in `src/layouts/BaseLayout.astro`, quindi automaticamente presenti e coerenti su tutte le 96 pagine (unico layout condiviso).
- **Pagina 404 assente** (`src/pages/404.astro` non esisteva — nessuna route generava `dist/404.html`) → creata. Riusa `BaseLayout` + `Hero` + `Button` (stessi componenti del resto del sito, branding coerente, non il default Astro/Netlify), `noindex` impostato, 4 CTA (Home, Prova Ora, Orari Corsi, Contattaci).
  - **Bug di contrasto trovato e corretto durante la verifica visiva**: la prima versione usava le varianti `dark-red`/`ghost-light` dei bottoni, pensate per sfondi chiari — sull'hero scuro (nessuna immagine/video in questa pagina) risultavano illeggibili (bottone nero su nero, testo grigio su nero). Corretto in `white`/`ghost-dark` (le varianti per sfondi scuri). Verificato via screenshot desktop e mobile dopo il fix.
- Astro genera `dist/404.html` per convenzione di nome file: funziona sia su Netlify (host di produzione) sia su GitHub Pages (ambiente di test) senza configurazione aggiuntiva — verificato che **non esisteva ancora** un `netlify.toml` o altra config esplicita per la pagina 404.
- Testato in locale: navigazione a una route inesistente (`/altra-route-inesistente/`) mostra correttamente la pagina 404 con header, footer, `<title>Pagina non trovata | Passion Fitness</title>`, `<meta name="robots" content="noindex, nofollow">`.

### Da fare

- Nessuno — audit completo, tutto risolto.

---

## Riepilogo file toccati (cumulativo, tutti e 6 gli audit)

Nuovi: `src/lib/page.ts`, `src/lib/summary.ts`, `src/pages/404.astro`, `public/robots.txt`, `TODO.md`, questo report.

Modificati (principali): `src/content.config.ts`, `src/layouts/{BaseLayout,PageLayout,BlogPostLayout}.astro`, `src/components/layout/SEO.astro`, `src/components/ui/{Hero,HighlightCards,RelatedCard}.astro`, `src/components/blog/PostCard.astro`, `src/pages/{index,blog/[...page]}.astro`, `public/admin/index.html`, diverse pagine in `src/content/pages/` (title/seo/immagini), `esercizi-bicipiti-guida.mdx`, `prova-passion-fitness.mdx`.

Rimossi: `src/components/ui/ServiceCard.astro`, `src/content/pages/home.mdx`, collection `team`/`services` da `content.config.ts`.

**Ogni modifica è stata verificata con `npm run build` (0 warning) e `npm run check` (0 errori) prima di essere considerata completata.**
