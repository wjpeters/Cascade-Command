import { handleApi } from './api.js';
import assets from 'cascade:assets';
const security = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
};
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return handleApi(request, env);
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Niet beschikbaar.', { status: 405 });
    const asset = assets[url.pathname === '/' ? '/index.html' : ['/admin', '/admin/'].includes(url.pathname) ? '/admin.html' : ['/leaderboard', '/leaderboard/'].includes(url.pathname) ? '/leaderboard.html' : url.pathname];
    if (!asset) return new Response('Niet gevonden.', { status: 404, headers: security });
    const bytes = request.method === 'HEAD' ? null : Uint8Array.from(atob(asset.data), c => c.charCodeAt(0));
    const cache = /\.[a-f0-9]{12}\.webp$/.test(url.pathname) ? 'private, max-age=31536000, immutable' : asset.type === 'image/png' ? 'private, max-age=86400' : 'no-cache';
    return new Response(bytes, { headers: { ...security, 'Content-Type': asset.type, 'Cache-Control': cache } });
  },
};
