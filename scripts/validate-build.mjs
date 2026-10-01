import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ASSETS } from '../src/assets.js';
const code = await readFile(new URL('../dist/server/index.js', import.meta.url));
const { default: worker } = await import('data:text/javascript;base64,' + code.toString('base64'));
assert.equal(typeof worker.fetch, 'function');
for (const route of ['/', '/src/main.js', '/src/asset-loader.js', '/src/assets.js', '/src/engine.js', '/src/game-config.js', '/src/game-rules.js', '/style.css', '/tokens.css', ...Object.values(ASSETS), '/vendor/qrcode.js', '/favicon.svg']) {
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
