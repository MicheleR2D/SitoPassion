# Template pagina — standard Passion Fitness

Riferimento per costruire/aggiornare le pagine di `src/content/pages/`.
**Pagina modello già completa: `src/content/pages/palestra/sala-pesi.mdx`** — in caso
di dubbio, guarda com'è fatta lì.

Obiettivo: le pagine si compongono **assemblando componenti e passando dati**.
Non si scrive CSS nel `.mdx`, non si tocca il CSS dei componenti per una singola
pagina. Se serve una variante, si aggiunge una prop al componente.

---

## 1. Scheletro della pagina

Ordine standard. Le sezioni intermedie sono opzionali, l'hero e la chiusura no.

```
Hero              (da frontmatter — video/immagine + occhiello + titolo + testo + CTA)
HighlightCards    3-4 card immagine con icona, testo in hover, CTA
ContentRows       N righe immagine/testo alternate sinistra-destra
FeatureShowcase   gallery a sinistra + elenco caratteristiche a destra
CtaSplit          fascia rossa a schermo pieno: testo a sinistra, immagine a destra
RelatedSection    titolo + 3-4 card verso altre pagine  ← chiude sempre la pagina
```

Tutte le fasce sono a tutta larghezza e **si toccano**: nessuno spazio tra una e
l'altra, nessun bordo arrotondato sul lato che tocca il bordo schermo.

---

## 2. Frontmatter

```yaml
---
title: Sala Pesi                      # H1 dell'hero
slug: palestra/sala-pesi
heroVideo: /videos/....mp4            # video di sfondo (oppure heroImage)
heroImage: /images/....jpg            # usato come poster del video, o da solo
heroEyebrow: 1000 mq di sala pesi attrezzata    # occhiello sopra il titolo
heroText: Prima riga.<br />Seconda riga.        # accetta HTML inline
heroCtas:
  - label: Prova Gratis
    href: https://...
    variant: dark-red                 # nero con testo rosso
  - label: Scopri gli Abbonamenti
    href: /abbonamenti/
    variant: ghost-dark               # trasparente con bordo bianco
wpId: 4089
publishedAt: 2024-10-22T12:03:40.000Z
draft: false
---
```

Convenzione CTA: la **prima** è sempre l'azione di conversione (`Prova Gratis`,
stesso testo in tutta la pagina), la seconda è secondaria/informativa.

---

## 3. Componenti — API e uso

Import: `import X from '../../../components/ui/X.astro';`
(il numero di `../` dipende dalla profondità del file in `src/content/pages/`).

### HighlightCards — 3-4 card sotto l'hero
```jsx
<HighlightCards items={[
  { title: 'Sempre aperti',
    body: 'Testo rivelato in hover.',
    image: '/images/...jpg',
    href: '/orari-corsi/',
    cta: 'Scopri gli orari' },
]} />
```
- `href`+`cta` sono opzionali (senza, la card non ha il link in fondo).
- Le colonne si adattano al numero di card (3 o 4). Non toccare il CSS.
- Titolo sempre visibile; paragrafo e CTA compaiono in hover, anche su mobile.
- Altezza `50dvh`: mezza schermata, non una intera.
- Niente icone: il set `icons.ts` è stato rimosso quando il design è passato
  a card più basse, dove l'icona non entrava più.

### ContentRows / ContentRow — righe alternate immagine/testo
```jsx
<ContentRows>
  <ContentRow title="Titolo della riga" image="/images/...jpg" alt="descrizione">
    Paragrafo con **grassetto** (rosso) e testo normale (nero).

    Secondo paragrafo.
  </ContentRow>
  {/* altre righe... */}
</ContentRows>
```
- L'alternanza sinistra/destra è **automatica** (`:nth-child`): non passare nulla.
- Il titolo entra di lato allo scroll, il testo in fade. Automatico.
- Le righe crescono col testo; gli angoli delle immagini restano a contatto.

### FeatureShowcase — gallery + caratteristiche
```jsx
<FeatureShowcase
  title="Perché scegliere ..."
  images={[{ src: '/images/...jpg', alt: '...' }, /* usa 6 o 9 immagini */]}
  features={['Aperti tutti i giorni', '+1000 mq', /* ... */]}
/>
```
- Gallery su 3 colonne: usa **multipli di 3** per non lasciare celle vuote.
- Solo punti di forza, niente confronto con la concorrenza.

### CtaSplit — CTA a schermo pieno
```jsx
<CtaSplit
  heading="È ora di iniziare! ..."
  text="Paragrafo di supporto."       // opzionale
  buttonLabel="Prova Gratis"          // stesso testo delle altre CTA di pagina
  buttonHref="https://..."
  image="/images/...jpg"
  alt="..."
/>
```

### RelatedSection / RelatedCard — chiusura pagina
```jsx
<RelatedSection title="Potrebbe interessarti anche">
  <RelatedCard title="Reformer" href="/pilates-reformer/"
               image="/images/...jpg" alt="..." />
  {/* 3 o 4 card */}
</RelatedSection>
```
- Il titolo occupa una colonna, le card le restanti. Si adatta al numero di card.
- Deve essere **l'ultimo** elemento: tocca il footer senza stacco.

### ScheduleSection — orario settimanale (pagina Orari Corsi)
```jsx
<ScheduleSection title="Corsi Energy" days={[
  { label: 'Lunedì', slots: [{ time: 'H. 07:00', name: 'Hyrox' }] },
]} />
```
- Una colonna per giorno; ogni giorno impila i propri slot, senza allinearli in
  riga con gli altri (i giorni hanno un numero diverso di lezioni).
- Full-bleed, alterna sfondo rosa/bianco tra fasce consecutive.
- Sotto i 760px passa a scroll orizzontale invece di comprimere le colonne.

### PricingGroup — card prezzi (pagina Abbonamenti)
```jsx
<PricingGroup
  title="Open" subtitle="Reformer, Sala Pesi e Corsi Fitness"
  features={['Accesso senza limiti orari', /* ... */]}
  plans={[{ duration: '12 mesi', price: '87', href: 'https://...' }]}
  note="Quota di attivazione una tantum 60€. ..."
/>
```
- **Non** full-bleed: resta nella colonna di lettura, come una tabella.
- Testata nera (titolo rosso + attività comprese con spunta), durate affiancate
  con prezzo rosso e CTA "Iscriviti Ora", condizioni comuni in fondo.
- Le colonne derivano dal numero di durate; sotto i 760px si impilano.

### FaqAccordion — domande frequenti
```jsx
<FaqAccordion items={[{ q: 'Domanda?', a: 'Risposta con <a href="...">link</a>.' }]} />
```
- `<details>` nativo, nessuno script. Le risposte accettano HTML inline.

---

## 4. Design — valori esatti

**Colori** (token in `src/styles/global.css`, mai valori grezzi nei componenti)

| Ruolo | Token | Valore |
|---|---|---|
| Rosso brand | `--color-red` / `--accent` | `#E3032D` |
| Nero | `--color-black` | `#000000` |
| Testo su chiaro | `--text-on-light` | `#1b1b1b` |
| Testo su chiaro attenuato | `--text-on-light-muted` | `#6b6260` |
| Sfondo pagina | `--bg-light-soft` | `#FEEDED` (rosa chiaro — **mai bianco**) |

**Font**
- Titoli (`h1`–`h3`): `--font-display` = **Anton** (autoospitato), maiuscolo,
  `letter-spacing:-0.01em`, `line-height:0.96`.
- Testo: `--font-body`.
- Dimensioni: `h1` `clamp(2.6rem,6vw,5rem)` · `h2` `clamp(2rem,4.2vw,3.2rem)` ·
  `h3` `clamp(1.35rem,2.4vw,1.8rem)` · paragrafi `1.05rem`/`1.75`.

**Colori per sezione**

| Sezione | Sfondo | Titolo | Testo |
|---|---|---|---|
| ContentRow | rosa chiaro | rosso | nero (grassetto rosso) |
| HighlightCards | foto + velo nero 60% → **rosso** in hover | bianco | bianco |
| FeatureShowcase | nero | rosso | bianco (spunta rossa) |
| CtaSplit | rosso | nero | bianco |
| RelatedSection | nero | rosso | barra card rossa → **bianca** in hover |

**Spaziatura**: solo la scala `--space-*`
(`3xs`.25 · `2xs`.5 · `xs`.75 · `sm`1.25 · `md`2 · `lg`3.5 · `xl`6 rem).

**Separatori**: sempre `2px solid var(--color-black)` (o `gap:2px` su fondo nero).

**Angoli**: `border-radius:12px` verso l'interno, **squadrati** sul lato che tocca
il bordo schermo. Le immagini a contatto tra righe non hanno raggio.

**Breakpoint**: `1100px` riduce le colonne · `860px` impila a colonna singola
(uguale per tutti i componenti).

---

## 4-ter. Il "passaggio morbido" (desktop e mobile)

Nessun blocco confina con un altro tramite una **linea nera**: il confine è
sempre una **sfumatura** che esce dal blocco colorato e si stende su quello
adiacente. Vale per hero (pannello rosso → media), righe `ContentRow`
(testo → media) e fascia titolo su mobile.

Due regole da rispettare quando si aggiunge una sfumatura:

1. **Parte dal colore pieno del blocco da cui esce.** Se parte da una
   versione già attenuata (es. rosso al 55%) si vede uno scalino esattamente
   sul confine — l'effetto "bordo squadrato" che si voleva evitare. La
   leggerezza si ottiene con la curva (stop intermedio che scende in fretta),
   non tagliando l'opacità di partenza.
2. **Serve `z-index` sul blocco da cui esce.** Media e testo sono item della
   stessa griglia: senza `z-index` vince l'ordine di pittura (`order`) e il
   media copre la sfumatura, che sembra non esserci.
   Token pronti: `--accent-transparent`, `--accent-quarter`,
   `--bg-light-soft-half`, `--bg-light-soft-transparent` — mai `transparent`
   generico, che alcuni browser interpolano passando dal nero (banda grigia).

---

## 4-bis. Mobile (≤860px) — comportamento dei componenti

Il mobile **non si scrive nelle pagine**: ogni componente porta con sé il
proprio adattamento, quindi una pagina costruita col template qui sopra è già
ottimizzata. Cosa cambia sotto gli 860px:

| Componente | Comportamento mobile |
|---|---|
| `Hero` | altezza `100dvh` (non `vh`: con la barra del browser visibile sforerebbe); delle `heroCtas` resta **solo la prima**, a tutta larghezza e più grande; la sfumatura del pannello sale sul media invece di uscire di lato |
| `HighlightCards` | una card per riga, `min-height: 12rem`; paragrafo e CTA restano rivelati **solo in hover**, come su desktop |
| `ContentRow` | ordine **titolo → media → paragrafo**. Il titolo diventa una fascia rossa a piena larghezza (testo bianco) sopra al media, con la sfumatura che scende sul media; il paragrafo sta sotto, senza bordi |
| `FeatureShowcase` | ordine **elenco → CTA slottata → gallery**; gallery a 2 colonne con celle `2/1`. Elenco e CTA si spartiscono l'altezza dello schermo (**55dvh + 45dvh**), così la coppia copre una schermata esatta a prescindere da quanto testo ha la pagina |
| `CtaSplit` | immagine nascosta, altezza sul contenuto |
| `RelatedCard` | card orizzontale compatta: miniatura quadrata + barra col titolo |
| `RelatedSection` | una card per riga, altezza sul contenuto |

**Regola da non violare: su mobile nessun blocco a piena larghezza può avere
`transform: translateX(...)`.** L'animazione d'ingresso laterale su un elemento
larghezza-piena lo fa uscire dal viewport: il browser allarga il layout
viewport per contenerlo e **tutta la pagina scorre in orizzontale**, con una
banda vuota di lato e i controlli dell'header spinti fuori schermo. Su mobile
resta solo il fade (`transform: none` nei media query dei componenti).

**Slot CTA di `FeatureShowcase`:** per ottenere l'ordine elenco → CTA → gallery
la CTA va passata come slot, non come blocco fratello:

```jsx
<FeatureShowcase title="..." images={[...]} features={[...]}>
  <CtaSplit slot="cta" heading="..." buttonLabel="Prova Ora" buttonHref="..." image="..." />
</FeatureShowcase>
```
Su desktop resta una fascia a sé sotto la sezione (identica a prima), su mobile
si infila tra elenco e gallery. Dentro lo slot la CTA è alta `min-height:30rem`,
non una schermata intera.

---

## 5. Regole architetturali — non violarle

1. **`PostBody` stila solo il testo di primo livello.** Tutte le sue regole sono
   limitate ai figli diretti (`.post-body > p`, `> ul`, …). I componenti definiscono
   la propria tipografia. Non aggiungere regole discendenti in `PostBody`: vincono
   per specificità su quelle dei componenti e "colano" dentro (è così che il pallino
   rosso delle liste finiva sommato alla spunta di `FeatureShowcase`).

2. **`row-gap` della griglia è `0`.** Nessuno spazio automatico tra fratelli, così
   due fasce adiacenti si toccano sempre, in qualsiasi combinazione. Lo spazio del
   testo scorrevole è dato da `margin-top` espliciti. Non reintrodurre un gap
   "ambientale" da annullare poi caso per caso.

3. **Nuovo componente a tutta larghezza** → aggiungere la sua classe radice
   all'elenco dei blocchi full-bleed in `PostBody.astro`, altrimenti resta
   confinato nella colonna di lettura.

4. **Niente padding verticale sul wrapper esterno** di un componente full-bleed:
   lascerebbe una striscia di sfondo pagina tra le fasce. Il respiro va messo sui
   contenitori interni.

---

## 6. Errori già commessi — da non ripetere

| Errore | Perché sbagliato | Regola |
|---|---|---|
| Colonne asimmetriche (45/55) nelle `ContentRow` | il confine si sposta riga per riga e gli angoli delle immagini non combaciano più | tenere **50/50 esatto** |
| Altezza fissa alle righe per allineare gli angoli | non serve (bastano 50/50 + gap zero) e produce scrollbar interne sulle pagine con più testo | usare `min-height` |
| Selettore a classe singola in un componente | perde contro le regole discendenti di `PostBody` (testo grigio invece che bianco, CTA sottolineate) | selettore a **due classi** (`.blocco .blocco__elemento`) |
| Layout impaginato come articolo (colonna stretta centrata) | non è il linguaggio della home | fasce **full-bleed** alternate |
| Numero di colonne fisso (`repeat(3,1fr)`) | si rompe sulle pagine con 4 elementi | colonne derivate dal numero di elementi |

---

## 7. Da costruire quando servirà

Componenti non ancora esistenti, richiesti da pagine specifiche:

- **Griglia prima/dopo** — `i-love-my-trainer` (8 risultati clienti con foto e
  didascalia).

## 8. Contenuti da bonificare prima del restyling

Problemi noti nel Markdown migrato da WordPress:

- `pilates-reformer.mdx`: prezzi del Reformer non riportati in pagina (la pagina
  rimanda ad `abbonamenti/`), così non esiste una seconda copia da tenere allineata.
- `palestra.mdx`: **corpo vuoto**, servono contenuti.

Già bonificati: `abbonamenti.mdx` (tabelle prezzi e FAQ duplicate, footer del sito
incollato nel corpo pagina) e `orari-corsi.mdx` (corpo vuoto → 4 tabelle orario).
