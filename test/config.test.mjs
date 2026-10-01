import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, replay, GAME_CONFIG, VERSION, FPS } from '../src/engine.js';
import { validateGameConfig, configFingerprint } from '../src/game-rules.js';

const settings = () => structuredClone(GAME_CONFIG);
const only = (values, key) => Object.fromEntries(Object.keys(values).map(name => [name, name === key ? 1 : 0]));

test('custom wave timing, spawn pressure, tiers, risk mix and quiet ending control real rounds', () => {
  const config = settings();
  config.round = { durationSeconds: 12, seed: 42, firstSpawnSeconds: 0.1, quietEndSeconds: 1 };
  config.waves = config.waves.slice(0, 2);
  Object.assign(config.waves[0], { spawnIntervalSeconds: 1, spawnJitterSeconds: 0 });
  Object.assign(config.waves[1], { startsAtSeconds: 6, spawnIntervalSeconds: 0.5, spawnJitterSeconds: 0 });
  config.waves[0].tierWeights = { 1: 0, 2: 0, 3: 1 };
  config.waves[1].tierWeights = { 1: 1, 2: 0, 3: 0 };
  for (const wave of config.waves) wave.threatWeights = only(wave.threatWeights, 'low');
  const game = new Game(42, config), spawns = [];
  while (!game.finished) {
    const previous = game.risks.size;
    game.update();
    if (game.risks.size > previous) {
      const risk = [...game.risks.values()].at(-1);
      spawns.push({ seconds: game.seconds, phase: game.phase, tier: game.network.map[risk.origin].tier, kind: risk.kind });
    }
  }
  assert.equal(game.seconds, 12);
  assert.equal(game.services, 3);
  assert.ok(spawns.every(spawn => spawn.kind === 'low' && spawn.seconds < 11));
  assert.ok(spawns.filter(spawn => spawn.phase === 1).every(spawn => spawn.tier === 3));
  assert.ok(spawns.filter(spawn => spawn.phase === 2).every(spawn => spawn.tier === 1));
  assert.ok(spawns.filter(spawn => spawn.phase === 2).length > spawns.filter(spawn => spawn.phase === 1).length);
  assert.equal(spawns[0].seconds, 0.1);
});

test('custom energy, scan, field size and replay stay consistent', () => {
  const config = settings();
  config.energy.regenerationPerSecond = 7;
  config.shot.cost = 18;
  config.shot.fieldRadius = 30;
  config.shot.fieldDurationSeconds = 1.2;
  config.scan.cost = 36;
  config.scan.durationSeconds = 2;
  config.scan.cooldownSeconds = 6;
  config.scan.speedMultiplier = 0.2;
  const game = new Game(42, config), actions = [{ tick: 0, type: 'shot', x: 200, y: 200 }];
  assert.equal(game.act(actions[0]), true);
  assert.equal(game.energy, 82);
  while (game.tick < FPS) game.update();
  assert.ok(Math.abs(game.energy - 89) < 0.00001);
  assert.equal(game.fields[0].radius, 30);
  actions.push({ tick: game.tick, type: 'scan' });
  assert.equal(game.act(actions[1]), true);
  assert.ok(Math.abs(game.energy - 53) < 0.00001);
  assert.equal(game.scanUntil - game.tick, 2 * FPS);
  assert.equal(game.scanReady - game.tick, 6 * FPS);
  while (!game.finished) game.update();
  const checked = replay(actions, 42, config);
  assert.equal(checked.score, game.score);
  assert.deepEqual(checked.hp, game.hp);
  assert.equal(checked.tick, game.tick);
  assert.deepEqual(checked.intelligence, game.intelligence);
});

test('changing difficulty gets a new leaderboard identity while editorial changes do not', () => {
  const changed = settings(), original = configFingerprint(GAME_CONFIG);
  changed.waves[1].speed += 1;
  assert.notEqual(configFingerprint(changed), original);
  changed.waves[1].speed -= 1;
  changed.waves[1].name = 'Andere naam';
  changed.waves[1].message = 'Andere uitleg';
  assert.equal(configFingerprint(changed), original);
  changed.waves[0].tierWeights = { 3: 100, 1: 0, 2: 0 };
  assert.equal(configFingerprint(changed), original);
  assert.equal(VERSION, 'cascade-3-' + original);
});

test('invalid settings fail early instead of producing an unfair or broken round', () => {
  for (const change of [
    config => config.waves[0].spawnIntervalSeconds = 0,
    config => config.waves[1].startsAtSeconds = 0,
    config => config.waves[0].tierWeights = { 1: 0, 2: 0, 3: 0 },
    config => config.waves[0].threatWeights.cve = -1,
    config => config.scan.cooldownSeconds = 1,
    config => config.energy.regenerationPerSecond = NaN,
    config => config.round.firstSpawnSeconds = config.round.durationSeconds,
    config => config.shot.growSeconds = 0,
  ]) {
    const config = settings(); change(config);
    assert.throws(() => validateGameConfig(config), /Ongeldige gameplayconfig/);
  }
});
