import { replay, SEED, VERSION, FPS } from '../src/engine.js';
import { storage } from './storage.js';
const json = (status, body) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
class InputError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
async function readBody(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new InputError('Gebruik JSON voor de spelgegevens.', 415);
  if (Number(request.headers.get('content-length')) > 160000) throw new InputError('Te veel gegevens.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw new InputError('Ongeldige invoer.');
  const decoder = new TextDecoder(); let text = '', size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 160000) { await reader.cancel(); throw new InputError('Te veel gegevens.', 413); }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  let data; try { data = JSON.parse(text); } catch { throw new InputError('Ongeldige invoer.'); }
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new InputError('Ongeldige invoer.');
  return data;
}
export async function handleApi(request, env) {
  try {
    const url = new URL(request.url), method = request.method;
    if (method === 'POST') {
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) return json(403, { error: 'Open de game op deze website.' });
      if (request.headers.get('sec-fetch-site') === 'cross-site') return json(403, { error: 'Open de game op deze website.' });
    }
    if (url.pathname === '/api/meta' && method === 'GET') {
      return json(200, { version: VERSION, hosting: 'sites', mobileUrls: [url.origin + '/'] });
    }
    if (url.pathname === '/api/leaderboard' && method === 'GET') return json(200, { scores: await storage(env).top(url.searchParams.get('version') === 'cascade-1' ? 'cascade-1' : VERSION) });
    if (url.pathname === '/api/session' && method === 'POST') {
      const db = storage(env), now = Date.now(), id = crypto.randomUUID();
      const created = await db.createSession({ id, seed: SEED, version: VERSION, started: now, expires: now + 30 * 60 * 1000 });
      return created ? json(201, { id, seed: SEED, version: VERSION }) : json(429, { error: 'Even geduld; er zijn veel rondes actief.' });
    }
    if (url.pathname === '/api/score' && method === 'POST') {
      const input = await readBody(request);
      if (typeof input.session !== 'string' || input.session.length > 64) throw new InputError('Deze ronde is verlopen. Speel opnieuw.');
      const db = storage(env), session = await db.session(input.session), now = Date.now();
      if (!session || session.expires < now || session.version !== VERSION) throw new InputError('Deze ronde is verlopen. Speel opnieuw.');
      // Retrying after a lost response returns the original result instead of adding a score.
      const existing = await db.saved(input.session);
      if (existing) return json(200, await db.result(existing));
      const name = typeof input.name === 'string' ? input.name.normalize('NFKC').trim().replace(/\s+/g, ' ') : '';
      if (!/^[\p{L}\p{N} ._-]{1,18}$/u.test(name)) throw new InputError('Gebruik 1–18 letters, cijfers, spaties of . _ -');
      let game; try { game = replay(input.actions, session.seed); } catch (error) { throw new InputError(error.message); }
      if (now - session.started < game.tick / FPS * 1000 - 1500) throw new InputError('De ronde is nog niet afgelopen.');
      const entry = await db.save({ id: crypto.randomUUID(), name, score: game.score, services: game.services, date: new Date(now).toISOString(), version: VERSION }, input.session, now);
      if (!entry) throw new InputError('Deze ronde is verlopen. Speel opnieuw.');
      return json(201, await db.result(entry));
    }
    return json(['/api/meta', '/api/leaderboard', '/api/session', '/api/score'].includes(url.pathname) ? 405 : 404, { error: 'Niet beschikbaar.' });
  } catch (error) {
    if (error instanceof InputError) return json(error.status, { error: error.message });
    console.error('Cascade opslag niet beschikbaar:', error.message);
    return json(503, { error: 'Het leaderboard is even niet bereikbaar. Je invoer blijft staan; probeer het opnieuw.' });
  }
}
