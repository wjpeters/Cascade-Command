// The same category symbols are used in the galaxy, feed and legend.
export const CATEGORIES = {
  incident: {title:'Incident', detail:'Operationele verstoring', color:'#ff6969', path:'M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0 M12 3v4 M12 17v4 M3 12h4 M17 12h4 M5.6 5.6l3 3 M15.4 15.4l3 3 M5.6 18.4l3-3 M15.4 8.6l3-3 M10.5 11h.1 M13.5 13h.1'},
  cve: {title:'Kwetsbaarheid', detail:'Technische zwakte · CVE', color:'#ffb45c', path:'M12 3L22 21H2Z M12 9v5 M12 17v.5'},
  geo: {title:'Geopolitiek', detail:'Land- en regiorisico’s', color:'#b287ff', path:'M2 8l10-6 10 6Z M4 10v9 M9 10v9 M15 10v9 M20 10v9 M2 21h20 M3 19h18'},
  law: {title:'Wet- en regelgeving', detail:'Nieuwe eisen en sancties', color:'#709fff', path:'M12 3v18 M7 21h10 M3 7h18 M6 7L2 15h8Z M18 7l-4 8h8Z'},
  rating: {title:'Cyberrating', detail:'Vertrouwen en reputatie', color:'#72e4ec', path:'M2 12Q12-1 22 12Q12 25 2 12Z M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0 M12 10v.1'},
  low: {title:'Laag risico', detail:'Laten passeren', color:'#9babbd', path:'M20 12a8 8 0 1 1-16 0a8 8 0 0 1 16 0 M8 12h8'},
};
export function symbolMarkup(kind) {
  const item=CATEGORIES[kind];
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${item.path}"/></svg>`;
}
