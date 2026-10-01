import { GAME_CONFIG as settings } from './game-config.js';
import { validateGameConfig, deepFreeze, configFingerprint, pickWeighted } from './game-rules.js';
export const GAME_CONFIG = deepFreeze(validateGameConfig(settings));
export const VERSION = 'cascade-3-' + configFingerprint(GAME_CONFIG);
export const FPS = 60;
export const DURATION = GAME_CONFIG.round.durationSeconds;
export const SEED = GAME_CONFIG.round.seed;
export const SHOT_COST = GAME_CONFIG.shot.cost;
export const SCAN_COST = GAME_CONFIG.scan.cost;
const ticks = seconds => Math.round(seconds * FPS);
export const SERVICE_NAMES = ['Klantportaal', 'Betalingen', 'Operatie'];
export const THREATS = {
  cve: { code: 'CVE', label: 'Critical CVE', type: 'Kwetsbaarheid', severity: 'critical', damage: 2, color: '#ff6e75', feed: 'Critical CVE detected' },
  incident: { code: 'INC', label: 'Leveranciersincident', type: 'Incident', severity: 'high', damage: 1, color: '#ffad65', feed: 'Supplier incident detected' },
  geo: { code: 'GEO', label: 'Geopolitiek risico', type: 'Geopolitiek', severity: 'high', damage: 1, color: '#ffad65', feed: 'Geopolitical risk increased' },
  law: { code: 'LAW', label: 'Impactvolle regelgeving', type: 'Wet- en regelgeving', severity: 'high', damage: 1, color: '#ffad65', feed: 'Regulatory change detected' },
  rating: { code: 'RAT', label: 'Cyberrating gedaald', type: 'Cyberrating', severity: 'high', damage: 1, color: '#ffad65', feed: 'Cyber rating decreased' },
  low: { code: 'LOW', label: 'Laag risico', type: 'Informatief signaal', severity: 'low', damage: 0, color: '#79c4e0', feed: 'Low-risk signal observed' },
};
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const linkKey = link => `${link.from.id}>${link.to.id}`;
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
  const countries = [['Nederland', 'EU'], ['Duitsland', 'EU'], ['Verenigde Staten', 'VS'], ['Taiwan', 'Taiwan'], ['Verenigd Koninkrijk', 'VK'], ['Singapore', 'Singapore']];
  for (const node of nodes) {
    const [country, jurisdiction] = countries[(node.index + node.tier) % countries.length];
    Object.assign(node, { name: node.tier === 0 ? SERVICE_NAMES[node.index] : `Leverancier T${node.tier}-${String(node.index + 1).padStart(2, '0')}`, country, jurisdiction, rating: 58 + (node.index * 7 + node.tier * 11) % 39 });
  }
  const map = Object.fromEntries(nodes.map(n => [n.id, n]));
  const links = nodes.flatMap(n => n.targets.map((id, index) => ({ from: n, to: map[id], hidden: index > 0 })));
  return { nodes, map, links };
}
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
export class Game {
  constructor(seed = SEED, config = GAME_CONFIG) {
    this.config = config === GAME_CONFIG ? config : deepFreeze(validateGameConfig(structuredClone(config)));
    this.network = createNetwork(); this.random = rng(seed); this.tick = 0; this.energy = 100;
    this.hp = [4, 4, 4]; this.score = 0; this.combo = 0; this.bestCombo = 0; this.lastHit = -1000;
    this.packets = []; this.fields = []; this.fx = []; this.events = []; this.nextSpawn = ticks(this.config.round.firstSpawnSeconds);
    this.lastShot = -1000; this.scanUntil = 0; this.scanReady = 0; this.scans = 0;
    this.intercepted = 0; this.cascades = 0; this.prevented = 0; this.mistakes = 0; this.ignored = 0;
    this.shots = 0; this.lost = 0; this.finished = false; this.bonus = 0; this.id = 0;
    this.risks = new Map(); this.discoveredLinks = new Set(); this.intelligence = null;
    this.feed = []; this.feedRevision = 0;
  }
  get seconds() { return this.tick / FPS; }
  get phase() { return this.config.waves.findLastIndex(wave => this.seconds >= wave.startsAtSeconds) + 1; }
  get wave() { return this.config.waves[this.phase - 1]; }
  get services() { return this.hp.filter(h => h > 0).length; }
  get discovered() { return this.discoveredLinks.size; }
  emit(type, x, y, value = 0) { this.events.push({ type, x, y, value }); }
  log(text, detail = '', severity = 'info') {
    this.feed.unshift({ id: ++this.feedRevision, tick: this.tick, text, detail, severity });
    this.feed = this.feed.slice(0, 24);
  }
  serviceTargets(nodeId) {
    const found = new Set();
    const visit = id => { const node = this.network.map[id]; if (node.tier === 0) found.add(node.index); else node.targets.forEach(visit); };
    visit(nodeId); return [...found].sort().map(i => SERVICE_NAMES[i]);
  }
  activeServices(nodeId) { return this.serviceTargets(nodeId).filter(name => this.hp[SERVICE_NAMES.indexOf(name)] > 0); }
  inspect(action) {
    const aimed = Number.isFinite(action.x), point = aimed ? action : null;
    const candidates = [...this.packets].sort((a, b) => aimed ? distance(a, point) - distance(b, point) :
      THREATS[b.kind].damage * this.activeServices(b.to).length - THREATS[a.kind].damage * this.activeServices(a.to).length || distance(a, { x: 500, y: 500 }) - distance(b, { x: 500, y: 500 }));
    const packet = candidates[0] && (!aimed || distance(candidates[0], point) < 90) ? candidates[0] : null;
    const node = packet ? this.network.map[packet.from] : [...this.network.nodes].filter(n => n.tier > 0)
      .sort((a, b) => distance(a, point || { x: 500, y: 191 }) - distance(b, point || { x: 500, y: 191 }))[0];
    const visibleNodes = new Set([node.id, ...(packet ? [packet.to] : [])]);
    let discovered = 0;
    for (const link of this.network.links) if (link.hidden && visibleNodes.has(link.from.id) && !this.discoveredLinks.has(linkKey(link))) {
      this.discoveredLinks.add(linkKey(link)); discovered++;
      this.log('Hidden dependency discovered', `${link.from.name} → ${link.to.name}`, 'scan');
    }
    const threat = packet ? THREATS[packet.kind] : null;
    this.intelligence = { tick: this.tick, supplier: node.name, tier: node.tier, country: node.country,
      jurisdiction: node.jurisdiction, rating: node.rating, type: threat?.type || 'Leveranciersnode',
      label: threat?.label || 'Node onderzocht', severity: threat?.severity || 'unknown',
      damage: threat?.damage ?? null, services: this.serviceTargets(packet?.to || node.id), activeServices: this.activeServices(packet?.to || node.id), discovered,
      origin: packet ? this.network.map[this.risks.get(packet.root).origin].name : node.name };
    this.log('Intelligence collected', `${node.name} · ${threat?.label || 'afhankelijkheden'}`, 'scan');
  }
  act(action) {
    if (this.finished) return false;
    if (action.type === 'scan') {
      if (this.tick < this.scanReady || this.energy < this.config.scan.cost) return false;
      if ((action.x !== undefined || action.y !== undefined) && (!Number.isFinite(action.x) || !Number.isFinite(action.y) || action.x < 0 || action.x > 1000 || action.y < 0 || action.y > 1000)) return false;
      this.energy -= this.config.scan.cost; this.scanUntil = this.tick + ticks(this.config.scan.durationSeconds); this.scanReady = this.tick + ticks(this.config.scan.cooldownSeconds); this.scans++;
      this.inspect(action); this.emit('scan', 500, 500); return true;
    }
    if (action.type !== 'shot' || !Number.isFinite(action.x) || !Number.isFinite(action.y) || action.x < 0 || action.x > 1000 || action.y < 0 || action.y > 1000 || this.energy < this.config.shot.cost || this.tick - this.lastShot < ticks(this.config.shot.cooldownSeconds)) return false;
    this.energy -= this.config.shot.cost; this.lastShot = this.tick; this.shots++;
    const delay = Math.round(Math.hypot(action.x - 500, action.y - 500) / 1000 * FPS * this.config.shot.travelSeconds);
    this.fields.push({ x: action.x, y: action.y, born: this.tick, start: this.tick + delay, end: this.tick + delay + ticks(this.config.shot.fieldDurationSeconds), radius: 0, hits: 0 });
    this.emit('shot', action.x, action.y); return true;
  }
  spawn(fromId, toId, generation = 0, root = null, kind = 'incident') {
    const from = this.network.map[fromId], to = this.network.map[toId], id = this.id++;
    if (root === null) {
      root = id; this.risks.set(root, { origin: fromId, kind, born: this.tick, split: false, prevented: false });
      this.log(THREATS[kind].feed, `Tier ${from.tier} · ${from.name}`, THREATS[kind].severity);
      if (kind === 'rating') from.rating = Math.max(10, from.rating - 18);
    } else kind = this.risks.get(root).kind;
    this.packets.push({ id, from: fromId, to: toId, kind, x: from.x, y: from.y, p: 0, length: distance(from, to), generation, root, warning: generation === 0 ? ticks(this.wave.warningSeconds) : 0 });
  }
  willBranch(nodeId) {
    const node = this.network.map[nodeId];
    return node.targets.length > 1 || node.targets.some(id => this.willBranch(id));
  }
  intercept(packet, field) {
    field.hits++;
    const threat = THREATS[packet.kind], risk = this.risks.get(packet.root);
    if (threat.damage === 0) {
      this.mistakes++; this.combo = 0; this.score = Math.max(0, this.score - 50);
      this.fx.push({ type: 'mistake', x: packet.x, y: packet.y, born: this.tick, points: -50 });
      this.log('Onnodige onderschepping', 'Laag risico · −50 punten', 'low');
      this.emit('mistake', packet.x, packet.y, -50); return;
    }
    this.intercepted++; this.combo = this.tick - this.lastHit < 150 ? this.combo + 1 : 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo); this.lastHit = this.tick;
    let points = 50 + Math.min(4, this.combo - 1) * 25;
    if (this.tick - risk.born <= 180) points += 25;
    if (this.wave.maxBranches > 1 && !risk.split && !risk.prevented && this.willBranch(packet.to)) {
      risk.prevented = true; this.prevented++; points += 100;
      this.log('Chain reaction prevented', `${threat.label} · +100 bonus`, 'success');
    }
    this.score += points; this.fx.push({ type: 'hit', x: packet.x, y: packet.y, born: this.tick, points });
    this.log('Threat intercepted', `${threat.label} · +${points}`, 'success');
    this.emit('hit', packet.x, packet.y, points);
  }
  update() {
    if (this.finished) return;
    this.events = []; this.tick++; this.energy = Math.min(100, this.energy + this.config.energy.regenerationPerSecond / FPS);
    if (this.tick - this.lastHit > 150) this.combo = 0;
    const wave = this.wave;
    if (this.tick >= this.nextSpawn && this.seconds < this.config.round.durationSeconds - this.config.round.quietEndSeconds) {
      const tier = Number(pickWeighted(wave.tierWeights, this.random));
      const prefix = tier === 3 ? 'o' : tier === 2 ? 'm' : 'i', count = tier === 3 ? 18 : tier === 2 ? 9 : 6;
      const n = this.network.map[prefix + Math.floor(this.random() * count)];
      const kind = pickWeighted(wave.threatWeights, this.random);
      this.spawn(n.id, n.targets[0], 0, null, kind);
      this.nextSpawn = this.tick + ticks(wave.spawnIntervalSeconds) + Math.floor(this.random() * ticks(wave.spawnJitterSeconds));
    }
    this.fields = this.fields.filter(f => f.end > this.tick);
    for (const f of this.fields) { const age = this.tick - f.start; f.radius = age < 0 ? 0 : this.config.shot.fieldRadius * Math.min(1, age / ticks(this.config.shot.growSeconds), (f.end - this.tick) / ticks(this.config.shot.fadeSeconds)); }
    const current = this.packets; this.packets = [];
    for (const p of current) {
      if (p.warning > 0) { p.warning--; this.packets.push(p); continue; }
      const from = this.network.map[p.from], to = this.network.map[p.to], threat = THREATS[p.kind];
      const speed = wave.speed * (this.tick < this.scanUntil ? this.config.scan.speedMultiplier : 1);
      p.p += speed / FPS / p.length;
      p.x = from.x + (to.x - from.x) * Math.min(1, p.p); p.y = from.y + (to.y - from.y) * Math.min(1, p.p);
      const field = this.fields.find(f => f.radius > 0 && distance(f, p) < f.radius + 4);
      if (field) { this.intercept(p, field); continue; }
      if (p.p < 1) { this.packets.push(p); continue; }
      if (to.tier === 0) {
        if (threat.damage === 0) { this.ignored++; this.log('Low-risk signal passed', `${to.name} · geen impact`, 'low'); }
        else if (this.hp[to.index] > 0) {
          const damage = Math.min(this.hp[to.index], threat.damage); this.hp[to.index] -= damage; this.lost++; this.combo = 0;
          this.score = Math.max(0, this.score - 50);
          this.fx.push({ type: 'damage', x: to.x, y: to.y, born: this.tick }); this.emit('damage', to.x, to.y, damage * 25);
          this.log('Critical service impacted', `${to.name} · ${this.hp[to.index] * 25}% · −50 punten`, 'critical');
        }
      } else {
        const targets = to.targets.slice(0, threat.damage > 0 ? wave.maxBranches : 1);
        if (targets.length > 1) {
          this.risks.get(p.root).split = true; this.cascades++; this.emit('cascade', to.x, to.y);
          this.log('Chain reaction', `${to.name} · ${targets.length} afhankelijkheden geraakt`, 'high');
          this.fx.push({ type: 'cascade', x: to.x, y: to.y, born: this.tick });
        }
        for (const next of targets) this.spawn(to.id, next, p.generation + 1, p.root);
      }
    }
    this.fx = this.fx.filter(f => this.tick - f.born < 65);
    if (this.tick >= ticks(this.config.round.durationSeconds) || this.services === 0) {
      this.finished = true; this.bonus = this.services * 200; this.score += this.bonus;
      this.log('Mission complete', `${this.services} van 3 diensten operationeel · +${this.bonus}`, 'info'); this.emit('finish', 500, 500);
    }
  }
}
export function replay(actions, seed = SEED, config = GAME_CONFIG) {
  if (!Array.isArray(actions) || actions.length > 1000) throw new Error('Ongeldige spelacties.');
  const game = new Game(seed, config); let cursor = 0, previous = -1;
  for (const a of actions) {
    if (!a || !Number.isInteger(a.tick) || a.tick < previous || a.tick < 0 || a.tick >= ticks(game.config.round.durationSeconds)) throw new Error('Ongeldige volgorde.');
    previous = a.tick;
  }
  while (!game.finished) {
    while (cursor < actions.length && actions[cursor].tick === game.tick) if (!game.act(actions[cursor++])) throw new Error('Ongeldige spelactie.');
    game.update();
  }
  if (cursor !== actions.length) throw new Error('Acties na einde van de ronde.');
  return game;
}
