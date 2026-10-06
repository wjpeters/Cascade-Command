import { analyticsStorage } from './analytics-storage.js';
import { prizeStorage } from './prize-storage.js';
import { PAGE_SIZE } from '../admin/api.js';
export function adminStorage(env) {
  if (!env.DB) throw new Error('Leaderboard database unavailable');
  const db = env.DB, statement = (sql, ...args) => db.prepare(sql).bind(...args);
  const columns = 'id, name, score, services, date, version';
  const order = 'ORDER BY score DESC, services DESC, date ASC, id ASC';
  const expectedWhere = 'id = ? AND version = ? AND name = ? AND score = ? AND services = ?';
  const expectedArgs = (id, version, old) => [id, version, old.name, old.score, old.services];
  return {
    ...prizeStorage(env),
    stats(days, page) { return analyticsStorage(env).stats(days, page); },
    async versions() { return (await statement('SELECT version, COUNT(*) AS count FROM scores GROUP BY version ORDER BY MAX(date) DESC').all()).results; },
    async list(version, search, page) {
      const filter = 'version = ? AND instr(lower(name), lower(?)) > 0';
      const count = await statement(`SELECT COUNT(*) AS total FROM scores WHERE ${filter}`, version, search).first();
      const rows = await statement(`SELECT ${columns} FROM scores WHERE ${filter} ${order} LIMIT ? OFFSET ?`, version, search, PAGE_SIZE, (page - 1) * PAGE_SIZE).all();
      return { scores: rows.results, total: count.total };
    },
    async export(version) { return (await statement(`SELECT ${columns} FROM scores WHERE version = ? ${order}`, version).all()).results; },
    async update(id, version, entry, old) {
      const result = await statement(`UPDATE scores SET name = ?, score = ?, services = ? WHERE ${expectedWhere}`,
        entry.name, entry.score, entry.services, ...expectedArgs(id, version, old)).run();
      return result.meta.changes === 1;
    },
    async remove(id, version, old) {
      // Consumed sessions remain consumed, so a retry cannot recreate a deleted score.
      const result = await statement(`DELETE FROM scores WHERE ${expectedWhere}`, ...expectedArgs(id, version, old)).run();
      return result.meta.changes === 1;
    },
    async reset(version) {
      // End active rounds too, so pre-reset sessions cannot refill a freshly reset board.
      const result = await db.batch([
        statement('DELETE FROM sessions WHERE version = ?', version),
        statement('DELETE FROM scores WHERE version = ?', version),
      ]);
      return result[1].meta.changes;
    },
  };
}
