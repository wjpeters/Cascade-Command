import { GAME_CONFIG } from './game-config.js';
import { DEFAULT_THEME_ID, resolveTheme } from './themes/index.js';

// Keep the previous stylesheet until the replacement has loaded successfully.
function loadStylesheet(theme, document, view) {
  const stylesheet = view === 'leaderboard' ? theme.leaderboardStylesheet : theme.stylesheet;
  const current = document.getElementById('game-theme');
  if (current?.getAttribute('href') === stylesheet && current.sheet) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = stylesheet;
    link.media = 'not all';
    const timeout = setTimeout(failed, 8000);
    function cleanup() { clearTimeout(timeout); link.onload = link.onerror = null; }
    function failed() {
      cleanup(); link.remove();
      reject(new Error(`Thema ${theme.id} kon niet laden.`));
    }
    link.onerror = failed;
    link.onload = () => {
      cleanup(); link.media = 'all'; current?.remove(); link.id = 'game-theme'; resolve();
    };
    document.head.append(link);
  });
}

export async function initializeTheme(id = GAME_CONFIG.theme, document = globalThis.document, view = 'game') {
  let theme = resolveTheme(id);
  if (id !== undefined && theme.id !== id) console.warn(`Onbekend thema ${String(id)}; Classic wordt gebruikt.`);
  try { await loadStylesheet(theme, document, view); }
  catch (error) {
    if (theme.id === DEFAULT_THEME_ID) throw error;
    console.warn(error.message + ' Classic wordt gebruikt.');
    theme = resolveTheme();
    await loadStylesheet(theme, document, view);
  }
  const style = document.documentElement.style;
  for (const [kind, color] of Object.entries(theme.categories)) style.setProperty('--risk-' + kind, color);
  for (const [key, color] of Object.entries(theme.services)) style.setProperty('--service-' + key, color);
  style.setProperty('--game-background', `url("${theme.assets.background}")`);
  document.documentElement.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.metaColor);
  document.querySelector('.brand img')?.setAttribute('src', theme.assets.logo);
  return theme;
}
