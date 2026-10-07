import { metadata } from '../analytics/common.js';
import { replay, VERSION, FPS } from '../src/engine.js';
import { StorageError, UUID, json, readBody, errorResponse } from './http.js';

export async function handleGameApi(request, store, hosting = {}, { remoteAddress, now = Date.now } = {}) {
  try {
    const url = new URL(request.url), method = request.method;
    if (method === 'POST') {
      const origin = request.headers.get('origin');
      if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new StorageError('Open de game op deze website.', 403);
    }
    if (url.pathname.startsWith('/api/admin/')) return json(410, { error: 'Scores, contacten en statistieken worden beheerd via Django admin.', code: 'DJANGO_ADMIN', adminUrl: store.adminUrl });
    if (url.pathname === '/api/meta' && method === 'GET') return json(200, { ...hosting, ...await store.meta(), leaderboardAdmin: store.backend === 'legacy', leaderboardDisplay: true });
    if (url.pathname === '/api/leaderboard' && method === 'GET') return json(200, await store.leaderboard(url.searchParams));
    const routes = ['/api/visit', '/api/session-id', '/api/session', '/api/finish', '/api/score'];
    if (routes.includes(url.pathname) && method === 'POST') {
      const input = await readBody(request);
      if (url.pathname === '/api/session-id') return json(200, { id: crypto.randomUUID() });
      if (url.pathname === '/api/visit') {
        if (request.headers.get('origin') !== url.origin) throw new StorageError('Open de game op deze website.', 403);
        if (!UUID.test(input.id || '')) throw new StorageError('Ongeldig bezoek.');
        const result = await store.visit(input.id, metadata(request, input.analytics || {}, remoteAddress));
        return json(result.status, result.body);
      }
      if (url.pathname === '/api/session') {
        const id = store.backend !== 'django' || input.id === undefined ? crypto.randomUUID() : input.id;
        if (typeof id !== 'string' || !UUID.test(id)) throw new StorageError('Ongeldige ronde.');
        const result = await store.createSession(id, metadata(request, input.analytics || {}, remoteAddress));
        return json(result.status, result.body);
      }
      if (typeof input.session !== 'string' || !UUID.test(input.session)) throw new StorageError('Ongeldige ronde.');
      const session = await store.session(input.session), time = now();
      if (!session || session.expires <= time || session.version !== VERSION) throw new StorageError('Deze ronde is verlopen. Speel opnieuw.');
      let game;
      try { game = replay(input.actions, session.seed); } catch (error) { throw new StorageError(error.message); }
      const verified = { version: VERSION, score: game.score, services: game.services, duration: game.tick / FPS };
      if (time - session.started < verified.duration * 1000 - 1500) throw new StorageError('De ronde is nog niet afgelopen.');
      if (url.pathname === '/api/finish') {
        const result = await store.finish(input.session, verified, session.expires);
        return json(result.status, result.body);
      }
      const name = typeof input.name === 'string' ? input.name.normalize('NFKC').trim().replace(/\s+/g, ' ') : '';
      if (!/^[\p{L}\p{N} ._-]{1,18}$/u.test(name)) throw new StorageError('Gebruik 1–18 letters, cijfers, spaties of . _ -', 400, { name: 'Gebruik 1–18 letters, cijfers, spaties of . _ -' });
      const payload = { name, ...verified };
      if (store.backend === 'django' && input.contact !== undefined) {
        if (!input.contact || typeof input.contact !== 'object' || Array.isArray(input.contact)) throw new StorageError('Controleer je contactgegevens.');
        payload.contact = {};
        for (const key of ['full_name', 'email', 'phone']) if (input.contact[key] !== undefined) {
          if (typeof input.contact[key] !== 'string') throw new StorageError('Controleer je contactgegevens.', 400, { ['contact.' + key]: 'Vul tekst in of laat dit veld leeg.' });
          payload.contact[key] = input.contact[key];
        }
      }
      const result = await store.score(input.session, payload, session.expires);
      return json(result.status, result.body);
    }
    return json([...routes, '/api/meta', '/api/leaderboard'].includes(url.pathname) ? 405 : 404, { error: 'Niet beschikbaar.' });
  } catch (error) { return errorResponse(error); }
}
