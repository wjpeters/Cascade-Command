import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { GAME_CONFIG } from './src/engine.js';
import { handleAdmin, localAdmin } from './admin/api.js';
import { localStorageEnvironment } from './storage/local-env.js';
import { storageConfig } from './storage/config.js';
import { djangoStorage } from './storage/django.js';
import { handleGameApi } from './storage/game-api.js';
const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4317), host = process.env.HOST || '0.0.0.0';
const config = storageConfig(localStorageEnvironment(process.env));
// Django mode never opens or creates legacy files or session maps.
const store = config.backend === 'django' ? djangoStorage(config) : (await import('./storage/legacy-local.js')).localLegacyStorage(process.env.CASCADE_DATA_DIR || path.join(root, 'data'));
const addresses = () => [...new Set(Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal && /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(i.address)).map(i => `http://${i.address}:${server.address()?.port ?? port}`))];
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      const request = new Request(url, { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: req, duplex: 'half' } : {}) });
      const response = config.backend === 'legacy' && url.pathname.startsWith('/api/admin/')
        ? await handleAdmin(request, () => store.adminStore, localAdmin(req, url))
        : await handleGameApi(request, store, { mobileUrls: addresses(), port: server.address().port }, { remoteAddress: req.socket.remoteAddress });
      res.writeHead(response.status, Object.fromEntries(response.headers)); res.end(Buffer.from(await response.arrayBuffer())); return;
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
