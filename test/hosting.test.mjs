import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { handleApi } from '../worker/api.js';
function setup(t) {
  const sql = new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../drizzle/', import.meta.url)).filter(f => f.endsWith('.sql')).sort())
    sql.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
  t.after(() => sql.close());
  const DB = {
    prepare(query) {
      return { bind(...args) { const statement = sql.prepare(query); return {
        first: async () => statement.get(...args) ?? null,
        all: async () => ({ results: statement.all(...args) }),
        run: () => ({ meta: { changes: Number(statement.run(...args).changes) } }),
      }; } };
    },
    async batch(statements) {
      sql.exec('BEGIN');
      try { const values = statements.map(s => s.run()); sql.exec('COMMIT'); return values; }
      catch (error) { sql.exec('ROLLBACK'); throw error; }
    },
  };
  const call = (route, body, options = {}) => handleApi(new Request('https://game.example' + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
  }), { DB });
  return { sql, call };
}
test('hosted QR metadata uses the website origin', async t => {
  const { call } = setup(t), response = await call('/api/meta');
  assert.deepEqual((await response.json()).mobileUrls, ['https://game.example/']);
});
test('hosted score is replayed, persisted and duplicate retries create one entry', async t => {
  const { call, sql } = setup(t);
  const session = await (await call('/api/session', {})).json();
  const input = { session: session.id, name: ' Test Speler ', actions: [], score: 9999999 };
  assert.equal((await call('/api/score', input)).status, 400, 'real round duration required');
  sql.prepare('UPDATE sessions SET started = ? WHERE id = ?').run(Date.now() - 80000, session.id);
  const responses = await Promise.all([call('/api/score', input), call('/api/score', input)]);
  const results = await Promise.all(responses.map(r => r.json()));
  assert.ok(responses.every(r => [200, 201].includes(r.status)));
  assert.equal(results[0].score, 0, 'client-supplied points ignored');
  assert.equal(results[0].id, results[1].id);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM scores').get().n, 1);
  const board = await (await call('/api/leaderboard')).json();
  assert.equal(board.scores[0].name, 'Test Speler');
  assert.equal(board.scores[0].score, 0);
  assert.equal(sql.prepare('SELECT consumed FROM sessions WHERE id = ?').get(session.id).consumed, 1);
});
test('hosted API rejects expired rounds, malformed bodies and cross-site writes', async t => {
  const { call, sql } = setup(t), session = await (await call('/api/session', {})).json();
  assert.equal((await call('/api/score', '{broken')).status, 400);
  assert.equal((await call('/api/score', 'x'.repeat(160001))).status, 413);
  assert.equal((await call('/api/session', {}, { headers: { Origin: 'https://other.example' } })).status, 403);
  assert.equal((await call('/api/score', { session: session.id, name: '<script>', actions: [] })).status, 400);
  assert.equal((await call('/api/score', { session: session.id, name: 'Speler', actions: [{ tick: 0, type: 'shot', x: -1, y: 0 }] })).status, 400);
  sql.prepare('UPDATE sessions SET expires = 0 WHERE id = ?').run(session.id);
  assert.equal((await call('/api/score', { session: session.id, name: 'Speler', actions: [] })).status, 400);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM scores').get().n, 0);
});

test('one leaderboard always uses current rules and preserves older scores outside the board',async t=>{
  const {sql,call}=setup(t);
  sql.prepare('INSERT INTO scores(id,session_id,name,score,services,date,version) VALUES(?,?,?,?,?,?,?)').run('old','old-session','Eerdere speler',9700,3,'2026-10-01','cascade-1');
  assert.equal((await (await call('/api/leaderboard')).json()).scores.length,0);
  assert.deepEqual((await (await call('/api/leaderboard?version=cascade-1')).json()).scores,[]);
  sql.prepare('INSERT INTO scores(id,session_id,name,score,services,date,version) VALUES(?,?,?,?,?,?,?)').run('current','current-session','Huidige speler',250,2,'2026-10-01','cascade-2');
  const current=(await (await call('/api/leaderboard')).json()).scores;
  assert.equal(current.length,1);assert.equal(current[0].score,250);
  assert.deepEqual((await (await call('/api/leaderboard?version=cascade-1')).json()).scores,current);
  assert.deepEqual((await (await call('/api/leaderboard?version=unknown')).json()).scores,current);
  const session=await (await call('/api/session',{})).json();assert.equal(session.version,'cascade-2');
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM scores WHERE version = ?').get('cascade-1').n,1);
});
