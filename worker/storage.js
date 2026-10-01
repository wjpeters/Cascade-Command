import { VERSION } from '../src/engine.js';
// Schema changes live in generated Drizzle migrations, never in request handlers.
export function storage(env) {
  const db = env.DB;
  if (!db) throw new Error('Leaderboard database unavailable');
  const statement = (sql, ...args) => db.prepare(sql).bind(...args);
  const top = async () => (await statement(
    'SELECT id, name, score, services, date FROM scores WHERE version = ? ORDER BY score DESC, services DESC, date ASC, id ASC LIMIT 10', VERSION
  ).all()).results;
  return {
    top,
    async createSession(session) {
      const results = await db.batch([
        statement('DELETE FROM sessions WHERE expires < ?', session.started),
        statement('INSERT INTO sessions (id, seed, version, started, expires) SELECT ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM sessions WHERE consumed = 0) < 500',
          session.id, session.seed, session.version, session.started, session.expires),
      ]);
      return results[1].meta.changes === 1;
    },
    session(id) { return statement('SELECT * FROM sessions WHERE id = ?', id).first(); },
    saved(sessionId) { return statement('SELECT * FROM scores WHERE session_id = ?', sessionId).first(); },
    async save(entry, sessionId, now) {
      // A unique session constraint plus an atomic batch prevents duplicate submissions,
      // including two requests that were replay-validated concurrently.
      await db.batch([
        statement(`INSERT INTO scores (id, session_id, name, score, services, date, version)
          SELECT ?, id, ?, ?, ?, ?, ? FROM sessions
          WHERE id = ? AND consumed = 0 AND expires >= ?
          ON CONFLICT(session_id) DO NOTHING`,
          entry.id, entry.name, entry.score, entry.services, entry.date, entry.version, sessionId, now),
        statement('UPDATE sessions SET consumed = 1 WHERE id = ? AND EXISTS (SELECT 1 FROM scores WHERE session_id = ?)', sessionId, sessionId),
      ]);
      return this.saved(sessionId);
    },
    async result(entry) {
      const position = await statement(`SELECT COUNT(*) + 1 AS rank FROM scores WHERE version = ? AND
        (score > ? OR (score = ? AND services > ?) OR
        (score = ? AND services = ? AND date < ?) OR
        (score = ? AND services = ? AND date = ? AND id < ?))`,
        entry.version, entry.score, entry.score, entry.services,
        entry.score, entry.services, entry.date, entry.score, entry.services, entry.date, entry.id).first();
      return { rank: position.rank, score: entry.score, id: entry.id, scores: await top() };
    },
  };
}
