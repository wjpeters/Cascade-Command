import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const code = await readFile(new URL('../dist/server/index.js', import.meta.url));
const { default: worker } = await import('data:text/javascript;base64,' + code.toString('base64'));
assert.equal(typeof worker.fetch, 'function');
for (const route of ['/', '/src/main.js', '/src/engine.js', '/src/game-config.js', '/src/game-rules.js', '/style.css', '/tokens.css', '/assets/sprites.png', '/assets/space.png', '/vendor/qrcode.js', '/favicon.svg']) {
  const result = await worker.fetch(new Request('https://game.example' + route), {});
  assert.equal(result.status, 200, route);
  assert.ok((await result.arrayBuffer()).byteLength > 0, route);
}
const result = await worker.fetch(new Request('https://game.example/api/meta'), {});
assert.equal((await result.json()).hosting, 'sites');
for (const route of ['/server.mjs', '/data/leaderboard.json', '/.openai/hosting.json', '/.env']) {
  assert.equal((await worker.fetch(new Request('https://game.example' + route), {})).status, 404, route);
}
console.log('Worker build: assets, game modules, QR library, metadata and private-file boundaries verified.');
