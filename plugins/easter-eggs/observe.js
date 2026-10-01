import { createDetector } from './detector.js';

// Installed on a browser instance only when enabled. Never patch Game.prototype.
// The original methods run first; the plugin sees only copied primitive values.
export function observeGame(game, { active, discovered, onUnlock, onError = () => {} }) {
  const original = { act: game.act, update: game.update, intercept: game.intercept };
  const own = Object.fromEntries(Object.keys(original).map(key => [key, Object.getOwnPropertyDescriptor(game, key)]));
  const detector = createDetector({ discovered, onUnlock });
  const firstWaveEnd = game.config.waves[1]?.startsAtSeconds ?? game.config.round.durationSeconds;
  let stopped = false, checkedWave = false, lastIgnored = game.ignored, lastPrevented = game.prevented;
  function detach() {
    if (stopped) return;
    stopped = true;
    for (const key of Object.keys(original)) {
      if (own[key]) Object.defineProperty(game, key, own[key]);
      else delete game[key];
    }
  }
  function safely(callback) {
    if (stopped) return;
    try { if (active()) callback(); }
    catch (error) { detach(); try { onError(error); } catch {} }
  }
  game.act = function (...args) {
    const result = original.act.apply(this, args);
    if (result && args[0]?.type === 'scan') safely(() => detector.scanned(this.intelligence?.tier));
    return result;
  };
  game.intercept = function (packet, field) {
    const before = this.intercepted;
    const born = this.risks.get(packet.root)?.born;
    const result = original.intercept.call(this, packet, field);
    if (this.intercepted > before) safely(() => detector.intercepted({
      scans: this.scans, fast: Number.isFinite(born) && this.tick - born <= 180,
      combo: this.combo, prevented: this.prevented,
    }));
    return result;
  };
  game.update = function (...args) {
    const result = original.update.apply(this, args);
    if ((!checkedWave && this.seconds >= firstWaveEnd) || this.ignored !== lastIgnored || this.prevented !== lastPrevented) {
      safely(() => {
        checkedWave ||= this.seconds >= firstWaveEnd;
        lastIgnored = this.ignored; lastPrevented = this.prevented;
        detector.sample({ seconds: this.seconds, firstWaveEnd, hp: [...this.hp], lost: this.lost,
          ignored: this.ignored, prevented: this.prevented });
      });
    }
    return result;
  };
  return detach;
}
