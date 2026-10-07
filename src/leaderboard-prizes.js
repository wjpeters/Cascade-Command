import { PRIZE_CONFIG } from './prize-config.js';
const $ = id => document.getElementById(id);
function node(tag, className, text) {
  const item = document.createElement(tag); item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}
function prizeRow(prize, label) {
  const row = node('li', 'prize-row'), picture = node('div', 'prize-picture'), image = node('img', '');
  image.src = prize.image; image.alt = ''; image.width = 80; image.height = 80; image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => { picture.replaceChildren(node('span', '', '✦')); }, { once: true });
  picture.append(image);
  const copy = node('div', 'prize-copy'); copy.append(node('span', 'prize-place', label), node('h3', '', prize.title), node('p', '', prize.description));
  row.append(picture, copy); return row;
}
export function initializePrizes() {
  $('prize-demo-label').hidden = !PRIZE_CONFIG.demo;
  $('podium-prizes').replaceChildren(...PRIZE_CONFIG.prizes.podium.map((prize, index) => prizeRow(prize, 'Plek ' + (index + 1))));
  const consolation = prizeRow(PRIZE_CONFIG.prizes.consolation, 'Dagelijkse troostprijs');
  $('consolation-prize').replaceChildren(...consolation.childNodes);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let back = false, paused = false, timer, lastWinner = '';
  function schedule() {
    clearTimeout(timer);
    if (paused || document.hidden || reduced.matches || !PRIZE_CONFIG.flipIntervalSeconds) return;
    timer = setTimeout(() => {
      if (!$('mission-front').contains(document.activeElement) && !$('mission-back').contains(document.activeElement)) flip();
      else schedule();
    }, PRIZE_CONFIG.flipIntervalSeconds * 1000);
  }
  function flip() {
    back = !back; $('mission-rotor').classList.toggle('shows-prizes', back);
    for (const [id, hidden] of [['mission-front', back], ['mission-back', !back]]) { $(id).inert = hidden; $(id).setAttribute('aria-hidden', String(hidden)); }
    $('flip-mission').textContent = back ? 'Toon de QR-code ↻' : 'Bekijk de prijzen ↻';
    schedule();
  }
  $('flip-mission').addEventListener('click', flip);
  reduced.addEventListener('change', schedule);
  schedule();
  return {
    pause(value) { paused = value; schedule(); },
    update(data) {
      const enabled=data?.enabled!==false;
      $('consolation-prize').hidden=!enabled;$('consolation-winner').hidden=!enabled;$('draw-rules').hidden=!enabled;
      $('prize-description').textContent=enabled?'Een prijs voor de top 3. Iedere dag een extra kans.':'Een prijs voor de top 3.';
      const winner = data?.winner, signature = JSON.stringify(winner || null);
      if (signature === lastWinner) return;
      lastWinner = signature;
      if (!winner) {
        $('draw-heading').textContent = 'Iedere dag een troostprijs';
        $('draw-winner').textContent = 'Ook buiten de top 3 maak je kans. De trekking volgt in beheer.';
        $('consolation-winner').classList.remove('has-winner'); return;
      }
      const day = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(winner.day + 'T12:00:00Z'));
      $('draw-heading').textContent = 'Troostprijs · ' + day;
      $('draw-winner').replaceChildren(node('strong', '', winner.name), document.createTextNode(' wint ' + winner.prize.title + '!'));
      $('consolation-winner').classList.add('has-winner');
    },
  };
}
