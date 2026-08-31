// Libreria di icone inline (stesso stile di quelle della home: tratto 2px,
// viewBox 48, currentColor). Per usarne una basta il nome:
//   <HighlightCards items={[{ ..., icon: 'clock' }]} />
// Per aggiungerne una nuova: una voce qui, stesso viewBox e attributi.

const attrs =
  'viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

export const ICONS: Record<string, string> = {
  clock: `<svg ${attrs}><circle cx="24" cy="24" r="17"/><polyline points="24 13 24 25 32 29"/></svg>`,

  area: `<svg ${attrs}><rect x="7" y="7" width="34" height="34" rx="3"/><polyline points="15 21 15 15 21 15"/><polyline points="33 27 33 33 27 33"/><line x1="15" y1="15" x2="24" y2="24"/><line x1="33" y1="33" x2="24" y2="24"/></svg>`,

  dumbbell: `<svg ${attrs}><circle cx="10" cy="20" r="5"/><circle cx="15" cy="28" r="4"/><line x1="15" y1="24" x2="31" y2="12"/><circle cx="35" cy="16" r="4"/><circle cx="40" cy="22" r="3"/></svg>`,

  calendar: `<svg ${attrs}><rect x="9" y="8" width="30" height="34" rx="3"/><rect x="17" y="4" width="14" height="8" rx="2"/><line x1="15" y1="21" x2="33" y2="21"/><line x1="15" y1="28" x2="33" y2="28"/><line x1="15" y1="35" x2="25" y2="35"/></svg>`,

  'heart-arm': `<svg ${attrs}><path d="M8 36c0-11 6-21 17-23-2 6 0 11 6 11"/><path d="M29 11c2-3 6-3 8 0 2-3 6-3 8 0 0 4-4 8-8 10-4-2-8-6-8-10Z"/></svg>`,

  trainer: `<svg ${attrs}><circle cx="24" cy="13" r="6"/><path d="M12 41c0-8 5.4-13 12-13s12 5 12 13"/></svg>`,

  group: `<svg ${attrs}><circle cx="18" cy="15" r="5"/><circle cx="32" cy="17" r="4"/><path d="M7 39c0-6.6 4.9-11 11-11s11 4.4 11 11"/><path d="M32 28c4.4 0 9 3.6 9 11"/></svg>`,

  trophy: `<svg ${attrs}><path d="M16 9h16v9a8 8 0 0 1-16 0V9Z"/><path d="M16 12h-5a5 5 0 0 0 5 5"/><path d="M32 12h5a5 5 0 0 1-5 5"/><line x1="24" y1="26" x2="24" y2="37"/><line x1="16" y1="40" x2="32" y2="40"/></svg>`,

  sparkle: `<svg ${attrs}><path d="M24 7l3.6 10L38 21l-10.4 4L24 35l-3.6-10L10 21l10.4-4Z"/><line x1="37" y1="33" x2="37" y2="41"/><line x1="33" y1="37" x2="41" y2="37"/></svg>`,

  shield: `<svg ${attrs}><path d="M24 6l14 5v12c0 8.5-5.9 15.5-14 18-8.1-2.5-14-9.5-14-18V11Z"/><polyline points="17 23 22 28 31 19"/></svg>`,

  reformer: `<svg ${attrs}><rect x="6" y="21" width="36" height="8" rx="2"/><line x1="12" y1="29" x2="12" y2="37"/><line x1="36" y1="29" x2="36" y2="37"/><line x1="15" y1="21" x2="15" y2="14"/><line x1="10" y1="14" x2="20" y2="14"/></svg>`,

  running: `<svg ${attrs}><circle cx="29" cy="11" r="4"/><path d="M27 17l-6 8 6 5-3 11"/><path d="M21 25l-9 2"/><path d="M30 30l8 3"/></svg>`,
};
