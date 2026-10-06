import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { GAME_CONFIG } from '../src/game-config.js';
import { configFingerprint } from '../src/game-rules.js';
import { validatePrizeConfig } from '../src/prize-config.js';
import { drawDay, drawPool, makeDraw } from '../prizes/draw.js';
import { localPrizeStorage } from '../prizes/local-storage.js';
const entries = Array.from({ length: 120 }, (_, i) => ({ id: String(i), version: 'test', name: 'Speler ' + i, score: 500 - i, services: 3, date: '2026-10-06T10:00:00Z' }));
test('prize settings do not change the game version and reject unsafe image links', () => {
  const config = structuredClone(GAME_CONFIG), fingerprint = configFingerprint(config);
  config.leaderboard.flipIntervalSeconds = 8; config.leaderboard.prizes.podium[0].title = 'Andere prijs';
  assert.equal(configFingerprint(config), fingerprint);
  for (const image of ['javascript:alert(1)', '//other.example/a.png', 'http://other.example/a.png', 'https://user:pass@other.example/a.png', '/bad\\image']) {
    const bad = structuredClone(config.leaderboard); bad.prizes.consolation.image = image;
    assert.throws(() => validatePrizeConfig(bad));
  }
  config.leaderboard.prizes.consolation.image = 'https://images.example/demo.png';
  assert.equal(validatePrizeConfig(config.leaderboard), config.leaderboard);
  for (const delay of [-1, 1, 2, Infinity, 3601]) {
    const bad = structuredClone(config.leaderboard); bad.flipIntervalSeconds = delay; assert.throws(() => validatePrizeConfig(bad));
  }
  config.leaderboard.flipIntervalSeconds = 0; validatePrizeConfig(config.leaderboard);
});
test('Dutch calendar day respects midnight and both daylight saving offsets', () => {
  assert.equal(drawDay(new Date('2026-10-06T21:59:59Z')), '2026-10-06');
  assert.equal(drawDay(new Date('2026-10-06T22:00:00Z')), '2026-10-07');
  assert.equal(drawDay(new Date('2026-12-01T22:59:59Z')), '2026-12-01');
  assert.equal(drawDay(new Date('2026-12-01T23:00:00Z')), '2026-12-02');
});
test('pool deduplicates Unicode names, excludes every score of the podium and can select rank 120', () => {
  const scores = structuredClone(entries);
  scores[0].name = 'Élodie'; scores[3].name = 'ÉLODIE'; scores[4].name = 'Speler 5';
  const pool = drawPool(scores); assert.equal(pool.length, 115);
  assert.ok(!pool.some(s => s.name.toLowerCase() === 'élodie'));
  const sample = makeDraw(scores, 'test', new Date('2026-10-06T12:00:00Z'), { getRandomValues: a => { a[0] = pool.length - 1; return a; } });
  assert.equal(sample.scoreId, '119');
  assert.equal(sample.eligibleCount, 115);
  assert.equal(sample.day, '2026-10-06');
  let calls = 0;
  makeDraw(entries, 'test', new Date(), { getRandomValues: a => { a[0] = calls++ ? 0 : 4294967295; return a; } });
  assert.equal(calls, 2, 'biased last values must be rejected');
});
test('local daily draw survives restart, preserves snapshots and uses all 120 scores', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'cascade-prize-test-'));
  try {
    let scores = structuredClone(entries);
    const filename = path.join(directory, 'prize-draws.json');
    let store = localPrizeStorage(filename, () => scores, 'test');
    assert.equal(store.drawStatus().eligibleCount, 117);
    const day = drawDay(), result = store.drawPrize(day); assert.ok(result.created);
    scores = []; store = localPrizeStorage(filename, () => scores, 'test');
    assert.deepEqual(store.publicDraw().winner, result.winner);
    assert.deepEqual(store.drawPrize(day), { winner: result.winner, created: false });
    assert.equal(store.drawPrize('2000-01-01').winner, null);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
