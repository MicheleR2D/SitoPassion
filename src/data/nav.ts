// Voci di menu: cambia raramente e richiede un ordine preciso, non serve editabile da CMS.
// Se in futuro servisse editabile, promuovere a settings/nav.json (Decap + content collection).
// Raggruppate sotto due dropdown (Palestra, Discipline) invece di 11 voci piatte in fila:
// la sitemap reale ha molte pagine di primo livello, ma in un menu bold/compatto vanno
// organizzate per non affollare l'header.
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
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
      { label: "Crossfit Acquedotti", href: "/crossfit/" },
      { label: "Hyrox", href: "/hyrox/" },
      { label: "Personal Training", href: "/i-love-my-trainer/" },
      { label: "Pilates", href: "/pilates/" },
      { label: "Pilates Reformer", href: "/pilates-reformer/" },
    ],
  },
  { label: "Orari Corsi", href: "/orari-corsi/" },
  { label: "Abbonamenti", href: "/abbonamenti/" },
  { label: "Blog", href: "/blog/" },
];
