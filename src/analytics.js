// In-memory page ID only: no analytics cookies or persistent browser identifier.
export function analyticsContext() { return { referrer: document.referrer, width: window.innerWidth }; }
export function recordVisit() {
  try {
  const bytes = crypto.getRandomValues(new Uint8Array(16)); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  const id = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  fetch('/api/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, analytics: analyticsContext() }) }).catch(() => {});
  } catch { /* Analytics must never stop the game, including on local HTTP. */ }
}
export function recordFinish(session, actions) {
  if (!session) return;
  // Finish is separate from opting into the public leaderboard. Replay is verified server-side.
  fetch('/api/finish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session: session.id, actions }) }).catch(() => {});
}
