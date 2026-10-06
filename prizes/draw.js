import { PRIZE_CONFIG } from '../src/prize-config.js';
import { compareScores } from '../admin/local-storage.js';
export function drawDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: PRIZE_CONFIG.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = type => parts.find(p => p.type === type).value;
  return value('year') + '-' + value('month') + '-' + value('day');
}
const playerKey = name => name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('nl-NL');
export function drawPool(scores) {
  const ranked = [...scores].sort(compareScores), excluded = new Set(ranked.slice(0, 3).map(s => playerKey(s.name))), seen = new Set();
  return ranked.filter(s => {
    const key = playerKey(s.name);
    if (excluded.has(key) || seen.has(key)) return false;
    seen.add(key); return true;
  });
}
export function makeDraw(scores, version, now = new Date(), random = crypto) {
  const eligible = drawPool(scores);
  if (!eligible.length) return null;
  // Rejection sampling avoids modulo bias. Each distinct eligible name gets one chance.
  const limit = 4294967296 - 4294967296 % eligible.length;
  let value; do { value = random.getRandomValues(new Uint32Array(1))[0]; } while (value >= limit);
  const selected = eligible[value % eligible.length];
  return { day: drawDay(now), version, scoreId: selected.id, name: selected.name, score: selected.score, services: selected.services,
    drawnAt: now.toISOString(), eligibleCount: eligible.length, prize: { ...PRIZE_CONFIG.prizes.consolation } };
}
