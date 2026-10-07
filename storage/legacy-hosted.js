import { storage } from '../worker/storage.js';
import { analyticsStorage } from '../worker/analytics-storage.js';
import { prizeStorage } from '../worker/prize-storage.js';
import { eventRecord, safely } from '../analytics/common.js';
import { VERSION, SEED } from '../src/engine.js';
import { StorageError } from './http.js';
export const legacyMeta = () => ({ version: VERSION, timezone: 'Europe/Amsterdam', storageBackend: 'legacy', contact_requirements: { full_name: 'disabled', email: 'disabled', phone: 'disabled', retention_days: 90 }, capabilities: { dailyLeaderboard: false, consolationDraw: true, leaderboardAdmin: true } });
export function hostedLegacyStorage(env) {
  return {
    backend: 'legacy', meta: legacyMeta,
    async visit(id, metadata) { await analyticsStorage(env).record(eventRecord('visit:' + id, 'visit', Date.now(), VERSION, metadata)); return { status: 201, body: { recorded: true } }; },
    async createSession(id, metadata) {
      const now = Date.now();
      if (!await storage(env).createSession({ id, seed: SEED, version: VERSION, started: now, expires: now + 1800000 })) throw new StorageError('Even geduld; er zijn veel rondes actief.', 429);
      await safely(() => analyticsStorage(env).record(eventRecord('round:' + id, 'round', now, VERSION, metadata)));
      return { status: 201, body: { id, seed: SEED, version: VERSION } };
    },
    session(id) { return storage(env).session(id); },
    async finish(id, result) { await analyticsStorage(env).complete('round:' + id, { ...result, tick: result.duration * 60 }); return { status: 200, body: { recorded: true } }; },
    async score(id, payload) {
      const db = storage(env), existing = await db.saved(id);
      if (existing) { await safely(() => analyticsStorage(env).markSaved('round:' + id)); return { status: 200, body: await db.result(existing) }; }
      const entry = await db.save({ id: crypto.randomUUID(), name: payload.name, score: payload.score, services: payload.services, date: new Date().toISOString(), version: VERSION }, id, Date.now());
      if (!entry) throw new StorageError('Deze ronde is verlopen. Speel opnieuw.');
      await safely(() => analyticsStorage(env).complete('round:' + id, { ...payload, tick: payload.duration * 60 }, true));
      return { status: 201, body: await db.result(entry) };
    },
    async leaderboard() { return { scores: await storage(env).top(), consolation: await prizeStorage(env).publicDraw() }; },
  };
}
