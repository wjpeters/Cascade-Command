export const DAY = 86400000;
export const IP_DAYS = 30, DETAIL_DAYS = 90, STATS_PAGE_SIZE = 25;
const calendar = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
export function dayKey(time) { const parts = Object.fromEntries(calendar.formatToParts(new Date(time)).map(p => [p.type, p.value])); return `${parts.year}-${parts.month}-${parts.day}`; }
export function sinceDay(days, now = Date.now()) {
  if (!days) return '0000-00-00';
  // Calendar arithmetic, rather than 24h offsets, keeps date filters correct across DST.
  const date = new Date(dayKey(now) + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() - days + 1); return date.toISOString().slice(0, 10);
}
export function normalizeIp(raw) {
  if (typeof raw !== 'string' || raw.length > 64 || !/^[\da-fA-F:.]+$/.test(raw)) return null;
  if (raw.startsWith('::ffff:') && raw.slice(7).includes('.')) raw = raw.slice(7);
  if (!raw.includes(':')) {
    const parts = raw.split('.');
    return parts.length === 4 && parts.every(p => /^\d{1,3}$/.test(p) && Number(p) <= 255) ? parts.map(Number).join('.') : null;
  }
  try { return new URL(`http://[${raw}]/`).hostname.slice(1, -1); } catch { return null; }
}
export function metadata(request, input = {}, remoteAddress) {
  const headers = request.headers;
  let ip = normalizeIp(remoteAddress === undefined ? headers.get('cf-connecting-ip') : remoteAddress);
  // This is Cloudflare's shared cross-zone Worker address, not a visitor address.
  if (ip === '2a06:98c0:3600::103' || ip === '::' || ip === '0.0.0.0') ip = null;
  const ua = (headers.get('user-agent') || '').slice(0, 500);
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox|FxiOS/.test(ua) ? 'Firefox' : /Chrome|CriOS/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Onbekend';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS / iPadOS' : /Windows/.test(ua) ? 'Windows' : /Macintosh|Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Onbekend';
  const device = /bot|crawler|spider|headless/i.test(ua) ? 'Bot / automatisch' : /iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'Tablet' : /Mobile|iPhone|iPod/.test(ua) ? 'Telefoon' : ua ? 'Computer' : 'Onbekend';
  const countryValue = remoteAddress === undefined && ip ? (request.cf?.country || headers.get('cf-ipcountry') || '') : '';
  const country = /^[A-Z]{2}$/.test(countryValue) && countryValue !== 'XX' ? countryValue : '';
  let referrer = '';
  try { const url = new URL(typeof input.referrer === 'string' ? input.referrer.slice(0, 2048) : ''); if (['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(request.url).origin) referrer = url.hostname.slice(0, 253); } catch {}
  const language = (headers.get('accept-language') || '').split(',')[0].split(';')[0].trim().slice(0, 35);
  return { ip, ip_source: ip ? (remoteAddress === undefined ? 'cloudflare' : 'socket') : 'unavailable', country, browser, os, device,
    language: /^[a-zA-Z0-9-]{1,35}$/.test(language) ? language : '', referrer,
    viewport: Number.isInteger(input.width) && input.width >= 200 && input.width <= 10000 ? (input.width < 768 ? '<768 px' : input.width < 1200 ? '768–1199 px' : '≥1200 px') : '' };
}
export function eventRecord(id, kind, started, version, meta) {
  return { id, kind, started, day: dayKey(started), version, finished: null, saved: 0, score: null, services: null, duration: null, ...meta };
}
export function emptyDay(day) { return { day, visits: 0, starts: 0, completed: 0, saved: 0, duration_sum: 0, score_sum: 0 }; }
export function report(daily, firstDay, extra, now = Date.now()) {
  const totals = daily.reduce((sum, row) => { for (const key of ['visits', 'starts', 'completed', 'saved', 'duration_sum', 'score_sum']) sum[key] += row[key]; return sum; }, emptyDay(''));
  const lastDays = [];
  if (firstDay) {
    const start = [sinceDay(Math.min(extra.days || 30, 30), now), firstDay].sort().at(-1);
    for (let cursor = new Date(start + 'T12:00:00Z'); cursor.toISOString().slice(0, 10) <= dayKey(now); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
      const key = cursor.toISOString().slice(0, 10); lastDays.push(daily.find(d => d.day === key) || emptyDay(key));
    }
  }
  return { ...extra, totals, daily: lastDays, firstDay, generatedAt: now, timezone: 'Europe/Amsterdam', ipDays: IP_DAYS, detailDays: DETAIL_DAYS, pageSize: STATS_PAGE_SIZE };
}
export async function safely(operation) { try { return await operation(); } catch { console.error('Gebruiksstatistieken konden niet worden bijgewerkt.'); return null; } }
