// Voci di menu: cambia raramente e richiede un ordine preciso, non serve editabile da CMS.
// Se in futuro servisse editabile, promuovere a settings/nav.json (Decap + content collection).
// Raggruppate sotto due dropdown (Palestra, Discipline) invece di 11 voci piatte in fila:
// la sitemap reale ha molte pagine di primo livello, ma in un menu bold/compatto vanno
// organizzate per non affollare l'header.
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
  // Voce fuori dalla griglia del menu mobile: occupa una fascia a se' a
  // piena larghezza sotto i riquadri (vedi Nav.astro).
  standalone?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Palestra",
    href: "/palestra/",
    children: [
      { label: "Sala Pesi", href: "/palestra/sala-pesi/" },
      { label: "Corsi Fitness", href: "/palestra/corsi-fitness/" },
    ],
  },
  {
    label: "Discipline",
    href: "/orari-corsi/",
    children: [
      { label: "Hyrox", href: "/hyrox/" },
      { label: "Personal Training", href: "/i-love-my-trainer/" },
      { label: "Pilates Reformer", href: "/pilates-reformer/" },
    ],
  },
  { label: "Orari Corsi", href: "/orari-corsi/" },
  { label: "Abbonamenti", href: "/abbonamenti/" },
  { label: "Blog", href: "/blog/", standalone: true },
];
