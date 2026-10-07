import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { THEMES, resolveTheme } from '../src/themes/index.js';
import { configFingerprint } from '../src/game-rules.js';
import { Game, GAME_CONFIG, SEED, VERSION, replay } from '../src/engine.js';
import { Renderer } from '../src/renderer.js';
import { Renderer as AppRenderer } from '../src/themes/riskstudio-app/renderer.js';
import { symbolMarkup, serviceSymbolMarkup } from '../src/symbols.js';

test('saved themes stay immutable and missing/unknown/prototype IDs recover Classic', () => {
  const classic = resolveTheme('classic');
  for (const id of [undefined, null, '', 'experiment-not-installed', '__proto__', 'constructor', {}]) {
    assert.equal(resolveTheme(id), classic);
  }
  assert.throws(() => { classic.canvas.organization = '#ffffff'; }, TypeError);
  assert.throws(() => { classic.symbols.categories.cve = 'M0 0'; }, TypeError);
  assert.throws(() => { THEMES.classic = {}; }, TypeError);
});

test('every registered theme has complete palettes, icons and available presentation files', async () => {
  for (const [id, theme] of Object.entries(THEMES)) {
    assert.equal(theme.id, id);
    assert.deepEqual(Object.keys(theme.categories).sort(), ['cve', 'geo', 'incident', 'law', 'low', 'rating']);
    assert.deepEqual(Object.keys(theme.services).sort(), ['operations', 'payments', 'portal']);
    for (const key of Object.keys(theme.categories)) assert.ok(theme.symbols.categories[key]);
    for (const key of Object.keys(theme.services)) assert.ok(theme.symbols.services[key]);
    for (const color of Object.values(theme.categories)) assert.match(color, /^#[0-9a-f]{6}$/i, 'Canvas trails add their own alpha');
    assert.ok(theme.fonts.sans && theme.fonts.mono);
    for (const route of [theme.stylesheet, theme.leaderboardStylesheet, theme.renderer, ...(theme.shell ? [theme.shell] : []), theme.pluginStylesheet, ...Object.values(theme.assets)]) {
      assert.match(route, /^\/(?:themes|src|plugins|assets)\//);
      const path = route.startsWith('/src/') || route.startsWith('/plugins/') ? '..' + route : '../public' + route;
      await access(new URL(path, import.meta.url));
    }
  }
});

test('theme changes keep the published score edition and deterministic round/replay results', () => {
  assert.equal(VERSION, 'cascade-3-14f91b15', 'existing public leaderboard must remain selected');
  const actions = [{ tick: 0, type: 'scan' }, { tick: 60, type: 'shot', x: 300, y: 200 }];
  const original = replay(actions, SEED);
  const fingerprint = configFingerprint(GAME_CONFIG);
  for (const theme of ['classic', 'riskstudio-app', 'riskstudio-cc-v1', 'future-design', undefined]) {
    const config = { ...structuredClone(GAME_CONFIG), theme };
    if (theme === undefined) delete config.theme;
    assert.equal(configFingerprint(config), fingerprint);
    const game = replay(actions, SEED, config);
    for (const key of ['score', 'hp', 'tick', 'energy', 'intercepted', 'discovered', 'prevented', 'mistakes', 'intelligence']) {
      assert.deepEqual(game[key], original[key], key);
    }
  }
});

test('actual Galaxy rendering and HTML symbols use the supplied theme without changing game state', t => {
  const previous = Object.fromEntries(['Path2D', 'ResizeObserver', 'matchMedia', 'devicePixelRatio'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.assign(globalThis, {
    Path2D: class { constructor(path) { this.path = path; } },
    ResizeObserver: class { observe() {} },
    matchMedia: () => ({ matches: true }), devicePixelRatio: 1,
  });
  t.after(() => { for (const [key, descriptor] of Object.entries(previous)) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key]; });
  const theme = structuredClone(resolveTheme());
  Object.assign(theme.canvas, { organization: '#123456', surface: '#234567', critical: '#345678' });
  theme.categories.cve = '#456789'; theme.services.portal = '#56789a';
  theme.fonts.sans = 'serif'; theme.symbols.categories.cve = 'M1 1L4 4'; theme.symbols.services.portal = 'M2 2L5 5';
  const colors = new Set(), fonts = new Set(), paths = new Set();
  const context = new Proxy({
    globalAlpha: 1, measureText: text => ({ width: text.length * 9 }),
    createLinearGradient: () => ({ addColorStop: (_, color) => colors.add(color) }),
    createRadialGradient: () => ({ addColorStop: (_, color) => colors.add(color) }),
    stroke: path => { if (path) paths.add(path.path); },
  }, {
    get: (object, key) => key in object ? object[key] : () => {},
    set: (object, key, value) => { if (['fillStyle', 'strokeStyle', 'shadowColor'].includes(key)) colors.add(value); if (key === 'font') fonts.add(value); object[key] = value; return true; },
  });
  const canvas = { getContext: () => context, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 800 }) };
  const game = new Game(); game.spawn('i0', 'c0', 1, null, 'cve');
  const before = JSON.stringify(game);
  for (const ThemedRenderer of [Renderer, AppRenderer]) {
    const renderer = new ThemedRenderer(canvas, theme);
    renderer.render(game, 'playing');
    assert.deepEqual(renderer.point(400, 400), { x: 500, y: 500 }, 'both themes retain game coordinates');
    assert.equal(JSON.stringify(game), before);
  }
  for (const color of ['#123456', '#234567', '#345678', '#456789', '#56789a']) assert.ok(colors.has(color), color);
  assert.ok([...fonts].some(font => font.endsWith('serif')));
  assert.ok(paths.has('M1 1L4 4') && paths.has('M2 2L5 5'));
  assert.match(symbolMarkup('cve', theme), /M1 1L4 4/);
  assert.match(serviceSymbolMarkup('Klantportaal', theme), /M2 2L5 5/);
  assert.equal(JSON.stringify(game), before);
});
