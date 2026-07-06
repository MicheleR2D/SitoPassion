// Voci di menu: cambia raramente e richiede un ordine preciso, non serve editabile da CMS.
// Se in futuro servisse editabile, promuovere a settings/nav.json (Decap + content collection).
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Fitness',
    href: '/palestra/',
    children: [
      { label: 'Sala Pesi', href: '/palestra/sala-pesi/' },
      { label: 'Corsi Fitness', href: '/palestra/corsi-fitness/' },
    ],
  },
  { label: 'Personal Training', href: '/i-love-my-trainer/' },
  { label: 'Pilates Reformer', href: '/pilates-reformer/' },
  { label: 'Pilates', href: '/pilates/' },
  { label: 'Crossfit', href: '/crossfit/' },
  { label: 'Hyrox', href: '/hyrox/' },
  { label: 'Orari Corsi', href: '/orari-corsi/' },
  { label: 'Abbonamenti', href: '/abbonamenti/' },
  { label: 'Porta un Amico', href: '/porta-un-amico/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Contatti', href: '/contatti/' },
];
