import { GAME_CONFIG } from './game-config.js';
import { initializeTheme } from './theme.js';
import { createLiveLeaderboard, gameShareUrl } from './leaderboard-live.js';
import { renderMobileShare } from './mobile-share.js';

const $ = id => document.getElementById(id);
const number = new Intl.NumberFormat('nl-NL');
const clock = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
let previous = null, shareUrl = '', shareTimer = null, hasScores = false, sharePending = false, motionPaused = false;
initializeTheme(new URLSearchParams(location.search).get('theme') || GAME_CONFIG.theme, document, 'leaderboard').catch(() => {
  $('display-message').textContent = 'Thema kon niet laden. De standaardweergave blijft beschikbaar.';
});
$('round-duration').textContent = GAME_CONFIG.round.durationSeconds;

async function request(route, signal) {
  const response = await fetch(route, { cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Verbinding niet beschikbaar.');
  return response.json();
}
function element(tag, className, text) {
  const node = document.createElement(tag); node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
// Decorative only: ranking and score text remain separate and still come from the API.
function winnerDecoration(place) {
  const decoration = element('div', 'winner-decoration');
  decoration.setAttribute('aria-hidden', 'true');
  const badge = element('span', 'winner-badge');
  const symbols = [
    '<path d="M9 33 5 14l11 8 8-14 8 14 11-8-4 19Z M10 39h28"/><circle cx="24" cy="6" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="43" cy="12" r="2"/>',
    '<path d="M15 6h18v14a9 9 0 0 1-18 0Z M15 10H7v6a9 9 0 0 0 10 9 M33 10h8v6a9 9 0 0 1-10 9 M24 29v9 M15 42h18 M18 38h12"/>',
    '<path d="m15 5 9 6 9-6 3 13-12 9-12-9Z"/><circle cx="24" cy="32" r="11"/><path d="m24 25 2 4 5 1-3 3 1 5-5-2-5 2 1-5-3-3 5-1Z"/>',
  ];
  badge.innerHTML = '<svg viewBox="0 0 48 48">' + symbols[place - 1] + '</svg>';
  const sparks = element('span', 'winner-sparkles');
  for (let index = 0; index < 4; index++) sparks.append(element('i', '', index % 2 ? '✦' : ''));
  decoration.append(element('span', 'winner-aura'), sparks, badge);
  return decoration;
}
function placeholder(title, description) {
  const node = element('div', 'board-placeholder');
  const mark = element('span', 'orbit-mark', '✦'); mark.setAttribute('aria-hidden', 'true');
  node.append(mark, element('h2', '', title), element('p', '', description));
  $('ranking-board').replaceChildren(node);
}
function drawScores(scores) {
  const signature = JSON.stringify(scores);
  if (signature === previous) return;
  const oldScores = previous ? JSON.parse(previous) : [];
  const old = new Map(oldScores.map(score => [score.id, JSON.stringify(score)]));
  previous = signature; hasScores = true;
  if (!scores.length) {
    placeholder('De eerste plek is nog vrij.', 'Scan de QR-code, bescherm je keten en zet de eerste score neer.');
    $('ranking-announcement').textContent = 'Het leaderboard is nog leeg.';
    return;
  }
  const podium = element('div', 'podium');
  for (let index = 0; index < 3; index++) {
    const score = scores[index], card = element('article', 'podium-card' + (score ? '' : ' is-vacant'));
    card.setAttribute('aria-label', 'Plek ' + (index + 1));
    card.dataset.place = index + 1;
    if (score) card.append(winnerDecoration(index + 1));
    const top = element('div', 'podium-top');
    top.append(element('span', 'podium-rank', '0' + (index + 1)), element('span', 'podium-label', ['Koploper', 'Tweede plek', 'Derde plek'][index]));
    const points = element('div', 'podium-score', score ? number.format(score.score) : '—');
    points.append(element('span', 'score-caption', 'punten'));
    card.append(top, element('h3', 'podium-name', score?.name || 'Jouw naam hier?'), points, element('p', 'service-count', score ? score.services + ' / 3 diensten beschermd' : 'Scan & speel mee'));
    if (score && old.size && (old.get(score.id) !== JSON.stringify(score) || oldScores[index]?.id !== score.id)) card.classList.add('changed');
    podium.append(card);
  }
  const list = element('ol', 'ranking-list'); list.start = 4; list.setAttribute('aria-label', 'Plek 4 tot en met 10');
  scores.slice(3).forEach((score, index) => {
    const row = element('li', 'ranking-row');
    row.append(element('span', 'row-rank', String(index + 4).padStart(2, '0')), element('strong', 'row-name', score.name), element('span', 'row-score', number.format(score.score)), element('span', 'row-services', score.services + ' / 3 diensten'));
    if (old.size && old.get(score.id) !== JSON.stringify(score)) row.classList.add('changed');
    list.append(row);
  });
  $('ranking-board').replaceChildren(podium, ...(scores.length > 3 ? [list] : []));
  $('ranking-announcement').textContent = `Klassement bijgewerkt. ${scores[0].name} staat bovenaan met ${number.format(scores[0].score)} punten.`;
}
function status(state) {
  $('connection').dataset.state = state;
  $('connection-label').textContent = { live: 'Live klassement', connecting: 'Verbinden…', offline: 'Verbinding verbroken' }[state];
  if (state === 'live') {
    $('last-checked').textContent = 'Gecontroleerd om ' + clock.format(new Date());
    $('display-message').textContent = 'Scores worden automatisch bijgewerkt.';
  } else if (state === 'offline') {
    $('display-message').textContent = hasScores ? 'Laatste scores blijven staan. We proberen opnieuw te verbinden.' : 'We proberen opnieuw te verbinden.';
    if (!hasScores) placeholder('Even geen verbinding.', 'Het klassement verschijnt vanzelf zodra de verbinding terug is.');
  }
}
const live = createLiveLeaderboard({ load: async signal => (await request('/api/leaderboard', signal)).scores, onScores: drawScores, onStatus: status });

async function refreshShare() {
  if (document.hidden || sharePending) return;
  sharePending = true;
  let retry = false;
  try {
    const meta = await request('/api/meta');
    shareUrl = gameShareUrl(meta, location.href);
    await renderMobileShare(shareUrl);
    $('qr-placeholder').hidden = !$('mobile-qr').hidden;
    $('qr-placeholder').textContent = shareUrl ? 'Gebruik het gameadres hieronder.' : 'Geen wifi-adres beschikbaar';
    $('mobile-availability').textContent = meta.hosting === 'sites' ? 'Iedere telefoon speelt een eigen ronde. De scores komen hier samen.' : 'Gebruik hetzelfde wifi-netwerk als deze Mac. De Mac en gameserver moeten aan blijven.';
    retry = !shareUrl || $('mobile-qr').hidden;
  } catch {
    retry = true;
    if (!shareUrl) {
      $('mobile-qr-hint').textContent = 'Gameadres even niet bereikbaar. We proberen opnieuw.';
      $('qr-placeholder').textContent = 'Gameadres wordt opgehaald…';
    }
  } finally {
    sharePending = false;
    clearTimeout(shareTimer);
    if (retry && !document.hidden) shareTimer = setTimeout(refreshShare, 15000);
  }
}
$('copy-url').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(shareUrl); $('copy-url').textContent = 'Adres gekopieerd'; }
  catch { $('copy-url').textContent = 'Selecteer het adres hierboven'; }
});
$('winner-motion').addEventListener('click', () => {
  motionPaused = !motionPaused;
  const button = $('winner-motion'), label = motionPaused ? 'Animaties hervatten' : 'Animaties pauzeren';
  button.setAttribute('aria-pressed', motionPaused); button.setAttribute('aria-label', label); button.title = label; button.textContent = motionPaused ? '✦' : 'Ⅱ';
  document.body.dataset.motionPaused = String(motionPaused || document.hidden);
});
$('display-fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { $('display-message').textContent = 'Gebruik de volledig-schermfunctie van je browser.'; }
});
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Verlaat volledig scherm' : 'Volledig scherm';
  $('display-fullscreen').setAttribute('aria-label', label); $('display-fullscreen').title = label;
});
function resume() { if (!document.hidden) { document.body.dataset.motionPaused = String(motionPaused); live.start(); live.refresh(); clearTimeout(shareTimer); void refreshShare(); } }
function pause() { document.body.dataset.motionPaused = 'true'; live.stop(); clearTimeout(shareTimer); }
document.addEventListener('visibilitychange', () => document.hidden ? pause() : resume());
window.addEventListener('online', resume);
window.addEventListener('offline', () => { pause(); status('offline'); });
window.addEventListener('pagehide', pause);
window.addEventListener('pageshow', resume);
resume();
