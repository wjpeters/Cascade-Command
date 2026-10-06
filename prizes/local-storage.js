import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
import { drawDay, drawPool, makeDraw } from './draw.js';
export function localPrizeStorage(filename, readScores, version) {
  let draws = existsSync(filename) ? JSON.parse(readFileSync(filename, 'utf8')) : [];
  if (!Array.isArray(draws)) throw new Error('Ongeldig trekkingenbestand.');
  const latest = () => [...draws].filter(d => d.version === version).sort((a,b) => b.day.localeCompare(a.day))[0] || null;
  return {
    publicDraw() { return { day: drawDay(), winner: latest() }; },
    drawStatus() { return { ...this.publicDraw(), eligibleCount: drawPool(readScores().filter(s => s.version === version)).length }; },
    drawPrize(day) {
      const now = new Date();
      if (day !== drawDay(now)) return { winner: null, created: false };
      const existing = draws.find(d => d.version === version && d.day === day);
      if (existing) return { winner: existing, created: false };
      const winner = makeDraw(readScores().filter(s => s.version === version), version, now);
      if (!winner) return { winner: null, created: false };
      const next = [...draws, winner], temp = filename + '.tmp';
      writeFileSync(temp, JSON.stringify(next, null, 2), { mode: 0o600 }); renameSync(temp, filename); draws = next;
      return { winner, created: true };
    },
  };
}
