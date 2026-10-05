import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { VERSION } from '../src/engine.js';
import { handleApi } from '../worker/api.js';
import { localAdmin } from '../admin/api.js';
const owner = { 'oai-authenticated-user-id': 'site-scoped-owner', 'oai-authenticated-user-email': 'owner@example.com' };
function setup(t) {
  const sql = new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
  t.after(() => sql.close());
  const DB = {
    prepare(query) { return { bind(...args) { const statement = sql.prepare(query); return {
      first: async () => statement.get(...args) ?? null,
      all: async () => ({ results: statement.all(...args) }),
      run: () => ({ meta: { changes: Number(statement.run(...args).changes) } }),
    }; } }; },
    async batch(statements) { sql.exec('BEGIN'); try { const result = statements.map(s => s.run()); sql.exec('COMMIT'); return result; } catch (e) { sql.exec('ROLLBACK'); throw e; } },
  };
  const env = { DB, CASCADE_ADMIN_EMAILS: 'owner@example.com' };
  const call = (route, body, headers = owner) => handleApi(new Request('https://game.example' + route, {
    method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://game.example', ...headers },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  }), env);
  const add = (id, version = VERSION, score = 100) => {
    const entry = { id, version, name: 'Speler ' + id, score, services: 2, date: '2026-10-01T10:00:00.000Z' };
    sql.prepare('INSERT INTO scores (id, session_id, name, score, services, date, version) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, 'session-' + id, entry.name, score, 2, entry.date, version);
    return entry;
  };
  return { sql, call, add, env };
}
test('admin defaults closed, requires a configured authenticated owner and checks every endpoint', async t => {
  const { call, env } = setup(t);
  for (const route of ['me', 'leaderboard', 'export', 'update', 'delete', 'reset']) {
    assert.equal((await call('/api/admin/' + route, ['update', 'delete', 'reset'].includes(route) ? {} : undefined, {})).status, 401, route);
    assert.equal((await call('/api/admin/' + route, undefined, { ...owner, 'oai-authenticated-user-email': 'other@example.com' })).status, 403, route);
  }
  assert.equal((await call('/api/admin/me', undefined, { 'oai-authenticated-user-email': 'owner@example.com' })).status, 401);
  env.CASCADE_ADMIN_EMAILS = '';
  assert.equal((await call('/api/admin/me')).status, 403);
  env.CASCADE_ADMIN_EMAILS = ' OWNER@example.com ';
  const response = await call('/api/admin/me'); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await call('/api/admin/reset', {}, { ...owner, Origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('/api/admin/reset', {}, { ...owner, Origin: '' })).status, 403);
  assert.equal((await call('/api/admin/export', undefined, { ...owner, 'Sec-Fetch-Site': 'cross-site' })).status, 403);
});
test('admin lists every page, searches, exports and selects earlier editions without changing the public board', async t => {
  const { call, add } = setup(t);
  for (let i = 0; i < 56; i++) add(String(i), VERSION, i);
  add('oud', 'cascade-old', 9999);
  const first = await (await call('/api/admin/leaderboard')).json(); assert.equal(first.scores.length, 50); assert.equal(first.total, 56); assert.equal(first.scores[0].score, 55);
  const second = await (await call('/api/admin/leaderboard?page=2')).json(); assert.equal(second.scores.length, 6);
  const found = await (await call('/api/admin/leaderboard?q=Speler%2055')).json(); assert.equal(found.total, 1);
  const old = await (await call('/api/admin/leaderboard?version=cascade-old')).json(); assert.equal(old.scores.length, 1);
  const exported = await (await call('/api/admin/export')).json(); assert.equal(exported.scores.length, 56); assert.equal('session_id' in exported.scores[0], false);
  assert.equal((await (await call('/api/leaderboard')).json()).scores.length, 10);
  assert.equal((await call('/api/admin/leaderboard?page=-1')).status, 400);
});
test('admin edits persist, reorder the public board and reject stale, malformed or invalid writes', async t => {
  const { call, add, sql } = setup(t); const a = add('a', VERSION, 100), b = add('b', VERSION, 200);
  const input = { id: a.id, version: VERSION, expected: a, name: 'Nieuwe naam', score: 500, services: 3 };
  assert.equal((await call('/api/admin/update', input)).status, 200);
  assert.equal((await (await call('/api/leaderboard')).json()).scores[0].name, 'Nieuwe naam');
  assert.equal(sql.prepare('SELECT date FROM scores WHERE id = ?').get('a').date, a.date);
  assert.equal((await call('/api/admin/update', input)).status, 409);
  assert.equal((await call('/api/admin/delete', { id: 'a', version: VERSION, expected: a })).status, 409);
  for (const invalid of [{ score: -1 }, { score: 1.2 }, { score: '50' }, { score: 10000000 }, { services: 4 }, { name: '<script>' }]) {
    assert.equal((await call('/api/admin/update', { ...input, id: b.id, expected: b, ...invalid })).status, 400);
  }
  for (const body of ['null', '[]', '{broken', 'x'.repeat(9000)]) assert.equal((await call('/api/admin/update', body)).status, 400);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM scores').get().n, 2);
});
test('delete cannot be undone by resubmitting a consumed round; reset clears only its edition and its sessions', async t => {
  const { call, add, sql } = setup(t); const a = add('a'), old = add('oud', 'old');
  const now = Date.now();
  sql.prepare('INSERT INTO sessions (id, seed, version, started, expires, consumed) VALUES (?, 1, ?, ?, ?, 1)').run('session-a', VERSION, now - 80000, now + 80000);
  assert.equal((await call('/api/admin/delete', { id: a.id, version: VERSION, expected: a })).status, 200);
  assert.equal((await call('/api/score', { session: 'session-a', name: 'Speler', actions: [] })).status, 400);
  add('b');
  const active = await (await call('/api/session', {})).json();
  sql.prepare('INSERT INTO sessions (id, seed, version, started, expires) VALUES (?, 1, ?, ?, ?)').run('old-round', 'old', now, now + 80000);
  assert.equal((await call('/api/admin/reset', { version: VERSION, confirmation: 'nee' })).status, 400);
  const result = await (await call('/api/admin/reset', { version: VERSION, confirmation: 'RESET' })).json(); assert.equal(result.removed, 1);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM scores').get().n, 1); assert.equal(sql.prepare('SELECT name FROM scores').get().name, old.name);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM sessions WHERE version = ?').get(VERSION).n, 0);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM sessions WHERE version = ?').get('old').n, 1);
  assert.equal((await call('/api/score', { session: active.id, name: 'Speler', actions: [] })).status, 400);
});
test('local admin rejects network visitors and hostile Host values, regardless of claimed identity', () => {
  for (const [remote, host, expected] of [['127.0.0.1', 'localhost', true], ['::1', '[::1]', true], ['192.168.1.2', 'localhost', false], ['127.0.0.1', 'evil.example', false]]) {
    const auth = localAdmin({ socket: { remoteAddress: remote } }, new URL('http://' + host + ':4317/admin'));
    assert.equal(!auth.status, expected);
  }
});
test('local HTTP admin edits and deletes real JSON storage, rejects cross-site writes, and survives restart', async t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cascade-admin-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const entry = { id: 'local', version: VERSION, name: 'Lokaal', score: 50, services: 1, date: '2026-10-01T10:00:00Z' };
  writeFileSync(path.join(directory, 'leaderboard.json'), JSON.stringify([entry, { ...entry, id: 'older', version: 'old' }]));
  let child;
  async function start() {
    child = spawn(process.execPath, ['server.mjs'], { cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '0', HOST: '127.0.0.1', CASCADE_DATA_DIR: directory }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    return await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server did not start')), 5000);
      child.once('error', reject);
      child.stdout.on('data', chunk => { output += chunk; const match = output.match(/http:\/\/localhost:(\d+)/); if (match) { clearTimeout(timer); resolve('http://localhost:' + match[1]); } });
    });
  }
  async function stop() { if (child?.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; } }
  t.after(stop);
  let origin = await start();
  const request = (route, body, extra = {}) => fetch(origin + route, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...extra }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  assert.equal((await request('/admin')).status, 200);
  assert.equal((await request('/api/admin/update', { ...entry, expected: entry, score: 900 })).status, 200);
  assert.equal((await request('/api/admin/reset', { version: VERSION, confirmation: 'RESET' }, { Origin: 'https://evil.example' })).status, 403);
  await stop(); origin = await start();
  const stored = (await (await request('/api/admin/leaderboard')).json()).scores[0]; assert.equal(stored.score, 900);
  assert.equal((await request('/api/admin/delete', { id: stored.id, version: VERSION, expected: stored })).status, 200);
  assert.equal((await (await request('/api/leaderboard')).json()).scores.length, 0);
  assert.equal(JSON.parse(readFileSync(path.join(directory, 'leaderboard.json'))).length, 1);
});
