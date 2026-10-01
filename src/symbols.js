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

// Stable identities: the same name, letter, colour and icon on the node and status row.
export const SERVICE_VISUALS = {
  Klantportaal: {key:'portal',code:'A',color:'#81dff2',path:'M3 4h18v16H3Z M3 8h18 M6 6h.1 M8 6h.1 M13 11v6 M10 14h7 M15 12l2 2-2 2'},
  Betalingen: {key:'payments',code:'B',color:'#c4b5fd',path:'M3 5h18v14H3Z M3 9h18 M6 15h4 M15 14h3v2h-3Z'},
  Operatie: {key:'operations',code:'C',color:'#f5cf86',path:'M9 3h6l.5 3 2 1 2.7-1L23 11l-2.4 2 0 2L23 17l-2.8 4-2.7-1-2 1-.5 2H9l-.5-2-2-1-2.7 1L1 17l2.4-2v-2L1 11l2.8-5 2.7 1 2-1Z M16 13a4 4 0 1 1-8 0a4 4 0 0 1 8 0'},
};
export function serviceSymbolMarkup(name) {
  const service=SERVICE_VISUALS[name];
  return `<svg viewBox="0 0 24 26" aria-hidden="true"><path d="${service.path}"/></svg><b>${service.code}</b>`;
}
