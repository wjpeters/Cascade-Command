import { StorageError, UUID, validDay } from './http.js';
import { VERSION } from '../src/engine.js';

const malformed = () => { throw new StorageError('Ongeldig antwoord van de opslagserver.', 502); };
const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const version = value => typeof value === 'string' && value.length > 0 && value.length <= 100;
const cleanScores = scores => {
  if (!Array.isArray(scores) || scores.length > 10) malformed();
  return scores.map(s => {
    if (!s || typeof s.id !== 'string' || !UUID.test(s.id) || typeof s.name !== 'string' || s.name.length > 120 || !integer(s.score, 0, 9999999) || !integer(s.services, 0, 3) || typeof s.date !== 'string' || !Number.isFinite(Date.parse(s.date))) malformed();
    return { id: s.id, name: s.name, score: s.score, services: s.services, date: s.date };
  });
};
function sessionData(s, expectedId) {
  if (!s || !UUID.test(s.id) || s.id !== expectedId || !integer(s.seed, 0, 0xffffffff) || !version(s.version) || !validDay(s.day) || !Number.isSafeInteger(s.started) || !Number.isSafeInteger(s.expires) || s.expires <= s.started || typeof s.consumed !== 'boolean') malformed();
  return { id: s.id, seed: s.seed, version: s.version, day: s.day, started: s.started, expires: s.expires, consumed: s.consumed };
}
function errorDetails(data, token) {
  const fields = {}, messages = [];
  const clean = text => String(text).split(token).join('[afgeschermd]').replace(/<[^>]*>/g, '').slice(0, 250);
  function walk(value, key = '') {
    if (Array.isArray(value)) { for (const entry of value.slice(0, 5)) walk(entry, key); }
    else if (typeof value === 'string') { const text = clean(value); if (key && !['detail', 'non_field_errors'].includes(key)) fields[key] = text; messages.push(text); }
    else if (value && typeof value === 'object') for (const [name, entry] of Object.entries(value)) {
      if (!['detail', 'non_field_errors', 'name', 'version', 'score', 'services', 'duration', 'contact', 'full_name', 'email', 'phone', 'id', 'day'].includes(name)) continue;
      walk(entry, key ? key + '.' + name : name);
    }
  }
  walk(data); return { fields: Object.keys(fields).length ? fields : undefined, message: messages.join(' ').slice(0, 500) };
}

export function djangoStorage(config, { fetcher = fetch, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), random = Math.random, timeoutMs = 5000 } = {}) {
  async function call(route, method = 'GET', body, expires = Infinity) {
    const serialized = body === undefined ? undefined : JSON.stringify(body);
    if (serialized && new TextEncoder().encode(serialized).length > 16384) throw new StorageError('Te veel gegevens voor de opslagserver.', 413);
    for (let attempt = 0; attempt < 3; attempt++) {
      if (now() >= expires) throw new StorageError('Deze ronde is verlopen. Speel opnieuw.');
      let response, data;
      try {
        response = await fetcher(new URL(route, config.baseUrl), { method, redirect: 'error', headers: { Authorization: 'Bearer ' + config.token, Accept: 'application/json', ...(serialized === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: serialized, signal: AbortSignal.timeout(timeoutMs) });
        // Apply a bound while streaming, including error responses from proxies.
        const reader = response.body?.getReader(), decoder = new TextDecoder(); let text = '', size = 0;
        if (reader) while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 65536) { await reader.cancel(); malformed(); } text += decoder.decode(part.value, { stream: true }); }
        text += decoder.decode(); try { data = JSON.parse(text); } catch { data = undefined; }
      } catch (error) {
        if (error instanceof StorageError) throw error;
        if (attempt === 2) throw new StorageError('De opslag is even niet bereikbaar. Probeer opnieuw met dezelfde ronde.', 503);
        await sleep((attempt ? 750 : 250) + random() * 250); continue;
      }
      const retryAfter = response.headers.get('retry-after');
      if (response.status === 503 && attempt < 2) {
        const wait = retryAfter ? (/^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - now()) : (attempt ? 750 : 250) + random() * 250;
        if (Number.isFinite(wait) && wait >= 0 && wait <= 5000 && now() + wait < expires) { await sleep(wait); continue; }
      }
      if (!response.ok) {
        const details = errorDetails(data, config.token);
        const fallback = response.status === 403 ? 'De opslagserver weigert toegang. Controleer de server-token en netwerktoegang.' : response.status === 429 ? 'Even geduld; de opslagserver is druk.' : response.status === 404 ? 'Game of ronde niet gevonden op de opslagserver.' : 'Opslaan lukte niet. Probeer opnieuw met dezelfde ronde.';
        throw new StorageError(details.message || fallback, response.status, details.fields, retryAfter || undefined);
      }
      if (!data || typeof data !== 'object') malformed();
      return { status: response.status, body: data };
    }
  }
  const metadataKeys = ['ip', 'ip_source', 'country', 'browser', 'os', 'device', 'language', 'referrer', 'viewport'];
  const payloadMetadata = input => Object.fromEntries(metadataKeys.map(key => [key, input[key]]));
  const recorded = result => { if (result.body.recorded !== true) malformed(); return { status: result.status, body: { recorded: true } }; };
  return {
    backend: 'django',
    adminUrl: new URL('/django-admin/games/game/', config.baseUrl).href,
    async meta() {
      const { body: m } = await call('meta/');
      if (m.game !== 'cascade-command' || !version(m.version) || m.timezone !== 'Europe/Amsterdam' || !m.contact_requirements || !['full_name', 'email', 'phone'].every(k => ['disabled', 'optional', 'required'].includes(m.contact_requirements[k])) || !integer(m.contact_requirements.retention_days, 1, 36500)) malformed();
      if (m.version !== VERSION) throw new StorageError('De spelregels van game en opslagserver verschillen. Laat de configuratie controleren.', 409, undefined, undefined, 'VERSION_MISMATCH');
      return { version: m.version, timezone: m.timezone, contact_requirements: { ...Object.fromEntries(['full_name', 'email', 'phone', 'retention_days'].map(k => [k, m.contact_requirements[k]])) }, storageBackend: 'django', capabilities: { dailyLeaderboard: true, consolationDraw: false, leaderboardAdmin: false } };
    },
    async visit(id, metadata) { return recorded(await call('visits/', 'POST', { id, version: VERSION, metadata: payloadMetadata(metadata) })); },
    async createSession(id, metadata) {
      await this.meta();
      const result = await call('sessions/', 'POST', { id, version: VERSION, metadata: payloadMetadata(metadata) });
      const s = sessionData(result.body, id);
      if (s.version !== VERSION || s.expires <= now() || s.consumed) throw new StorageError('Deze ronde is verlopen. Start een nieuwe ronde.');
      return { status: result.status, body: s };
    },
    async session(id) { return sessionData((await call('sessions/' + encodeURIComponent(id) + '/')).body, id); },
    async finish(id, result, expires) { return recorded(await call('sessions/' + encodeURIComponent(id) + '/finish/', 'POST', result, expires)); },
    async score(id, payload, expires) {
      const result = await call('sessions/' + encodeURIComponent(id) + '/score/', 'POST', payload, expires), b = result.body;
      if (typeof b.id !== 'string' || !UUID.test(b.id) || !integer(b.rank, 1, Number.MAX_SAFE_INTEGER) || !integer(b.score, 0, 9999999) || !validDay(b.day) || b.version !== VERSION) malformed();
      return { status: result.status, body: { id: b.id, rank: b.rank, score: b.score, day: b.day, version: b.version, scores: cleanScores(b.scores) } };
    },
    async leaderboard(params) {
      const query = new URLSearchParams();
      for (const key of ['day', 'version']) if (params.has(key)) query.set(key, params.get(key));
      const { body: b } = await call('leaderboard/' + (query.size ? '?' + query : ''));
      if (!validDay(b.day) || !version(b.version)) malformed();
      return { day: b.day, version: b.version, scores: cleanScores(b.scores), consolation: { enabled: false }, capabilities: { dailyLeaderboard: true, consolationDraw: false } };
    },
  };
}
