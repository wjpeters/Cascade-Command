import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { DAY, IP_DAYS, DETAIL_DAYS, STATS_PAGE_SIZE, sinceDay, emptyDay, report } from './common.js';
export function localAnalytics(filename) {
  let data = { events: [], daily: [] }, broken = false;
  if (existsSync(filename)) try { data = JSON.parse(readFileSync(filename, 'utf8')); if (!Array.isArray(data.events) || !Array.isArray(data.daily)) throw new Error(); } catch { broken = true; }
  function assertReadable() { if (broken) throw new Error('Statistics file unavailable'); }
  function save() { const temp = filename + '.tmp'; writeFileSync(temp, JSON.stringify(data), { mode: 0o600 }); renameSync(temp, filename); }
  function change(update) { assertReadable(); const previous = data; data = structuredClone(data); try { update(); save(); } catch (error) { data = previous; throw error; } }
  function cleanup(now) {
    assertReadable();
    if (data.events.some(e => e.started < now - DETAIL_DAYS * DAY || (e.ip && e.started < now - IP_DAYS * DAY))) change(() => { data.events = data.events.filter(e => e.started >= now - DETAIL_DAYS * DAY).map(e => e.started < now - IP_DAYS * DAY ? { ...e, ip: null } : e); });
  }
  return {
    record(entry) {
      cleanup(Date.now()); if (data.events.some(e => e.id === entry.id)) return;
      change(() => { let day = data.daily.find(d => d.day === entry.day); if (!day) { day = emptyDay(entry.day); data.daily.push(day); } day[entry.kind === 'visit' ? 'visits' : 'starts']++; data.events.push(entry); });
    },
    complete(id, game, saved = false, now = Date.now()) {
      assertReadable(); if (!data.events.some(e => e.id === id && e.kind === 'round')) return;
      change(() => {
        const entry = data.events.find(e => e.id === id), day = data.daily.find(d => d.day === entry.day);
        if (entry.finished === null) { entry.finished = now; entry.score = game.score; entry.services = game.services; entry.duration = game.tick / 60; day.completed++; day.duration_sum += entry.duration; day.score_sum += game.score; }
        if (saved && !entry.saved) { entry.saved = 1; day.saved++; }
      });
    },
    markSaved(id) {
      assertReadable(); if (!data.events.some(e => e.id === id && e.finished !== null && !e.saved)) return;
      change(() => { const entry = data.events.find(e => e.id === id); entry.saved = 1; data.daily.find(d => d.day === entry.day).saved++; });
    },
    stats(days, page, now = Date.now()) {
      cleanup(now); const since = sinceDay(days, now), events = data.events.filter(e => e.day >= since);
      const visits = events.filter(e => e.kind === 'visit'), ipVisits = visits.filter(e => e.started >= now - IP_DAYS * DAY), rounds = events.filter(e => e.kind === 'round').sort((a, b) => b.started - a.started || b.id.localeCompare(a.id));
      const groups = {};
      for (const key of ['device', 'browser', 'os', 'country', 'referrer']) { const values = new Map(); for (const entry of visits) values.set(entry[key], (values.get(entry[key]) || 0) + 1); groups[key] = [...values].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 8); }
      const ipMap = new Map();
      for (const entry of events.filter(e => e.ip && e.started >= now - IP_DAYS * DAY)) { const value = ipMap.get(entry.ip) || { ip: entry.ip, country: entry.country, visits: 0, starts: 0, lastSeen: 0 }; value[entry.kind === 'visit' ? 'visits' : 'starts']++; value.lastSeen = Math.max(value.lastSeen, entry.started); ipMap.set(entry.ip, value); }
      const ips = [...ipMap.values()].sort((a, b) => b.starts - a.starts || b.visits - a.visits || b.lastSeen - a.lastSeen).slice(0, 20);
      const daily = [...data.daily].sort((a, b) => a.day.localeCompare(b.day));
      const recent = rounds.slice((page - 1) * STATS_PAGE_SIZE, page * STATS_PAGE_SIZE).map(({ id, kind, day, ...entry }) => entry);
      return report(daily.filter(d => d.day >= since), daily[0]?.day || null, { groups, network: { uniqueIps: new Set(ipVisits.filter(e => e.ip).map(e => e.ip)).size, known: ipVisits.filter(e => e.ip).length, samples: ipVisits.length }, ips, recent, recentTotal: rounds.length, page, days }, now);
    },
  };
}
