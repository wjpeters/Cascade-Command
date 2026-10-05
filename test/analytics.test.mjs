import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { analyticsStorage } from '../worker/analytics-storage.js';
import { localAnalytics } from '../analytics/local-storage.js';
import { eventRecord, metadata, DAY, dayKey, sinceDay } from '../analytics/common.js';
import { handleApi } from '../worker/api.js';
import { VERSION } from '../src/engine.js';
const owner = { 'oai-authenticated-user-id': 'owner', 'oai-authenticated-user-email': 'owner@example.com' };
function setup(t) {
  const sql = new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
  t.after(() => sql.close());
  const DB = {
    prepare(query) { return { bind(...args) { const statement = sql.prepare(query); return {
      first: async () => statement.get(...args) ?? null, all: async () => ({ results: statement.all(...args) }),
      run: () => ({ meta: { changes: Number(statement.run(...args).changes) } }),
    }; } }; },
    async batch(statements) { sql.exec('BEGIN'); try { const values = statements.map(s => s.run()); sql.exec('COMMIT'); return values; } catch (e) { sql.exec('ROLLBACK'); throw e; } },
  };
  const env = { DB, CASCADE_ADMIN_EMAILS: 'owner@example.com' };
  const call = (route, body, headers = {}) => handleApi(new Request('https://game.example' + route, {
    method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://game.example', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }), env);
  return { sql, env, call, store: analyticsStorage(env) };
}
const meta = metadata(new Request('https://game.example', { headers: { 'CF-Connecting-IP': '198.51.100.7', 'CF-IPCountry': 'NL', 'User-Agent': 'Mozilla/5.0 (iPhone) AppleWebKit Safari Mobile', 'Accept-Language': 'nl-NL,nl;q=0.9' } }), { referrer: 'https://example.org/path?secret=not-stored', width: 390 });
test('metadata uses network IP only, discards full referrer URLs and identifies missing proxy data', () => {
  assert.equal(meta.ip, '198.51.100.7'); assert.equal(meta.country, 'NL'); assert.equal(meta.referrer, 'example.org'); assert.equal(meta.language, 'nl-NL'); assert.equal(meta.device, 'Telefoon'); assert.equal(meta.viewport, '<768 px');
  for (const address of ['2a06:98c0:3600::103', '2a06:98c0:3600:0000:0000:0000:0000:0103', 'invalid', '999.2.3.4', '0.0.0.0', '::']) {
    assert.equal(metadata(new Request('https://game.example', { headers: { 'CF-Connecting-IP': address } })).ip, null);
  }
  const spoof = metadata(new Request('https://game.example', { headers: { 'X-Forwarded-For': '198.51.100.8' } }), { ip: '198.51.100.9', country: 'NL', referrer: 'javascript:alert(1)' });
  assert.equal(spoof.ip, null); assert.equal(spoof.country, ''); assert.equal(spoof.referrer, '');
  assert.equal(metadata(new Request('http://localhost', { headers: { 'CF-Connecting-IP': '198.51.100.1' } }), {}, '::ffff:127.0.0.1').ip, '127.0.0.1');
  assert.equal(metadata(new Request('https://game.example'), { referrer: 'https://game.example/private' }).referrer, '');
});
test('Amsterdam day filters use calendar days through daylight-saving transitions', () => {
  assert.equal(dayKey(Date.parse('2026-10-04T23:30:00Z')), '2026-10-05');
  assert.equal(sinceDay(1, Date.parse('2026-10-25T22:30:00Z')), '2026-10-25');
  assert.equal(sinceDay(7, Date.parse('2026-10-25T22:30:00Z')), '2026-10-19');
});
test('visits, round completion without score, retries and leaderboard saves count once', async t => {
  const { call, sql } = setup(t);
  const visit = { id: '12345678-1234-4123-8123-123456789abc', analytics: { referrer: 'https://example.org/?token=x' } };
  const headers = { 'CF-Connecting-IP': '198.51.100.8' };
  for (let i = 0; i < 2; i++) assert.equal((await call('/api/visit', visit, headers)).status, 201);
  assert.equal((await call('/api/visit', visit, { Origin: 'https://evil.example' })).status, 403);
  const session = await (await call('/api/session', { analytics: { width: 390 } }, headers)).json();
  assert.equal((await call('/api/finish', { session: session.id, actions: [] })).status, 400, 'cannot finish early');
  sql.prepare('UPDATE sessions SET started = ? WHERE id = ?').run(Date.now() - 80000, session.id);
  for (let i = 0; i < 2; i++) assert.equal((await call('/api/finish', { session: session.id, actions: [] })).status, 200);
  let stats = await (await call('/api/admin/stats', undefined, owner)).json();
  assert.deepEqual([stats.totals.visits, stats.totals.starts, stats.totals.completed, stats.totals.saved], [1, 1, 1, 0]);
  assert.equal((await (await call('/api/leaderboard')).json()).scores.length, 0, 'finishing does not publish a score');
  for (let i = 0; i < 2; i++) assert.ok([200, 201].includes((await call('/api/score', { session: session.id, name: 'Test', actions: [] })).status));
  stats = await (await call('/api/admin/stats', undefined, owner)).json(); assert.equal(stats.totals.saved, 1); assert.equal(stats.totals.completed, 1); assert.equal(stats.network.uniqueIps, 1);
  assert.equal('id' in stats.recent[0], false, 'session credentials are never returned in statistics');
  await call('/api/admin/reset', { version: VERSION, confirmation: 'RESET' }, owner);
  stats = await (await call('/api/admin/stats', undefined, owner)).json(); assert.equal(stats.totals.starts, 1); assert.equal(stats.totals.saved, 1, 'board reset leaves historical analytics intact');
});
test('statistics are admin-only, reject invalid periods, and are not part of public API responses', async t => {
  const { call } = setup(t);
  assert.equal((await call('/api/admin/stats')).status, 401);
  assert.equal((await call('/api/admin/stats', undefined, { ...owner, 'oai-authenticated-user-email': 'other@example.com' })).status, 403);
  for (const query of ['days=-1', 'days=365', 'page=0', 'page=1.5']) assert.equal((await call('/api/admin/stats?' + query, undefined, owner)).status, 400);
  const response = await call('/api/admin/stats', undefined, owner); assert.equal(response.headers.get('cache-control'), 'no-store');
  const session = await (await call('/api/session', {})).json(); assert.deepEqual(Object.keys(session).sort(), ['id', 'seed', 'version']);
  assert.equal(JSON.stringify(await (await call('/api/leaderboard')).json()).includes('ip'), false);
});
for (const implementation of ['hosted', 'local']) test(`${implementation} retention clears IPs and details while preserving daily totals, filters and pagination`, async t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cascade-analytics-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'analytics.json');
  let store = implementation === 'hosted' ? setup(t).store : localAnalytics(filename);
  const now = Date.now(), dates = [now - 100 * DAY, now - 40 * DAY, now - 3 * DAY];
  // Record oldest first. Each write prunes old details but preserves previously counted totals.
  for (const [index, time] of dates.entries()) await store.record(eventRecord('visit:' + index, 'visit', time, VERSION, meta));
  for (let i = 0; i < 27; i++) { const event = eventRecord('round:' + i, 'round', now, VERSION, meta); await store.record(event); await store.record(event); }
  await store.complete('round:0', { score: 900, services: 2, tick: 4500 }, true, now); await store.complete('round:0', { score: 900, services: 2, tick: 4500 }, true, now);
  if (implementation === 'local') { assert.ok(existsSync(filename)); store = localAnalytics(filename); }
  const all = await store.stats(0, 1, now); assert.equal(all.totals.visits, 3); assert.equal(all.totals.starts, 27); assert.equal(all.totals.completed, 1); assert.equal(all.totals.saved, 1); assert.equal(all.recent.length, 25);
  assert.equal(all.network.samples, 1); assert.equal(all.network.uniqueIps, 1); assert.equal(all.groups.device[0].count, 2, 'details older than 90 days removed');
  assert.equal((await store.stats(0, 2, now)).recent.length, 2);
  assert.equal((await store.stats(7, 1, now)).totals.visits, 1);
  const later = await store.stats(0, 1, now + 31 * DAY); assert.equal(later.network.uniqueIps, 0); assert.equal(later.recent[0].ip, null); assert.equal(later.totals.starts, 27);
  const expired = await store.stats(0, 1, now + 91 * DAY); assert.equal(expired.recentTotal, 0); assert.equal(expired.totals.starts, 27); assert.equal(expired.daily.length, 30);
});
test('analytics frontend works on insecure LAN HTTP and does not crash gameplay when tracking is unavailable', async () => {
  const source = readFileSync(new URL('../src/analytics.js', import.meta.url), 'utf8').replaceAll('export function', 'function');
  const requests = [];
  const context = vm.createContext({ crypto: { getRandomValues: array => webcrypto.getRandomValues(array) }, Uint8Array, document: { referrer: '' }, window: { innerWidth: 390 }, fetch: (url, options) => { requests.push({ url, options }); return Promise.resolve({ ok: true }); } });
  vm.runInContext(source + ';recordVisit();', context); assert.equal(requests.length, 1); assert.match(JSON.parse(requests[0].options.body).id, /^[0-9a-f-]{36}$/);
  vm.runInNewContext(source + ';recordVisit();', { document: {}, window: {}, fetch: () => { throw new Error('Unavailable'); } });
});
