import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createLiveLeaderboard, gameShareUrl } from '../src/leaderboard-live.js';
import { VERSION } from '../src/engine.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
function harness(load) {
  const timers = new Map(), scores = [], statuses = []; let index = 0;
  const live = createLiveLeaderboard({ load, onScores: value => scores.push(value), onStatus: value => statuses.push(value), visible: () => true,
    setTimer: (callback, delay) => { const id = ++index; timers.set(id, { callback, delay }); return id; }, clearTimer: id => timers.delete(id) });
  const tick = async () => { const [id, timer] = timers.entries().next().value; timers.delete(id); timer.callback(); await flush(); return timer.delay; };
  return { live, timers, scores, statuses, tick };
}
test('display updates every two seconds, handles score deletion/reset, and never overlaps requests', async () => {
  let resolve, count = 0;
  const h = harness(() => { count++; return new Promise(done => { resolve = done; }); });
  h.live.start(); h.live.refresh(); h.live.start(); assert.equal(count, 1);
  resolve([{ id: 'a', score: 100 }]); await flush();
  assert.deepEqual(h.statuses, ['connecting', 'live']); assert.equal(h.timers.size, 1);
  assert.equal(await h.tick(), 2000); h.live.refresh(); assert.equal(count, 2);
  resolve([]); await flush(); assert.deepEqual(h.scores, [[{ id: 'a', score: 100 }], []]);
  h.live.stop(); assert.equal(h.timers.size, 0);
});
test('network and malformed-response failures preserve the good scores and retry automatically', async () => {
  let count = 0;
  const h = harness(async () => { count++; if (count === 2) throw new Error('offline'); return count === 3 ? {} : [{ id: 'good', score: count * 100 }]; });
  h.live.start(); await flush();
  assert.equal(await h.tick(), 2000); assert.equal(h.statuses.at(-1), 'offline'); assert.equal(h.scores.length, 1);
  assert.equal(await h.tick(), 5000); assert.equal(h.statuses.at(-1), 'offline'); assert.equal(h.scores.length, 1);
  assert.equal(await h.tick(), 5000); assert.equal(h.statuses.at(-1), 'live'); assert.equal(h.scores.at(-1)[0].score, 400);
  h.live.stop();
});
test('hiding or leaving aborts the request and an old response cannot overwrite resumed scores', async () => {
  const requests = [];
  const h = harness(signal => new Promise(resolve => requests.push({ signal, resolve })));
  h.live.start(); h.live.stop(); assert.equal(requests[0].signal.aborted, true);
  h.live.start(); requests[1].resolve([{ id: 'new' }]); await flush();
  requests[0].resolve([{ id: 'old' }]); await flush();
  assert.deepEqual(h.scores, [[{ id: 'new' }]]); assert.equal(h.timers.size, 1);
  h.live.stop();
});
test('QR targets the game root for online, LAN and localhost displays, never the leaderboard', () => {
  assert.equal(gameShareUrl({ hosting: 'sites' }, 'https://game.example/leaderboard?theme=classic'), 'https://game.example/');
  assert.equal(gameShareUrl({ mobileUrls: ['http://192.168.1.4:4317'] }, 'http://localhost:4317/leaderboard'), 'http://192.168.1.4:4317/');
  assert.equal(gameShareUrl({ mobileUrls: ['http://192.168.1.4:4317'] }, 'http://192.168.1.5:4317/leaderboard/'), 'http://192.168.1.5:4317/');
  assert.equal(gameShareUrl({ mobileUrls: [] }, 'http://localhost:4317/leaderboard'), '');
  assert.equal(gameShareUrl({ mobileUrls: ['javascript:alert(1)', 'http://localhost:4317', 'http://user:password@192.168.1.4', 'http://10.0.0.4:4317'] }, 'http://127.0.0.1:4317/leaderboard'), 'http://10.0.0.4:4317/');
});
test('local display routes share the current top ten and keep private/server files unavailable', async t => {
  const directory = await mkdtemp(path.join(tmpdir(), 'cascade-display-test-'));
  const entries = Array.from({ length: 12 }, (_, index) => ({ id: 'fixture-' + index, name: 'Test ' + index, score: index * 100, services: index % 4, date: '2026-10-06T10:00:00.000Z', version: VERSION }));
  entries.push({ id: 'old', name: 'Old', score: 999999, services: 3, date: '2026-10-01', version: 'cascade-old' });
  await writeFile(path.join(directory, 'leaderboard.json'), JSON.stringify(entries));
  const child = spawn(process.execPath, ['server.mjs'], { cwd: new URL('..', import.meta.url), env: { ...process.env, CASCADE_DATA_DIR: directory, PORT: '0', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(async () => { if (child.exitCode === null) { child.kill(); await once(child, 'exit'); } await rm(directory, { recursive: true, force: true }); });
  let output = '';
  const port = await new Promise((resolve, reject) => { child.stdout.on('data', bytes => { output += bytes; const match = output.match(/localhost:(\d+)/); if (match) resolve(match[1]); }); child.on('error', reject); child.on('exit', code => reject(new Error('server exit ' + code))); });
  const base = 'http://localhost:' + port;
  for (const route of ['/leaderboard', '/leaderboard/', '/leaderboard.html']) {
    const response = await fetch(base + route); assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /leaderboard-display\.js/);
    assert.equal((await fetch(base + route, { method: 'HEAD' })).status, 200);
  }
  for (const route of ['/src/leaderboard-live.js', '/src/leaderboard-display.js', '/leaderboard.css', '/themes/classic/leaderboard.css', '/themes/riskstudio-app/leaderboard.css']) assert.equal((await fetch(base + route)).status, 200, route);
  const response = await fetch(base + '/api/leaderboard'); assert.equal(response.headers.get('cache-control'), 'no-store');
  const board = (await response.json()).scores; assert.equal(board.length, 10); assert.equal(board[0].id, 'fixture-11'); assert.equal(board[9].id, 'fixture-2');
  const meta = await (await fetch(base + '/api/meta')).json();
  assert.equal(meta.leaderboardDisplay, true); assert.equal(meta.port, Number(port));
  for (const address of meta.mobileUrls) assert.equal(new URL(address).port, port, 'QR uses the actual listening port');
  for (const route of ['/data/leaderboard.json', '/server.mjs', '/.openai/hosting.json']) assert.ok([403, 404].includes((await fetch(base + route)).status), route);
});
