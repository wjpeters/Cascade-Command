import { VERSION } from '../src/engine.js';
import { drawDay, drawPool, makeDraw } from '../prizes/draw.js';
const decode = row => row ? JSON.parse(row.result) : null;
export function prizeStorage(env) {
  if (!env.DB) throw new Error('Prijzendatabase niet beschikbaar');
  const stmt = (sql, ...args) => env.DB.prepare(sql).bind(...args);
  const all = async () => (await stmt('SELECT id, name, score, services, date, version FROM scores WHERE version = ? ORDER BY score DESC, services DESC, date ASC, id ASC', VERSION).all()).results;
  const today = day => stmt('SELECT result FROM prize_draws WHERE version = ? AND day = ?', VERSION, day).first();
  return {
    async publicDraw() { return { day: drawDay(), winner: decode(await stmt('SELECT result FROM prize_draws WHERE version = ? ORDER BY day DESC LIMIT 1', VERSION).first()) }; },
    async drawStatus() { return { ...await this.publicDraw(), eligibleCount: drawPool(await all()).length }; },
    async drawPrize(day) {
      const now = new Date();
      if (day !== drawDay(now)) return { winner: null, created: false };
      const existing = decode(await today(day));
      if (existing) return { winner: existing, created: false };
      const scores = await all(), winner = makeDraw(scores, VERSION, now);
      if (!winner) return { winner: null, created: false };
      // Atomic daily key prevents redraws, including simultaneous clicks and retries.
      // Recheck the podium and selected score before storing the snapshot.
      const podium = scores.slice(0, 3).map(s => s.id + ':' + s.name).join('|');
      const result = await stmt(`INSERT INTO prize_draws (version, day, result)
        SELECT ?, ?, ? WHERE
        (SELECT group_concat(id || ':' || name, '|') FROM (SELECT id, name FROM scores WHERE version = ? ORDER BY score DESC, services DESC, date ASC, id ASC LIMIT 3)) = ?
        AND EXISTS (SELECT 1 FROM scores WHERE id = ? AND version = ? AND name = ? AND score = ? AND services = ?)
        ON CONFLICT(version, day) DO NOTHING`, VERSION, winner.day, JSON.stringify(winner), VERSION, podium,
        winner.scoreId, VERSION, winner.name, winner.score, winner.services).run();
      return { winner: decode(await stmt('SELECT result FROM prize_draws WHERE version = ? AND day = ?', VERSION, winner.day).first()), created: result.meta.changes === 1 };
    },
  };
}
