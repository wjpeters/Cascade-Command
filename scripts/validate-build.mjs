import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { GAME_CONFIG } from '../src/game-config.js';
import { PORTRAITS } from '../plugins/easter-eggs/portraits.js';
import { ASSETS } from '../src/assets.js';
const code = await readFile(new URL('../dist/server/index.js', import.meta.url));
const { default: worker } = await import('data:text/javascript;base64,' + code.toString('base64'));
assert.equal(typeof worker.fetch, 'function');
for (const route of ['/', '/admin', '/admin/', '/admin.js', '/admin.css', '/src/main.js', '/src/asset-loader.js', '/src/assets.js', '/src/engine.js', '/src/game-config.js', '/src/game-rules.js', '/style.css', '/tokens.css', ...Object.values(ASSETS), '/vendor/qrcode.js', '/favicon.svg']) {
  const result = await worker.fetch(new Request('https://game.example' + route), {});
  assert.equal(result.status, 200, route);
  assert.ok((await result.arrayBuffer()).byteLength > 0, route);
  if (route.endsWith('.webp')) {
    assert.equal(result.headers.get('content-type'), 'image/webp', route);
    assert.match(result.headers.get('cache-control'), /immutable/, route);
  }
}
const result = await worker.fetch(new Request('https://game.example/api/meta'), {});
assert.equal((await result.json()).hosting, 'sites');
for (const route of ['/server.mjs', '/data/leaderboard.json', '/.openai/hosting.json', '/.env', '/assets/sprites.png', '/assets/space.png', '/assets/riskstudio-logo.png', '/design/source-assets/sprites.png']) {
  assert.equal((await worker.fetch(new Request('https://game.example' + route), {})).status, 404, route);
}
console.log('Worker build: assets, game modules, QR library, metadata and private-file boundaries verified.');

for (const route of ['/plugins/easter-eggs/index.js', '/plugins/easter-eggs/cards.js', '/plugins/easter-eggs/detector.js', '/plugins/easter-eggs/observe.js', '/plugins/easter-eggs/portraits.js', '/plugins/easter-eggs/plugin.css', ...Object.values(PORTRAITS)]) {
  const response = await worker.fetch(new Request('https://game.example' + route), {});
  assert.equal(response.status, GAME_CONFIG.easterEggs === true ? 200 : 404, route);
}
assert.equal((await worker.fetch(new Request('https://game.example/plugins/easter-eggs/README.md'), {})).status, 404);
console.log('Easter eggs: ' + (GAME_CONFIG.easterEggs === true ? 'plugin and all ten portraits included' : 'plugin code and portraits absent from Worker') + '.');

assert.equal((await worker.fetch(new Request('https://game.example/api/admin/me'), {})).status, 401);
for (const route of ['/admin/api.js', '/admin/local-storage.js', '/worker/admin-storage.js']) {
  assert.equal((await worker.fetch(new Request('https://game.example' + route), {})).status, 404, route);
}
console.log('Leaderboard admin: page assets available; anonymous access denied; server code private.');
