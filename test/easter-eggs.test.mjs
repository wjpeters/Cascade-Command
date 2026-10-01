import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, replay, GAME_CONFIG, SEED } from '../src/engine.js';
import { configFingerprint, validateGameConfig } from '../src/game-rules.js';
import { createDetector } from '../plugins/easter-eggs/detector.js';
import { observeGame } from '../plugins/easter-eggs/observe.js';
import { CARDS } from '../plugins/easter-eggs/cards.js';
import { PORTRAITS } from '../plugins/easter-eggs/portraits.js';
import { readFile } from 'node:fs/promises';

const sample = overrides => ({ seconds: 20, firstWaveEnd: 20, hp: [4, 4, 4], lost: 0, ignored: 0, prevented: 0, ...overrides });
const hit = overrides => ({ scans: 1, fast: false, combo: 1, prevented: 0, ...overrides });
function setup() {
  const found = [], discovered = new Set();
  return { found, discovered, detector: createDetector({ discovered, onUnlock: id => found.push(id) }) };
}

test('ten agreed characters have ten real compact portraits with immutable filenames', async () => {
  assert.equal(CARDS.length, 10); assert.equal(new Set(CARDS.map(card => card.id)).size, 10);
  assert.equal(CARDS.find(card => card.id === 'niels').character, 'Mace Windu');
  assert.match(CARDS.find(card => card.id === 'willem').character, /Darth Sidious/);
  for (const card of CARDS) {
    assert.match(PORTRAITS[card.id], new RegExp(`/assets/${card.id}\\.[a-f0-9]{12}\\.webp$`));
    const bytes = await readFile(new URL('..' + PORTRAITS[card.id], import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
    assert.ok(bytes.length < 50000);
  }
});

test('Niels unlocks exactly at the configured first-wave boundary without any damage', () => {
  const { detector, found } = setup();
  detector.sample(sample({ seconds: 19.99 })); assert.deepEqual(found, []);
  detector.sample(sample()); detector.sample(sample({ seconds: 21 }));
  assert.deepEqual(found, ['niels']);
  const damaged = setup(); damaged.detector.sample(sample({ hp: [4, 3, 4], lost: 1 }));
  damaged.detector.sample(sample()); assert.deepEqual(damaged.found, []);
});

test('Kevin needs scans of three distinct supplier tiers within the same round', () => {
  const { detector, found } = setup();
  for (const tier of [0, 1, 1, 2, undefined]) detector.scanned(tier);
  assert.deepEqual(found, []); detector.scanned(3); detector.scanned(3);
  assert.deepEqual(found, ['kevin']);
  const shared = new Set(); createDetector({ discovered: shared }).scanned(1);
  const other = createDetector({ discovered: shared }); other.scanned(2); other.scanned(3);
  assert.equal(shared.has('kevin'), false);
});

test('Luuk only gets the first real interception before the first scan', () => {
  const first = setup(); first.detector.intercepted(hit({ scans: 0 })); first.detector.intercepted(hit({ scans: 0 }));
  assert.deepEqual(first.found, ['luuk']);
  const scanned = setup(); scanned.detector.intercepted(hit({ scans: 1 })); scanned.detector.intercepted(hit({ scans: 0 }));
  assert.equal(scanned.found.includes('luuk'), false);
});

test('Robin counts three fast hits, Stefan combo five, Jelle three prevented cascades', () => {
  const { detector, found } = setup();
  detector.intercepted(hit({ fast: true, combo: 4, prevented: 2 }));
  detector.intercepted(hit({ fast: false })); detector.intercepted(hit({ fast: true }));
  assert.deepEqual(found, []);
  detector.intercepted(hit({ fast: true, combo: 5, prevented: 3 }));
  detector.intercepted(hit({ fast: true, combo: 6, prevented: 4 }));
  assert.deepEqual(found, ['robin', 'stefan', 'jelle']);
});

test('Nick only counts safely arrived LOW signals, never queued or intercepted signals', () => {
  const { detector, found } = setup();
  detector.sample(sample({ seconds: 5, ignored: 2 })); assert.deepEqual(found, []);
  detector.sample(sample({ seconds: 5, ignored: 3 })); detector.sample(sample({ seconds: 5, ignored: 4 }));
  assert.deepEqual(found, ['nick']);
});

test('discovered cards are not repeated across separate rounds', () => {
  const { detector, discovered, found } = setup(); detector.sample(sample());
  createDetector({ discovered, onUnlock: id => found.push(id) }).sample(sample());
  assert.deepEqual(found, ['niels']);
});

test('presentation switch preserves the existing score edition even when previously absent', () => {
  const enabled = structuredClone(GAME_CONFIG), disabled = structuredClone(GAME_CONFIG), absent = structuredClone(GAME_CONFIG);
  enabled.easterEggs = true; disabled.easterEggs = false; delete absent.easterEggs;
  assert.equal(configFingerprint(enabled), configFingerprint(disabled));
  assert.equal(configFingerprint(enabled), configFingerprint(absent));
  assert.throws(() => validateGameConfig({ ...GAME_CONFIG, easterEggs: 'false' }), /easterEggs/);
});

function summary(game) {
  return { score: game.score, tick: game.tick, hp: game.hp, energy: game.energy, packets: game.packets,
    fields: game.fields, risks: [...game.risks], feed: game.feed, fx: game.fx, events: game.events,
    scanned: game.scans, hits: game.intercepted, ignored: game.ignored, prevented: game.prevented,
    combo: game.bestCombo, intelligence: game.intelligence, links: [...game.discoveredLinks] };
}

test('observing a full real round preserves every simulation state and server replay', () => {
  const observed = new Game(), control = new Game(), found = [], actions = [];
  const detach = observeGame(observed, { active: () => true, discovered: new Set(), onUnlock: id => found.push(id) });
  while (!control.finished) {
    if (control.tick % 30 === 0 && control.energy >= 20) {
      const packet = control.packets.find(packet => packet.kind !== 'low' && packet.warning === 0);
      if (packet) {
        const action = { tick: control.tick, type: 'shot', x: Math.round(packet.x), y: Math.round(packet.y) };
        if (control.act(action)) { assert.equal(observed.act(action), true); actions.push(action); }
      }
    }
    if (control.tick === 1) {
      const action = { tick: 1, type: 'scan' }; assert.equal(control.act(action), true); assert.equal(observed.act(action), true); actions.push(action);
    }
    control.update(); observed.update(); assert.deepEqual(summary(observed), summary(control));
  }
  assert.deepEqual(summary(replay(actions, SEED)), summary(control));
  assert.ok(found.length > 0); detach(); assert.equal(observed.update, Game.prototype.update);
  assert.equal(observed.act, Game.prototype.act); assert.equal(observed.intercept, Game.prototype.intercept);
});

test('demo observations do not unlock cards and low-risk mistakes do not unlock Luuk', () => {
  const game = new Game(), found = [];
  const detach = observeGame(game, { active: () => false, discovered: new Set(), onUnlock: id => found.push(id) });
  while (!game.finished) game.update(); assert.deepEqual(found, []); detach();
  const real = new Game(); observeGame(real, { active: () => true, discovered: new Set(), onUnlock: id => found.push(id) });
  real.spawn('i0', 'c0', 0, null, 'low'); const packet = real.packets.pop();
  real.intercept(packet, { hits: 0 }); assert.deepEqual(found, []);
});

test('observer callback failure restores original methods and cannot prevent an accepted action', () => {
  const game = new Game(), errors = [];
  observeGame(game, { active: () => true, discovered: new Set(), onUnlock: () => { throw new Error('UI failed'); }, onError: error => errors.push(error.message) });
  game.spawn('i0', 'c0'); const packet = game.packets.pop();
  game.intercept(packet, { hits: 0 });
  assert.ok(game.score > 0); assert.deepEqual(errors, ['UI failed']);
  assert.equal(game.update, Game.prototype.update); assert.equal(game.act, Game.prototype.act);
  assert.equal(game.intercept, Game.prototype.intercept); game.update(); assert.equal(game.tick, 1);
});
