import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { localPrizeStorage } from '../prizes/local-storage.js';
import { localAnalytics } from '../analytics/local-storage.js';
import { eventRecord, safely } from '../analytics/common.js';
import { localAdminStorage, compareScores } from '../admin/local-storage.js';
import { VERSION, SEED } from '../src/engine.js';
import { legacyMeta } from './legacy-hosted.js';
import { StorageError } from './http.js';

export function localLegacyStorage(dataDir) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const boardPath = path.join(dataDir, 'leaderboard.json');
  let scores = [];
  if (existsSync(boardPath)) try { const data = JSON.parse(readFileSync(boardPath, 'utf8')); scores = Array.isArray(data) ? data.filter(s => typeof s.version === 'string' && typeof s.name === 'string' && Number.isFinite(s.score)) : []; } catch { console.warn('Leaderboard kon niet worden gelezen; nieuw geheugenklassement gestart.'); }
  const sessions = new Map();
  const saveScores = next => { const temp = boardPath + '.tmp'; writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 }); renameSync(temp, boardPath); scores = next; };
  const analytics = localAnalytics(path.join(dataDir, 'analytics.json'));
  const prizes = localPrizeStorage(path.join(dataDir, 'prize-draws.json'), () => scores, VERSION);
  const top = () => scores.filter(s => s.version === VERSION).sort(compareScores).slice(0, 10).map(({ name, score, services, date, id }) => ({ name, score, services, date, id }));
  return {
    backend: 'legacy', meta: legacyMeta,
    adminStore: { ...prizes, ...localAdminStorage(() => scores, saveScores, sessions, VERSION), stats: (...args) => analytics.stats(...args) },
    visit(id, metadata) { analytics.record(eventRecord('visit:' + id, 'visit', Date.now(), VERSION, metadata)); return { status: 201, body: { recorded: true } }; },
    async createSession(id, metadata) {
      const started = Date.now();
      for (const [key, s] of sessions) if (s.expires <= started) sessions.delete(key);
      if (sessions.size >= 500) throw new StorageError('Even geduld; er zijn veel rondes actief.', 429);
      sessions.set(id, { started, expires: started + 1800000, seed: SEED, version: VERSION });
      await safely(() => analytics.record(eventRecord('round:' + id, 'round', started, VERSION, metadata)));
      return { status: 201, body: { id, seed: SEED, version: VERSION } };
    },
    session(id) { return sessions.get(id); },
    finish(id, result) { analytics.complete('round:' + id, { ...result, tick: result.duration * 60 }); return { status: 200, body: { recorded: true } }; },
    async score(id, payload) {
      const entry = { id: crypto.randomUUID(), name: payload.name, score: payload.score, services: payload.services, date: new Date().toISOString(), version: VERSION };
      const updated = [...scores.filter(s => s.version === VERSION), entry].sort(compareScores);
      saveScores([...scores.filter(s => s.version !== VERSION), ...updated]); sessions.delete(id);
      await safely(() => analytics.complete('round:' + id, { ...payload, tick: payload.duration * 60 }, true));
      return { status: 201, body: { rank: updated.findIndex(s => s.id === entry.id) + 1, score: entry.score, id: entry.id, scores: top() } };
    },
    leaderboard() { return { scores: top(), consolation: prizes.publicDraw() }; },
  };
}
