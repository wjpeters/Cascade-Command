export const VERSION = 'cascade-1';
export const FPS = 60;
export const DURATION = 75;
export const SEED = 271026;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const polar = (r, a) => ({ x: 500 + Math.cos(a) * r, y: 500 + Math.sin(a) * r });
export function createNetwork() {
  const nodes = [];
  const addRing = (prefix, count, radius, offset, tier) => {
    for (let i = 0; i < count; i++) nodes.push({ id: prefix + i, ...polar(radius, -Math.PI / 2 + i * Math.PI * 2 / count + offset), tier, index: i, targets: [] });
  };
  addRing('c', 3, 112, 0, 0);
  addRing('i', 6, 209, 0, 1);
  addRing('m', 9, 309, 0, 2);
  addRing('o', 18, 422, 0, 3);
  for (const n of nodes) {
    if (n.tier === 3) n.targets = ['m' + Math.floor(n.index / 2)];
    if (n.tier === 2) {
      const next = Math.round(n.index * 6 / 9) % 6;
      n.targets = ['i' + next];
      if (n.index % 3 === 1) n.targets.push('i' + ((next + 1) % 6));
    }
    if (n.tier === 1) {
      const next = Math.round(n.index / 2) % 3;
      n.targets = ['c' + next];
      if (n.index % 2) n.targets.push('c' + ((next + 1) % 3));
    }
  }
  const map = Object.fromEntries(nodes.map(n => [n.id, n]));
  const links = nodes.flatMap(n => n.targets.map((id, index) => ({ from: n, to: map[id], hidden: index > 0 })));
  return { nodes, map, links };
}
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export class Game {
  constructor(seed = SEED) {
    this.network = createNetwork(); this.random = rng(seed); this.tick = 0; this.energy = 100;
    this.hp = [4, 4, 4]; this.score = 0; this.combo = 0; this.bestCombo = 0; this.lastHit = -1000;
    this.packets = []; this.fields = []; this.fx = []; this.events = []; this.nextSpawn = 90;
    this.lastShot = -1000; this.scanUntil = 0; this.scanReady = 0; this.scans = 0;
    this.intercepted = 0; this.cascades = 0; this.shots = 0; this.lost = 0; this.finished = false;
    this.bonus = 0; this.id = 0;
  }
  get seconds() { return this.tick / FPS; }
  get phase() { return Math.min(3, 1 + Math.floor(this.seconds / 25)); }
  get services() { return this.hp.filter(h => h > 0).length; }
  emit(type, x, y, value = 0) { this.events.push({ type, x, y, value }); }
  act(action) {
    if (this.finished) return false;
    if (action.type === 'scan') {
      if (this.tick < this.scanReady) return false;
      this.scanUntil = this.tick + 300; this.scanReady = this.tick + 1080; this.scans++;
      this.emit('scan', 500, 500); return true;
    }
    if (action.type !== 'shot' || !Number.isFinite(action.x) || !Number.isFinite(action.y) || action.x < 0 || action.x > 1000 || action.y < 0 || action.y > 1000 || this.energy < 20 || this.tick - this.lastShot < 12) return false;
    this.energy -= 20; this.lastShot = this.tick; this.shots++;
    const delay = Math.round(Math.hypot(action.x - 500, action.y - 500) / 1000 * FPS);
    this.fields.push({ x: action.x, y: action.y, born: this.tick, start: this.tick + delay, end: this.tick + delay + 110, radius: 0, hits: 0 });
    this.emit('shot', action.x, action.y); return true;
  }
  spawn(fromId, toId, generation = 0, root = null) {
    const from = this.network.map[fromId], to = this.network.map[toId];
    this.packets.push({ id: this.id++, from: fromId, to: toId, x: from.x, y: from.y, p: 0, length: distance(from, to), generation, root: root ?? this.id, warning: generation === 0 ? 45 : 0 });
  }
  update() {
    if (this.finished) return;
    this.events = [];
    this.tick++;
    this.energy = Math.min(100, this.energy + 13 / FPS);
    if (this.tick - this.lastHit > 150) this.combo = 0;
    if (this.tick >= this.nextSpawn && this.seconds < 72) {
      const n = this.network.map['o' + Math.floor(this.random() * 18)];
      this.spawn(n.id, n.targets[0]);
      const interval = this.phase === 1 ? 145 : this.phase === 2 ? 98 : 64;
      this.nextSpawn = this.tick + interval + Math.floor(this.random() * 32);
    }
    this.fields = this.fields.filter(f => f.end > this.tick);
    for (const f of this.fields) {
      const age = this.tick - f.start;
      f.radius = age < 0 ? 0 : 77 * Math.min(1, age / 12, (f.end - this.tick) / 25);
    }
    const current = this.packets; this.packets = [];
    for (const p of current) {
      if (p.warning > 0) { p.warning--; this.packets.push(p); continue; }
      const from = this.network.map[p.from], to = this.network.map[p.to];
      const speed = (this.phase === 1 ? 45 : this.phase === 2 ? 55 : 65) * (this.tick < this.scanUntil ? 0.40 : 1);
      p.p += speed / FPS / p.length;
      p.x = from.x + (to.x - from.x) * Math.min(1, p.p); p.y = from.y + (to.y - from.y) * Math.min(1, p.p);
      const shield = this.fields.find(f => f.radius > 0 && distance(f, p) < f.radius + 4);
      if (shield) {
        shield.hits++; this.intercepted++; this.combo = this.tick - this.lastHit < 150 ? this.combo + 1 : 1;
        this.bestCombo = Math.max(this.bestCombo, this.combo); this.lastHit = this.tick;
        const points = 100 + Math.min(4, this.combo - 1) * 25 + (to.tier > 0 ? 25 : 0);
        this.score += points; this.fx.push({ type: 'hit', x: p.x, y: p.y, born: this.tick, points });
        this.emit('hit', p.x, p.y, points); continue;
      }
      if (p.p < 1) { this.packets.push(p); continue; }
      if (to.tier === 0) {
        if (this.hp[to.index] > 0) {
          this.hp[to.index]--; this.lost++; this.combo = 0;
          this.fx.push({ type: 'damage', x: to.x, y: to.y, born: this.tick }); this.emit('damage', to.x, to.y);
        }
      } else {
        const targets = to.targets.slice(0, this.phase >= 2 ? 2 : 1);
        if (targets.length > 1) { this.cascades++; this.emit('cascade', to.x, to.y); this.fx.push({ type: 'cascade', x: to.x, y: to.y, born: this.tick }); }
        for (const next of targets) this.spawn(to.id, next, p.generation + 1, p.root);
      }
    }
    this.fx = this.fx.filter(f => this.tick - f.born < 65);
    if (this.tick >= DURATION * FPS || this.services === 0) {
      this.finished = true; this.bonus = this.hp.reduce((a, b) => a + b, 0) * 100 + this.services * 300;
      this.score += this.bonus; this.emit('finish', 500, 500);
    }
  }
}
export function replay(actions, seed = SEED) {
  if (!Array.isArray(actions) || actions.length > 1000) throw new Error('Ongeldige spelacties.');
  const game = new Game(seed); let cursor = 0, previous = -1;
  for (const a of actions) {
    if (!a || !Number.isInteger(a.tick) || a.tick < previous || a.tick < 0 || a.tick >= FPS * DURATION) throw new Error('Ongeldige volgorde.');
    previous = a.tick;
  }
  while (!game.finished) {
    while (cursor < actions.length && actions[cursor].tick === game.tick) {
      if (!game.act(actions[cursor++])) throw new Error('Ongeldige spelactie.');
    }
    game.update();
  }
  if (cursor !== actions.length) throw new Error('Acties na einde van de ronde.');
  return game;
}
