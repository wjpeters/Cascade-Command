import { DAY, IP_DAYS, DETAIL_DAYS, STATS_PAGE_SIZE, sinceDay, report } from '../analytics/common.js';
export function analyticsStorage(env) {
  const db = env.DB;
  if (!db) throw new Error('Statistics database unavailable');
  const stmt = (sql, ...args) => db.prepare(sql).bind(...args);
  const rows = async (sql, ...args) => (await stmt(sql, ...args).all()).results;
  const columns = ['id', 'kind', 'started', 'day', 'version', 'ip', 'ip_source', 'country', 'browser', 'os', 'device', 'language', 'referrer', 'viewport'];
  return {
    async cleanup(now = Date.now()) {
      await db.batch([
        stmt('UPDATE analytics_events SET ip = NULL WHERE started < ? AND ip IS NOT NULL', now - IP_DAYS * DAY),
        stmt('DELETE FROM analytics_events WHERE started < ?', now - DETAIL_DAYS * DAY),
      ]);
    },
    async record(entry) {
      await this.cleanup();
      const counter = entry.kind === 'visit' ? 'visits' : 'starts';
      await db.batch([
        stmt('INSERT INTO analytics_daily (day) VALUES (?) ON CONFLICT(day) DO NOTHING', entry.day),
        stmt(`UPDATE analytics_daily SET ${counter} = ${counter} + 1 WHERE day = ? AND NOT EXISTS (SELECT 1 FROM analytics_events WHERE id = ?)`, entry.day, entry.id),
        stmt(`INSERT INTO analytics_events (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')}) ON CONFLICT(id) DO NOTHING`, ...columns.map(c => entry[c])),
      ]);
    },
    async complete(id, game, saved = false, now = Date.now()) {
      // Update counters before the event inside one atomic batch. Retries count once.
      const duration = game.tick / 60;
      const statements = [
        stmt(`UPDATE analytics_daily SET completed = completed + 1, duration_sum = duration_sum + ?, score_sum = score_sum + ?
          WHERE day = (SELECT day FROM analytics_events WHERE id = ? AND kind = 'round' AND finished IS NULL)`, duration, game.score, id),
        stmt(`UPDATE analytics_events SET finished = ?, score = ?, services = ?, duration = ? WHERE id = ? AND kind = 'round' AND finished IS NULL`, now, game.score, game.services, duration, id),
      ];
      if (saved) statements.push(...this.savedStatements(id));
      await db.batch(statements);
    },
    savedStatements(id) { return [
      stmt(`UPDATE analytics_daily SET saved = saved + 1 WHERE day = (SELECT day FROM analytics_events WHERE id = ? AND kind = 'round' AND finished IS NOT NULL AND saved = 0)`, id),
      stmt(`UPDATE analytics_events SET saved = 1 WHERE id = ? AND kind = 'round' AND finished IS NOT NULL AND saved = 0`, id),
    ]; },
    async markSaved(id) { await db.batch(this.savedStatements(id)); },
    async stats(days, page, now = Date.now()) {
      await this.cleanup(now);
      const since = sinceDay(days, now);
      const daily = await rows('SELECT * FROM analytics_daily WHERE day >= ? ORDER BY day', since);
      const first = await stmt('SELECT MIN(day) AS day FROM analytics_daily').first();
      const groups = {};
      // Only these fixed column names are used in SQL, never caller-controlled names.
      for (const key of ['device', 'browser', 'os', 'country', 'referrer']) groups[key] = await rows(`SELECT ${key} AS label, COUNT(*) AS count FROM analytics_events WHERE kind = 'visit' AND day >= ? GROUP BY ${key} ORDER BY count DESC, label ASC LIMIT 8`, since);
      const network = await stmt(`SELECT COUNT(DISTINCT ip) AS uniqueIps, COUNT(ip) AS known, COUNT(*) AS samples FROM analytics_events WHERE kind = 'visit' AND day >= ? AND started >= ?`, since, now - IP_DAYS * DAY).first();
      const ips = await rows(`SELECT ip, MAX(country) AS country, SUM(kind = 'visit') AS visits, SUM(kind = 'round') AS starts, MAX(started) AS lastSeen FROM analytics_events WHERE ip IS NOT NULL AND day >= ? AND started >= ? GROUP BY ip ORDER BY starts DESC, visits DESC, lastSeen DESC LIMIT 20`, since, now - IP_DAYS * DAY);
      const recent = await rows(`SELECT started, finished, saved, version, score, services, duration, ip, ip_source, country, browser, os, device, language, referrer, viewport FROM analytics_events WHERE kind = 'round' AND day >= ? ORDER BY started DESC, id DESC LIMIT ? OFFSET ?`, since, STATS_PAGE_SIZE, (page - 1) * STATS_PAGE_SIZE);
      const count = await stmt(`SELECT COUNT(*) AS total FROM analytics_events WHERE kind = 'round' AND day >= ?`, since).first();
      return report(daily, first.day, { groups, network, ips, recent, recentTotal: count.total, page, days }, now);
    },
  };
}
