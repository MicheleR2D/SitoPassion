/**
 * I tipi della libreria di embed di PerfectGym.
 *
 * `@perfectgym/client-portal` arriva da CDN e non da npm — e' cosi' che la
 * documentano — quindi non porta con se' nessuna dichiarazione: senza questo
 * file `window.PerfectGym` non esiste per TypeScript e `astro check` si ferma.
 *
 * Le opzioni sono quelle documentate in github.com/PerfectGym/ClientPortal.Embed
 * al giorno in cui la pagina di prenotazione e' stata scritta. Sono tutte
 * facoltative tranne `url`, e ne sono dichiarate solo quelle che usiamo piu'
 * quelle vicine: un tipo che elenca opzioni mai provate darebbe l'impressione
 * di garantirle.
 */
export interface CalendarioPg {
  /** L'indirizzo del portale senza frammento. Obbligatorio. */
  url: string;
  /** L'indirizzo completo, con stato e parametri: vince su `defaultState`. */
  forceUrl?: string;
  /** Codice ISO 639-1. */
  language?: string;
  /** Altezza minima in pixel, prima che l'iframe misuri il contenuto. */
  minHeight?: number;
  /** La barra del portale. */
  navigation?: { hide?: boolean; logo?: boolean };
  /** Le opzioni della pagina calendario. */
  calendarPage?: {
    /** Toglie «Prenota» a chi non ha fatto l'accesso. */
    hideBookingIfNotLogged?: boolean;
    disableCourseEnrollment?: boolean;
  };
  onConnect?: () => void;
  onStateChangeSuccess?: (stato: unknown) => void;
}

declare global {
  interface Window {
    PerfectGym?: {
      ClientPortal: new (elemento: HTMLElement, opzioni: CalendarioPg) => {
        logout(): void;
        changeLanguage(lingua: string): void;
        isUserLoggedIn(): boolean;
        getElement(): HTMLIFrameElement;
      };
    };
  }
}
