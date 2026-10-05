import { VERSION } from '../src/engine.js';
export const PAGE_SIZE = 50;
const json = (status, body) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
class InputError extends Error {}
export function hostedAdmin(request, env) {
  const id = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  // Sites dispatch supplies these authenticated headers. Local requests never use them.
  if (!id || !email) return { status: 401, error: 'Log in met je beheerdersaccount.', login: '/signin-with-chatgpt?return_to=%2Fadmin' };
  const allowed = (env.CASCADE_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(email)) return { status: 403, error: 'Dit account heeft geen toegang tot leaderboardbeheer.' };
  return { email, hosting: 'sites' };
}
export function localAdmin(req, url) {
  const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
  const hostname = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  return loopback && hostname ? { email: 'Deze Mac', hosting: 'local' } : { status: 403, error: 'Open lokaal beheer op de Mac via localhost.' };
}
function fields(input) {
  const name = typeof input?.name === 'string' ? input.name.normalize('NFKC').trim().replace(/\s+/g, ' ') : '';
  if (!/^[\p{L}\p{N} ._-]{1,18}$/u.test(name)) throw new InputError('Gebruik een naam van 1–18 letters, cijfers, spaties of . _ -');
  if (!Number.isSafeInteger(input.score) || input.score < 0 || input.score > 9999999) throw new InputError('Gebruik een score van 0 tot en met 9.999.999.');
  if (!Number.isInteger(input.services) || input.services < 0 || input.services > 3) throw new InputError('Kies 0, 1, 2 of 3 operationele diensten.');
  return { name, score: input.score, services: input.services };
}
async function readInput(request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new InputError('Ongeldige invoer.');
  const reader = request.body?.getReader();
  if (!reader) throw new InputError('Geen invoer ontvangen.');
  let size = 0, text = ''; const decoder = new TextDecoder();
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new InputError('Te veel gegevens.'); }
    text += decoder.decode(value, { stream: true });
  }
  let input; try { input = JSON.parse(text + decoder.decode()); } catch { throw new InputError('Ongeldige invoer.'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('Ongeldige invoer.');
  return input;
}
export async function handleAdmin(request, getStore, auth) {
  try {
    if (auth.status) return json(auth.status, auth);
    const url = new URL(request.url), method = request.method;
    const origin = request.headers.get('origin');
    if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') return json(403, { error: 'Open beheer op deze website.' });
    if (!['GET', 'POST'].includes(method)) return json(405, { error: 'Niet beschikbaar.' });
    if (method === 'POST' && origin !== url.origin) return json(403, { error: 'Open beheer op deze website.' });
    if (url.pathname === '/api/admin/me' && method === 'GET') return json(200, auth);
    const db = getStore();
    if (url.pathname === '/api/admin/stats' && method === 'GET') {
      const days = Number(url.searchParams.get('days') ?? 7), page = Number(url.searchParams.get('page') || 1);
      if (![0, 1, 7, 30, 90].includes(days) || !Number.isSafeInteger(page) || page < 1 || page > 100000) throw new InputError('Ongeldige periode.');
      return json(200, await db.stats(days, page));
    }
    if (url.pathname === '/api/admin/leaderboard' && method === 'GET') {
      const version = url.searchParams.get('version') || VERSION;
      const page = Number(url.searchParams.get('page') || 1), search = (url.searchParams.get('q') || '').trim();
      if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || search.length > 100 || version.length > 100) throw new InputError('Ongeldige selectie.');
      const result = await db.list(version, search, page);
      return json(200, { ...result, versions: await db.versions(), currentVersion: VERSION, version, page, pageSize: PAGE_SIZE });
    }
    if (url.pathname === '/api/admin/export' && method === 'GET') {
      const version = url.searchParams.get('version') || VERSION;
      if (version.length > 100) throw new InputError('Ongeldige selectie.');
      return json(200, { exportedAt: new Date().toISOString(), version, scores: await db.export(version) });
    }
    if (method === 'POST' && ['/api/admin/update', '/api/admin/delete', '/api/admin/reset'].includes(url.pathname)) {
      const input = await readInput(request);
      if (typeof input.version !== 'string' || !input.version || input.version.length > 100) throw new InputError('Kies een klassement.');
      if (url.pathname === '/api/admin/reset') {
        if (input.confirmation !== 'RESET') throw new InputError('Typ RESET om dit klassement leeg te maken.');
        const removed = await db.reset(input.version);
        return json(200, { removed });
      }
      if (typeof input.id !== 'string' || !input.id || input.id.length > 100) throw new InputError('Kies een score.');
      const expected = fields(input.expected);
      const changed = url.pathname === '/api/admin/update'
        ? await db.update(input.id, input.version, fields(input), expected)
        : await db.remove(input.id, input.version, expected);
      return changed ? json(200, { saved: true }) : json(409, { error: 'Deze score is intussen gewijzigd of verwijderd. Vernieuw de lijst en probeer opnieuw.' });
    }
    return json(404, { error: 'Niet beschikbaar.' });
  } catch (error) {
    if (error instanceof InputError) return json(400, { error: error.message });
    console.error('Leaderboardbeheer niet beschikbaar:', error.message);
    return json(503, { error: 'Opslaan of laden lukte niet. Je invoer blijft staan. Probeer het opnieuw.' });
  }
}
