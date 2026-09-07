// @ts-nocheck — script di browser, DOM diretto e nessuna annotazione di tipo
//
// La logica del form «Prova Passion». Vive qui e non dentro il componente
// perche' il giorno in cui la prova avra' anche una versione incorporata in
// pagina — in fondo a /prova-passion-fitness, per dire — le due copie
// divergerebbero al primo bug corretto in una sola delle due. Il componente
// passa il proprio nodo radice e il prefisso degli id, e questa funzione fa
// il resto.
//
// Il percorso ha tre schermate e una regola sola che le decide:
//
//   email → verifica ─┬─ e' o e' stata socia → «non attivabile», si va agli abbonamenti
//                     └─ non lo e'           → dati → codice PROVA7 e istruzioni
//
// La regola e' la stessa del workflow n8n «PROVA PASSION»: la prova e' per chi
// non ha ne' ha mai avuto un abbonamento o un pass, quindi `memberType`
// «Member» in PerfectGym e' l'unico stato che chiude la strada. Chi risulta
// solo come contatto e chi non risulta affatto proseguono uguale. Se
// PerfectGym non risponde si prosegue: meglio un lead in piu' da verificare a
// mano che una richiesta persa per un timeout.

import { WEBHOOK, CODICE } from '../data/prova';
import { validaTelefono } from '../data/prefissi';

export function initProvaForm(root, options) {
  var P = options.prefix;
  var onReset = options.onReset || function () {};

  var ERR = {
    email: 'Controlla l’indirizzo email: manca qualcosa.',
    nome: 'Serve il tuo nome.',
    cognome: 'Serve il tuo cognome.',
    privacy: 'Serve il consenso al trattamento dei dati per mandarti il codice.',
  };

  function stato() {
    return {
      email: '',
      nome: '',
      cognome: '',
      cellulare: '',
      statoPgm: 'nuovo',
      pagina: '',
      origine: '',
      cta: '',
    };
  }
  var dati = stato();

  // ── Attribuzione ──────────────────────────────────────────────────────────
  // Le vecchie CTA portavano `?source=SitoWeb&medium=Btn_Header` al form
  // ospitato da n8n, ed e' quello che finiva in Airtable nella colonna Fonte.
  // Ora il form e' qui e quei parametri non viaggiano piu' nell'URL: li legge
  // il modal dall'href del comando premuto e li passa come `origine`. Le utm
  // della pagina restano quelle vere, della campagna che ha portato la visita.
  function utm() {
    var q = new URLSearchParams(location.search);
    var out = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(
      function (k) {
        var v = q.get(k);
        if (v) out[k] = v;
      }
    );
    return out;
  }

  // ── Nodi ──────────────────────────────────────────────────────────────────
  function q(sel) {
    return root.querySelector(sel);
  }
  var steps = {
    email: q('#' + P + '-step-email'),
    dati: q('#' + P + '-step-dati'),
    blocco: q('#' + P + '-step-blocco'),
    esito: q('#' + P + '-step-esito'),
  };
  var campoEmail = q('#' + P + '-email');
  var campoNome = q('#' + P + '-nome');
  var campoCognome = q('#' + P + '-cognome');
  var campoCellulare = q('#' + P + '-cellulare');
  var campoPrefisso = q('#' + P + '-cellulare-prefisso');
  var campoPrivacy = q('#' + P + '-privacy');
  var btnVerifica = q('[data-pf-verifica]');
  var btnInvia = q('[data-pf-invia]');

  // ── Validazione ───────────────────────────────────────────────────────────
  function emailValida(v) {
    return /^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$/.test(String(v).trim());
  }

  /**
   * Il numero in E.164 — `+`, prefisso, cifre, senza spazi — o il motivo del no.
   *
   * Il conto lo fa `validaTelefono` in `data/prefissi.ts`, che mette insieme il
   * prefisso *scelto* nella tendina e le cifre scritte accanto. Prima questa
   * funzione indovinava l'Italia e incollava `+39` davanti a tutto: chi
   * scriveva gia' `+39 340...` finiva con `+39+39340...`, e chi ha un numero
   * straniero non era raggiungibile affatto — il suo `+44 7...` diventava
   * `+39447...`, un numero italiano che non esiste.
   *
   * Il motivo del rifiuto arriva da la' e non da `ERR` qui sopra perche' i no
   * sono diversi fra loro: manca una cifra, e' un fisso in un campo cellulare,
   * e' una cifra sola ripetuta. Una frase sola per tre casi ne spiegherebbe uno.
   */
  function telefonoDa(campo) {
    return validaTelefono(campoPrefisso ? campoPrefisso.value : '+39', campo ? campo.value : '');
  }

  /**
   * Riempie i campi del secondo passo con quello che la verifica ha restituito.
   *
   * Solo i campi vuoti: se la persona ha gia' scritto qualcosa, quello che ha
   * scritto vince. E restano visibili e modificabili — non nascosti — perche'
   * un dato che arriva da un sistema va potuto guardare prima di confermarlo.
   */
  function precompila(body) {
    [
      [campoNome, body.nome],
      [campoCognome, body.cognome],
      [campoCellulare, body.telefono],
    ].forEach(function (coppia) {
      if (coppia[0] && !coppia[0].value && coppia[1]) coppia[0].value = String(coppia[1]);
    });
  }

  function mostraErrore(step, testo) {
    var box = step.querySelector('[data-pf-errore]');
    if (!box) return;
    box.textContent = testo;
    box.hidden = false;
  }
  function pulisciErrore(step) {
    var box = step.querySelector('[data-pf-errore]');
    if (!box) return;
    box.textContent = '';
    box.hidden = true;
  }
  function segnala(campo) {
    campo.classList.add('pf__input--errore');
    campo.setAttribute('aria-invalid', 'true');
    campo.focus();
  }
  function togliSegno(campo) {
    campo.classList.remove('pf__input--errore');
    campo.removeAttribute('aria-invalid');
  }

  // ── Navigazione ───────────────────────────────────────────────────────────
  var attuale = 'email';

  function mostraStep(nome) {
    attuale = nome;
    Object.keys(steps).forEach(function (k) {
      if (steps[k]) steps[k].hidden = k !== nome;
    });
    // Il titolo del passo raccoglie il focus: chi naviga da tastiera o con lo
    // screen reader si ritrova all'inizio della schermata nuova e non sul
    // pulsante di prima, che ora e' nascosto.
    var titolo = steps[nome] && steps[nome].querySelector('[data-pf-fuoco]');
    if (titolo) {
      void titolo.offsetWidth;
      titolo.focus();
    }
  }

  function attendi(btn, acceso) {
    btn.disabled = acceso;
    btn.classList.toggle('pf__btn--attesa', acceso);
  }

  // ── Passo 1: l'email, e la verifica su PerfectGym ────────────────────────
  async function verifica() {
    pulisciErrore(steps.email);
    togliSegno(campoEmail);

    if (!emailValida(campoEmail.value)) {
      mostraErrore(steps.email, ERR.email);
      segnala(campoEmail);
      return;
    }
    dati.email = campoEmail.value.trim();
    attendi(btnVerifica, true);

    var risultato = 'nuovo';
    try {
      var r = await fetch(WEBHOOK.verifica, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dati.email,
          pagina: dati.pagina,
          origine: dati.origine,
          cta: dati.cta,
          utm: utm(),
        }),
      });
      var body = await r.json();
      if (body && body.stato) risultato = String(body.stato);
      /* La verifica non risponde solo «chi sei»: se PerfectGym ha gia'
         l'anagrafica — un socio, o chi ha lasciato i dati un'altra volta —
         torna anche con nome, cognome e telefono. Prima li buttavamo e li
         richiedevamo, cioe' facevamo una domanda a cui la persona aveva gia'
         risposto. */
      if (body) precompila(body);
    } catch (e) {
      // PerfectGym irraggiungibile: si prosegue come se fosse un contatto
      // nuovo. La verifica vera la rifa' comunque n8n quando crea il lead.
      risultato = 'errore';
    }

    attendi(btnVerifica, false);
    dati.statoPgm = risultato;

    if (risultato === 'iscritto') mostraStep('blocco');
    else mostraStep('dati');
  }

  // ── Passo 2: i dati, e il lead ───────────────────────────────────────────
  async function invia() {
    pulisciErrore(steps.dati);
    [campoNome, campoCognome, campoCellulare].forEach(togliSegno);

    if (!campoNome.value.trim()) {
      mostraErrore(steps.dati, ERR.nome);
      segnala(campoNome);
      return;
    }
    if (!campoCognome.value.trim()) {
      mostraErrore(steps.dati, ERR.cognome);
      segnala(campoCognome);
      return;
    }
    var tel = telefonoDa(campoCellulare);
    if (!tel.ok) {
      mostraErrore(steps.dati, tel.motivo);
      segnala(campoCellulare);
      return;
    }
    if (campoPrivacy && !campoPrivacy.checked) {
      mostraErrore(steps.dati, ERR.privacy);
      campoPrivacy.focus();
      return;
    }

    dati.nome = campoNome.value.trim();
    dati.cognome = campoCognome.value.trim();
    /* Il numero completo, col `+`: chi lo riceve — PerfectGym, Spoki,
       Airtable — non deve piu' incollarci niente davanti. */
    dati.cellulare = tel.e164;
    attendi(btnInvia, true);

    try {
      await fetch(WEBHOOK.lead, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'prova',
          email: dati.email,
          nome: dati.nome,
          cognome: dati.cognome,
          cellulare: dati.cellulare,
          stato: dati.statoPgm,
          codice: CODICE,
          privacy: true,
          pagina: dati.pagina,
          origine: dati.origine,
          cta: dati.cta,
          utm: utm(),
        }),
      });

      /* Dentro il `try` e non accanto a `mostraStep('esito')`: quello step si
         mostra anche quando la fetch fallisce — il `catch` qui sotto e' vuoto
         di proposito, perche' il codice e' della persona comunque — e un
         evento di conversione spedito su una richiesta mai arrivata
         conterebbe un lead che n8n non ha. */
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'lead_submit', lead_source: 'prova' });
      if (window.fbq) window.fbq('track', 'Lead', { content_name: 'Prova Passion' });
    } catch (e) {
      // La richiesta e' partita dal punto di vista della persona: il codice e'
      // suo e glielo diamo lo stesso. Il lead perso resta un problema nostro,
      // e n8n lo vede dal log del webhook.
    }

    attendi(btnInvia, false);
    mostraStep('esito');
  }

  // ── Eventi ────────────────────────────────────────────────────────────────
  if (btnVerifica) btnVerifica.addEventListener('click', verifica);
  if (btnInvia) btnInvia.addEventListener('click', invia);

  // Invio da tastiera: dentro un campo, Enter fa avanzare il passo corrente.
  root.querySelectorAll('input').forEach(function (input) {
    if (input.type === 'checkbox') return;
    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (attuale === 'email') verifica();
      else if (attuale === 'dati') invia();
    });
  });

  // Copia del codice, col caso in cui la clipboard sia negata — lo dice,
  // invece di fingere.
  root.querySelectorAll('[data-copy-code]').forEach(function (btn) {
    var codice = btn.dataset.copyCode || '';
    var testo = btn.textContent;
    btn.addEventListener('click', async function () {
      try {
        await navigator.clipboard.writeText(codice);
        btn.textContent = codice + ' · copiato ✓';
        btn.classList.add('copied');
      } catch (e) {
        btn.textContent = codice + ' · copia a mano';
      }
      window.setTimeout(function () {
        btn.textContent = testo;
        btn.classList.remove('copied');
      }, 2000);
    });
  });

  /**
   * Svuota tutto: lo stato, i campi, i segni di errore.
   *
   * Serve in due momenti, e il secondo e' quello che si dimentica:
   * all'**apertura**. Chi chiude il pannello a meta' non passa da `reset()` —
   * il pulsante di chiusura ed Escape chiudono e basta — quindi riaprendo si
   * troverebbero compilati email, nome, cognome e cellulare di chi l'aveva
   * aperto prima. Su un computer personale e' un fastidio; su un totem in
   * reception sono i dati di un visitatore mostrati al successivo.
   */
  function pulisci() {
    dati = stato();
    [campoEmail, campoNome, campoCognome, campoCellulare].forEach(function (c) {
      if (!c) return;
      c.value = '';
      togliSegno(c);
    });
    if (campoPrivacy) campoPrivacy.checked = false;
    Object.keys(steps).forEach(function (k) {
      if (steps[k]) pulisciErrore(steps[k]);
    });
    mostraStep('email');
  }

  function reset() {
    pulisci();
    onReset();
  }

  return {
    open: function (origine, cta) {
      // Prima si svuota — e `pulisci()` riporta anche al primo passo — poi si
      // scrive la provenienza: nell'ordine inverso `stato()` la cancellerebbe
      // subito dopo averla scritta.
      pulisci();
      // La pagina la sa il browser. `origine` e' il punto del sito da cui
      // parte il comando — "Btn_Header" o "Btn_Sala_Pesi" — e non sempre
      // coincide con la pagina: l'header e' su tutte.
      dati.pagina = location.pathname;
      dati.origine = origine || '';
      dati.cta = cta || '';
    },
    reset: reset,
  };
}
