import { resolveTheme } from './themes/index.js';
// The same category symbols are used in the galaxy, feed and legend.
export const CATEGORIES = {
  incident: {title:'Incident', detail:'Operationele verstoring'},
  cve: {title:'Kwetsbaarheid', detail:'Technische zwakte · CVE'},
  geo: {title:'Geopolitiek', detail:'Land- en regiorisico’s'},
  law: {title:'Wet- en regelgeving', detail:'Nieuwe eisen en sancties'},
  rating: {title:'Cyberrating', detail:'Vertrouwen en reputatie'},
  low: {title:'Laag risico', detail:'Laten passeren'},
};
export function symbolMarkup(kind, theme = resolveTheme()) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${theme.symbols.categories[kind]}"/></svg>`;
}

// Stable identities: names, letters and icons. Colours come from the selected theme.
export const SERVICE_VISUALS = {
  Klantportaal: {key:'portal',code:'A'},
  Betalingen: {key:'payments',code:'B'},
  Operatie: {key:'operations',code:'C'},
};
export function serviceSymbolMarkup(name, theme = resolveTheme()) {
  const service=SERVICE_VISUALS[name];
  return `<svg viewBox="0 0 24 26" aria-hidden="true"><path d="${theme.symbols.services[service.key]}"/></svg><b>${service.code}</b>`;
}
