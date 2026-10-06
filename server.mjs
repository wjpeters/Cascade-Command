import { localPrizeStorage } from './prizes/local-storage.js';
import { localAnalytics } from './analytics/local-storage.js';
import { metadata, eventRecord, safely } from './analytics/common.js';
import { handleAdmin, localAdmin } from './admin/api.js';
import { localAdminStorage, compareScores } from './admin/local-storage.js';
import http from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import { replay, SEED, VERSION, FPS, GAME_CONFIG } from './src/engine.js';
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4317), host = process.env.HOST || '0.0.0.0';
const dataDir = process.env.CASCADE_DATA_DIR || path.join(root, 'data');
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const boardPath = path.join(dataDir, 'leaderboard.json');
let scores = [];
if (existsSync(boardPath)) { try { const data = JSON.parse(readFileSync(boardPath, 'utf8')); scores = Array.isArray(data) ? data.filter(s => typeof s.version === 'string' && typeof s.name === 'string' && Number.isFinite(s.score)) : []; } catch { console.warn('Leaderboard kon niet worden gelezen; nieuw geheugenklassement gestart.'); } }
const sessions = new Map();
const saveScores = next => {
  const temp = boardPath + '.tmp'; writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 }); renameSync(temp, boardPath); scores = next;
};
const analytics = localAnalytics(path.join(dataDir, 'analytics.json'));
const prizes = localPrizeStorage(path.join(dataDir, 'prize-draws.json'), () => scores, VERSION);
const adminStore = { ...prizes, ...localAdminStorage(() => scores, saveScores, sessions, VERSION), stats: (...args) => analytics.stats(...args) };
const requestMetadata = (req, url, input) => metadata(new Request(url, { headers: req.headers }), input?.analytics || {}, req.socket.remoteAddress);
const addresses = () => [...new Set(Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(i.address)).map(i => `http://${i.address}:${server.address()?.port ?? port}`))];
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
const body = req => new Promise((resolve, reject) => {
  let text = ''; req.on('data', chunk => { text += chunk; if (text.length > 160000) { reject(new Error('Te veel gegevens.')); req.destroy(); } });
  req.on('end', () => { try { resolve(JSON.parse(text || '{}')); } catch { reject(new Error('Ongeldige invoer.')); } }); req.on('error', reject);
});
const topScores = () => scores.filter(s => s.version === VERSION).sort(compareScores).slice(0, 10).map(({ name, score, services, date, id }) => ({ name, score, services, date, id }));
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/admin/')) {
      const request = new Request(url, { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: req, duplex: 'half' } : {}) });
      const response = await handleAdmin(request, () => adminStore, localAdmin(req, url));
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
    }
    if (req.method === 'POST' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return json(res, 403, { error: 'Open de game op deze server.' });
    if (url.pathname === '/api/meta' && req.method === 'GET') return json(res, 200, { version: VERSION, mobileUrls: addresses(), port: server.address().port, leaderboardAdmin: true, leaderboardDisplay: true });
    if (url.pathname === '/api/leaderboard' && req.method === 'GET') return json(res, 200, { scores: topScores(), consolation: prizes.publicDraw() });
    if (url.pathname === '/api/visit' && req.method === 'POST') {
      if (req.headers.origin !== url.origin) return json(res, 403, { error: 'Open de game op deze server.' });
      const input = await body(req);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input?.id || '')) return json(res, 400, { error: 'Ongeldig bezoek.' });
      analytics.record(eventRecord('visit:' + input.id, 'visit', Date.now(), VERSION, requestMetadata(req, url, input)));
      return json(res, 201, { recorded: true });
    }
    if (url.pathname === '/api/session' && req.method === 'POST') {
      const input = await body(req);
      for (const [key, s] of sessions) if (Date.now() - s.started > 30 * 60 * 1000) sessions.delete(key);
      if (sessions.size >= 500) return json(res, 429, { error: 'Even geduld; er zijn veel rondes actief.' });
      const id = randomUUID(), started = Date.now(); sessions.set(id, { started, seed: SEED });
      await safely(() => analytics.record(eventRecord('round:' + id, 'round', started, VERSION, requestMetadata(req, url, input))));
      return json(res, 201, { id, seed: SEED, version: VERSION });
    }
    if (url.pathname === '/api/finish' && req.method === 'POST') {
      const input = await body(req), session = sessions.get(input?.session);
      if (!session || Date.now() - session.started > 30 * 60 * 1000) return json(res, 400, { error: 'Deze ronde is verlopen.' });
      let game; try { game = replay(input.actions, session.seed); } catch (e) { return json(res, 400, { error: e.message }); }
      if (Date.now() - session.started < game.tick / FPS * 1000 - 1500) return json(res, 400, { error: 'De ronde is nog niet afgelopen.' });
      analytics.complete('round:' + input.session, game);
      return json(res, 200, { recorded: true });
    }
    if (url.pathname === '/api/score' && req.method === 'POST') {
      const input = await body(req), session = sessions.get(input.session);
      if (!session || Date.now() - session.started > 30 * 60 * 1000) return json(res, 400, { error: 'Deze ronde is verlopen. Speel opnieuw.' });
      const name = typeof input.name === 'string' ? input.name.normalize('NFKC').trim().replace(/\s+/g, ' ') : '';
      if (!/^[\p{L}\p{N} ._-]{1,18}$/u.test(name)) return json(res, 400, { error: 'Gebruik 1–18 letters, cijfers, spaties of . _ -' });
      let game; try { game = replay(input.actions, session.seed); } catch (e) { return json(res, 400, { error: e.message }); }
      if (Date.now() - session.started < game.tick / FPS * 1000 - 1500) return json(res, 400, { error: 'De ronde is nog niet afgelopen.' });
      const entry = { id: randomUUID(), name, score: game.score, services: game.services, date: new Date().toISOString(), version: VERSION };
      const previousEditions = scores.filter(s => s.version !== VERSION);
      const updated = [...scores.filter(s => s.version === VERSION), entry].sort(compareScores);
      const rank = updated.findIndex(s => s.id === entry.id) + 1;
      const temp = boardPath + '.tmp'; writeFileSync(temp, JSON.stringify([...previousEditions, ...updated], null, 2), { mode: 0o600 }); renameSync(temp, boardPath);
      scores = [...previousEditions, ...updated]; sessions.delete(input.session);
      await safely(() => analytics.complete('round:' + input.session, game, true));
      return json(res, 201, { rank, score: entry.score, id: entry.id, scores: topScores() });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Niet beschikbaar.' });
    let requested = decodeURIComponent(url.pathname);
    if (requested === '/') requested = '/index.html';
    if (['/admin', '/admin/'].includes(requested)) requested = '/admin.html';
    if (['/leaderboard', '/leaderboard/'].includes(requested)) requested = '/leaderboard.html';
    const plugin = requested.startsWith('/plugins/easter-eggs/');
    if (plugin && GAME_CONFIG.easterEggs !== true) return json(res, 404, { error: 'Niet gevonden.' });
    const base = plugin ? path.join(root, 'plugins/easter-eggs') : requested.startsWith('/src/') ? root : path.join(root, 'public');
    const file = path.resolve(base, '.' + (plugin ? requested.slice('/plugins/easter-eggs'.length) : requested));
    if (!file.startsWith(base + path.sep) || (!requested.startsWith('/src/') && requested.includes('/.'))) return json(res, 403, { error: 'Niet beschikbaar.' });
    const ext = path.extname(file), types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
    if (!types[ext]) return json(res, 404, { error: 'Niet gevonden.' });
    let bytes; try { bytes = readFileSync(file); } catch { return json(res, 404, { error: 'Niet gevonden.' }); }
    res.writeHead(200, { 'Content-Type': types[ext], 'Cache-Control': /\.[a-f0-9]{12}\.webp$/.test(requested) ? 'public, max-age=31536000, immutable' : ext === '.png' ? 'public, max-age=86400' : 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'" });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch (e) { if (!res.headersSent) json(res, 500, { error: 'Opslaan lukte niet. Probeer het opnieuw.' }); }
});
server.listen(port, host, () => { console.log(`Cascade Command: http://localhost:${server.address().port}`); for (const url of addresses()) console.log(`Mobiel op hetzelfde netwerk: ${url}`); });
