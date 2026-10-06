// One request at a time; pause hidden displays and keep the last good scores on failure.
export function createLiveLeaderboard({ load, onScores, onStatus, onUpdate = () => {}, visible = () => !document.hidden,
  setTimer = setTimeout, clearTimer = clearTimeout, interval = 2000, retry = 5000 }) {
  let active = false, generation = 0, timer = null, pending = false, controller;
  function schedule(delay) { clearTimer(timer); timer = active && visible() ? setTimer(update, delay) : null; }
  async function update() {
    if (!active || !visible() || pending) return;
    const run = generation;
    pending = true;
    controller = new AbortController();
    let delay = interval;
    try {
      const data = await load(controller.signal);
      const scores = Array.isArray(data) ? data : data?.scores;
      if (!active || run !== generation) return;
      if (!Array.isArray(scores)) throw new Error('Ongeldig klassement.');
      onScores(scores.slice(0, 10)); onUpdate(data); onStatus('live');
    } catch {
      if (!active || run !== generation) return;
      onStatus('offline'); delay = retry;
    } finally {
      if (run === generation) { pending = false; schedule(delay); }
    }
  }
  return {
    start() { if (active) return; active = true; generation++; pending = false; onStatus('connecting'); void update(); },
    stop() { active = false; generation++; clearTimer(timer); timer = null; controller?.abort(); pending = false; },
    refresh() { if (!pending) { clearTimer(timer); timer = null; void update(); } },
  };
}

export function gameShareUrl(meta, currentUrl) {
  const current = new URL(currentUrl);
  const loopback = host => host === 'localhost' || /^127\./.test(host) || host === '[::1]';
  if (meta?.hosting === 'sites' || !loopback(current.hostname)) return current.origin + '/';
  for (const address of meta?.mobileUrls || []) {
    try {
      const candidate = new URL(address);
      if (['http:', 'https:'].includes(candidate.protocol) && !candidate.username && !candidate.password && !loopback(candidate.hostname)) return candidate.origin + '/';
    } catch { /* Ignore an unavailable interface. */ }
  }
  return '';
}
