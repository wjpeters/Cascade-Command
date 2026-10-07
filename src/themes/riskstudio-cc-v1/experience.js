import { GAME_CONFIG } from '../../engine.js';

const mobileQuery = '(max-width: 760px), (max-width: 1000px) and (max-height: 500px)';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let experience;

export async function animateScene(element, frames, duration = 220) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden || !element.animate) return;
  const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
  await Promise.race([animation.finished.catch(() => {}), wait(duration + 120)]);
  animation.cancel();
}

function orbit() {
  return '<div class="cc-orbit" aria-hidden="true"><i></i><i></i><i></i><span class="cc-core"><svg viewBox="0 0 80 80"><path d="M40 6 70 23v34L40 74 10 57V23Z" fill="#f58824"/><path d="M40 21v22m0 0L23 53m17-10 17 10" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/></svg></span><b class="cc-satellite cc-satellite-a"></b><b class="cc-satellite cc-satellite-b"></b><b class="cc-satellite cc-satellite-c"></b></div>';
}

export function mountExperience(document) {
  const mq = matchMedia(mobileQuery), reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.body.classList.add('cc-experience');
  const boot = document.createElement('dialog'); boot.id = 'cc-boot'; boot.className = 'cc-scene';
  boot.setAttribute('aria-labelledby', 'cc-boot-title');
  boot.innerHTML = '<div class="cc-scene-brand"><img src="/assets/riskstudio-app-logo.077fe3765b62.webp" alt="RiskStudio"></div>' + orbit() + '<div class="cc-scene-copy"><span class="cc-eyebrow">RiskStudio presents</span><h1 id="cc-boot-title" tabindex="-1">Cascade<br><span>Command</span></h1><p>Ontdek de keten.<br>Bescherm wat belangrijk is.</p></div><div class="cc-boot-status"><div class="cc-boot-caption"><span id="cc-boot-label" role="status">Je missie wordt klaargezet</span><b id="cc-boot-percent">0%</b></div><div class="cc-load-track" role="progressbar" aria-label="Spel gereedmaken" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><p>Fictief scenario · echte ketenprincipes</p></div><button class="cc-scene-skip" type="button">Naar de missie →</button>';
  const launch = document.createElement('dialog'); launch.id = 'cc-launch'; launch.className = 'cc-scene cc-launch';
  launch.setAttribute('aria-labelledby', 'cc-launch-title');
  launch.innerHTML = '<div class="cc-scene-brand"><img src="/assets/riskstudio-app-logo.077fe3765b62.webp" alt="RiskStudio"></div>' + orbit() + '<div class="cc-scene-copy"><span class="cc-eyebrow">Mission briefing</span><h2 id="cc-launch-title" tabindex="-1">Keten gereed.</h2><p>Jouw drie diensten rekenen op je.</p></div><div class="cc-countdown" aria-live="off"><strong id="cc-countdown-number">3</strong><span id="cc-countdown-label">Richt vooruit. Bescherm de keten.</span></div><p class="cc-launch-status" role="status">De missie start zo. Je speeltijd begint daarna.</p><button class="cc-scene-skip" type="button">Start meteen →</button>';
  document.body.append(boot, launch);
  const startTime = performance.now();
  let bootComplete = false, bootTask = null, forceBoot = false, launchRelease = null, bootRelease;
  const bootSkip = new Promise(resolve => { bootRelease = resolve; });
  function syncProgress() {
    const state = document.body.dataset.assets;
    const text = document.getElementById('asset-status').textContent;
    const progress = text.match(/(\d+)\/(\d+)/);
    const percent = state === 'ready' ? 100 : progress ? Math.round(Number(progress[1]) / Number(progress[2]) * 100) : 0;
    boot.querySelector('[role=progressbar]').setAttribute('aria-valuenow', String(percent));
    boot.querySelector('.cc-load-track i').style.width = percent + '%';
    document.getElementById('cc-boot-percent').textContent = percent + '%';
    document.getElementById('cc-boot-label').textContent = state === 'ready' ? 'Je missie is gereed' : state === 'error' ? 'Laden vraagt nog een poging' : progress ? 'Spelbeelden laden' : 'Je missie wordt klaargezet';
    if (state === 'ready' || state === 'error') void finishBoot(state === 'error');
  }
  function finishBoot(immediate = false) {
    if (immediate) { forceBoot = true; bootRelease(); }
    if (bootComplete) return Promise.resolve();
    if (bootTask) return bootTask;
    bootTask = (async () => {
      if (!forceBoot && !reduced.matches && !document.hidden) await Promise.race([wait(Math.max(0, 1050 - (performance.now() - startTime))), bootSkip]);
      if (boot.open && !forceBoot) await animateScene(boot, [{ opacity: 1 }, { opacity: 0, transform: 'scale(1.025)' }], 220);
      boot.close(); bootComplete = true; document.body.dataset.ccBoot = 'complete';
      document.getElementById('start').focus({ preventScroll: true });
      observer.disconnect(); clearTimeout(fallback);
    })();
    return bootTask;
  }
  const observer = new MutationObserver(syncProgress);
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-assets'] });
  observer.observe(document.getElementById('asset-status'), { childList: true, subtree: true, characterData: true });
  const fallback = setTimeout(() => { void finishBoot(true); }, 6500);
  boot.querySelector('button').addEventListener('click', () => { void finishBoot(true); });
  boot.addEventListener('cancel', event => { event.preventDefault(); void finishBoot(true); });
  launch.querySelector('button').addEventListener('click', () => launchRelease?.());
  launch.addEventListener('cancel', event => { event.preventDefault(); launchRelease?.(); });
  if (mq.matches) { boot.showModal(); document.getElementById('cc-boot-title').focus({ preventScroll: true }); } else void finishBoot(true);
  experience = { document, mq, reduced, boot, launch, finishBoot, setRelease: release => { launchRelease = release; } };
  syncProgress();
}

export async function beforeStart() {
  const { document, mq, reduced, launch, finishBoot } = experience;
  if (!mq.matches) return;
  await finishBoot(true);
  let skipped = false;
  const skip = new Promise(resolve => experience.setRelease(() => { skipped = true; resolve(); }));
  launch.showModal(); document.getElementById('cc-launch-title').focus({ preventScroll: true });
  document.getElementById('cc-countdown-number').textContent = '3';
  document.getElementById('cc-countdown-label').textContent = 'Richt vooruit. Bescherm de keten.';
  try {
    if (!reduced.matches && !document.hidden) {
      for (const number of ['3', '2', '1']) {
        if (skipped || document.hidden) break;
        const label = document.getElementById('cc-countdown-number'); label.textContent = number;
        void animateScene(label, [{ opacity: 0, transform: 'scale(.78)' }, { opacity: 1, transform: 'scale(1)' }], 180);
        await Promise.race([wait(390), skip]);
      }
      if (!skipped && !document.hidden) {
        document.getElementById('cc-countdown-number').textContent = 'GO';
        document.getElementById('cc-countdown-label').textContent = 'Bescherm wat belangrijk is.';
        await Promise.race([wait(180), skip]);
      }
      await animateScene(launch, [{ opacity: 1 }, { opacity: 0 }], 150);
    }
  } finally { launch.close(); experience.setRelease(null); }
}

export function connectExperience({ state, game }) {
  const { document } = experience;
  const welcome = document.querySelector('.rs-mobile-welcome');
  welcome.innerHTML = `<span>RiskStudio · Command Center</span><h2>Cascade<br>Command</h2><p>${GAME_CONFIG.round.durationSeconds} seconden. Drie kritieke diensten.<br>Ontdek de keten. Bescherm wat belangrijk is.</p>`;
  const lobbyStamp = document.createElement('div'); lobbyStamp.className = 'cc-lobby-stamp';
  lobbyStamp.innerHTML = `<span><b>${GAME_CONFIG.round.durationSeconds}</b> seconden</span><span><b>3</b> diensten</span><span><b>1</b> keten</span>`;
  document.querySelector('.arena').append(lobbyStamp);
  const previous = [100, 100, 100];
  const observer = new MutationObserver(() => {
    for (let i = 0; i < 3; i++) {
      const value = Number(document.getElementById('hp-' + i).getAttribute('aria-valuenow'));
      if (value < previous[i] && state() === 'playing') {
        const row = document.getElementById('rs-compact-' + i);
        void animateScene(row, [{ transform: 'translateX(0)' }, { transform: 'translateX(-2px)', offset: .3 }, { transform: 'translateX(2px)', offset: .6 }, { transform: 'translateX(0)' }], 190);
      }
      previous[i] = value;
    }
    if (state() === 'result') { const protectedServices = game().services; document.body.dataset.ccOutcome = protectedServices === 3 ? 'protected' : protectedServices === 0 ? 'broken' : 'partial'; document.querySelector('.result-orbit').textContent = protectedServices === 3 ? '✓' : protectedServices === 0 ? '!' : '✦'; }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-state'] });
  observer.observe(document.getElementById('service-list'), { subtree: true, attributes: true, attributeFilter: ['aria-valuenow'] });
  addEventListener('pagehide', () => observer.disconnect(), { once: true });
}
