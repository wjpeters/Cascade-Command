import { animateScene } from './experience.js';
import { GAME_CONFIG, SERVICE_NAMES } from '../../engine.js';

const mobileQuery = '(max-width: 760px), (max-width: 1000px) and (max-height: 500px)';
const glyphs = {
  galaxy: '<path d="M12 2 21 7v10l-9 5-9-5V7Z M12 7l4 2.5v5L12 17l-4-2.5v-5Z"/>',
  intel: '<path d="M4 20V10m5 10V4m6 16V8m5 12V2"/>',
  feed: '<path d="M4 5h16M4 12h16M4 19h10"/>',
  ranking: '<path d="M8 3h8v7c0 4-8 4-8 0Z M8 5H3v3c0 4 5 4 5 4 M16 5h5v3c0 4-5 4-5 4 M12 14v6m-4 1h8"/>',
  menu: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${glyphs[name]}</svg>`;
let ui;
let revealScan = () => {};
export function showMobileScan() { revealScan(); }
export function prepareLaunch() { return ui?.prepareLaunch?.(); }

export function mountMobile(document) {
  const $ = id => document.getElementById(id);
  const column = document.querySelector('.game-column');
  const panel = document.createElement('dialog');
  panel.id = 'rs-mobile-panel';
  panel.className = 'rs-mobile-sheet';
  panel.setAttribute('aria-labelledby', 'rs-mobile-panel-title');
  panel.innerHTML = '<div class="rs-sheet-handle" aria-hidden="true"></div><header class="rs-sheet-heading"><div><span id="rs-mobile-panel-state"></span><h2 id="rs-mobile-panel-title"></h2></div><button class="icon-button" id="rs-mobile-close" aria-label="Sluit paneel en keer terug">×</button></header><div class="rs-sheet-content" id="rs-mobile-content"></div><footer class="rs-sheet-actions"><button class="inspect-button" id="rs-mobile-target">Gericht scannen <span>⌖</span></button><button class="primary" id="rs-mobile-done">Terug naar de missie <span>→</span></button></footer>';
  document.body.append(panel);
  const title = document.createElement('div');
  title.className = 'rs-mobile-title rs-mobile-only';
  title.innerHTML = '<h1>Cascade Command</h1><span id="rs-mobile-wave"></span>';
  const welcome = document.createElement('div');
  welcome.className = 'rs-mobile-welcome rs-mobile-only';
  welcome.innerHTML = '<span>Jouw keten. Jouw missie.</span><h2>Bescherm wat<br>belangrijk is.</h2><p>Risico’s reizen door je leveranciersketen.<br>Houd drie kritieke diensten overeind.</p>';
  const services = document.createElement('section');
  services.className = 'rs-mobile-services rs-mobile-only';
  services.setAttribute('aria-label', 'Weerbaarheid kritieke diensten');
  services.innerHTML = SERVICE_NAMES.map((name, i) => `<div class="rs-compact-service" id="rs-compact-${i}" aria-label="${name}"><span><b>${'ABC'[i]}</b><span>${name}</span></span><div><div role="progressbar" id="rs-compact-meter-${i}" aria-label="Weerbaarheid ${name}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i></i></div><strong id="rs-compact-health-${i}">100%</strong></div></div>`).join('');
  const feed = document.createElement('button');
  feed.id = 'rs-mobile-latest'; feed.className = 'rs-mobile-latest rs-mobile-only';
  feed.innerHTML = `${icon('feed')}<span><strong id="rs-latest-title">Wacht op het eerste signaal</strong><small id="rs-latest-detail">Signalen en dienstimpact uit de keten</small></span><span aria-hidden="true">›</span>`;
  const nav = document.createElement('nav');
  nav.className = 'rs-mobile-nav rs-mobile-only'; nav.setAttribute('aria-label', 'Missiepanelen');
  nav.innerHTML = ['galaxy', 'intel', 'feed', 'ranking'].map((name, i) => `<button type="button" data-mobile-panel="${name}" ${i === 0 ? 'aria-current="page"' : ''}>${icon(name)}<span>${['Galaxy', 'Intel', 'Feed', 'Ranking'][i]}</span></button>`).join('');
  column.prepend(welcome, title);
  document.querySelector('.hud').after(services);
  document.querySelector('.control-rail').before(feed);
  column.append(nav);
  const explore = document.createElement('span'); explore.className = 'rs-mobile-explore rs-mobile-only';
  explore.innerHTML = `${icon('galaxy')}Explore`;
  const menu = document.createElement('button'); menu.id = 'rs-mobile-menu'; menu.className = 'icon-button rs-mobile-only';
  menu.setAttribute('aria-label', 'Missiemenu'); menu.innerHTML = icon('menu');
  document.querySelector('.header-actions').append(menu);
  document.querySelector('.brand').after(explore);
  const scanText = document.createElement('span'); scanText.className = 'rs-scan-label';
  scanText.append($('scan-text'));
  const scanNote = document.createElement('small'); scanNote.id = 'rs-scan-note'; scanNote.className = 'rs-mobile-only';
  scanNote.textContent = 'Urgentste risico'; scanText.append(scanNote); $('scan').append(scanText);
  const hand = document.createElement('button'); hand.id = 'rs-mobile-hand'; hand.className = 'inspect-button';
  hand.type = 'button'; hand.setAttribute('aria-pressed', 'false');
  const menuContent = document.createElement('section'); menuContent.className = 'rs-mobile-menu-content';
  menuContent.innerHTML = '<p>Speluitleg, geluid en bediening.</p><div class="rs-mobile-menu-actions"></div><button class="inspect-button" id="rs-mobile-menu-ranking">Bekijk leaderboard <span>→</span></button><a href="/privacy.html" target="_blank" rel="noopener">Over spelgegevens ↗</a>';
  menuContent.append(hand);
  const menuStore = document.createElement('div'); menuStore.hidden = true; menuStore.append(menuContent); document.body.append(menuStore);
  const moves = new Map();
  function move(element, destination) {
    if (!moves.has(element)) { const marker = document.createComment('mobile return slot'); element.before(marker); moves.set(element, marker); }
    destination.append(element);
  }
  function restore(element) { const marker = moves.get(element); if (marker) { marker.after(element); marker.remove(); moves.delete(element); } }
  const menuItems = ['help', 'sound', 'fullscreen', 'watch-demo'];
  const instructions = [...$('intro').querySelectorAll('.instructions li')];
  const originalInstructions = instructions.map(item => item.lastChild.nodeValue);
  const mobileInstructions = ['Tik vóór dreigingen om ze te stoppen.', 'Laat grijze LOW-signalen passeren.', 'Scan voor risico’s en verborgen relaties.'];
  let closePanel = () => {};
  const mq = matchMedia(mobileQuery);
  const applyLayout = () => {
    closePanel(); document.body.classList.toggle('rs-mobile', mq.matches);
    instructions.forEach((item, i) => { item.lastChild.nodeValue = mq.matches ? mobileInstructions[i] : originalInstructions[i]; });
    if (mq.matches) {
      move($('intro'), column); move($('result'), column); move($('pause-panel'), column);
      menuItems.forEach(id => move($(id), menuContent.querySelector('.rs-mobile-menu-actions')));
    } else {
      for (const element of [...moves.keys()]) restore(element);
    }
  };
  ui = { document, $, panel, mq, services, feed, nav, menuContent, menuStore, moves, move, restore, setCloser: close => { closePanel = close; } };
  mq.addEventListener('change', applyLayout); applyLayout();
}

export function connectMobile({ game, renderer, requestFrame, state, pause, resume, setTargeting }) {
  const { document, $, panel, mq, nav, menuContent, move, restore } = ui;
  let closing = null, closeRevision = 0, navMode = null, opening = false;
  let kind = null, wasPlaying = false, ownerFocus = null, lastState = state(), handLeft = false;
  try { handLeft = localStorage.getItem('cascade.scan-hand') === 'left'; } catch {}
  function setHand() {
    document.body.classList.toggle('rs-left-hand', handLeft);
    $('rs-mobile-hand').textContent = `Scanknop: ${handLeft ? 'links' : 'rechts'} · wisselen`;
    $('rs-mobile-hand').setAttribute('aria-pressed', String(handLeft));
  }
  setHand(); $('rs-mobile-hand').addEventListener('click', () => { handLeft = !handLeft; setHand(); try { localStorage.setItem('cascade.scan-hand', handLeft ? 'left' : 'right'); } catch {} });
  function restoreContent() { for (const element of [document.querySelector('.rs-summary'), $('intel-card'), $('feed-panel'), $('board-panel')]) if ($('rs-mobile-content').contains(element)) restore(element); if ($('rs-mobile-content').contains(menuContent)) ui.menuStore.append(menuContent); }
  function close(continueMission = true, immediate = false) {
    if (!panel.open) return Promise.resolve();
    if (closing && !immediate) return closing;
    const revision = ++closeRevision;
    const shouldResume = wasPlaying && continueMission && !document.hidden && state() === 'paused';
    const finish = () => {
      if (revision !== closeRevision) return;
      wasPlaying = false; kind = null; panel.close(); restoreContent();
      document.body.classList.remove('rs-sheet-open');
      for (const button of nav.querySelectorAll('button')) { button.removeAttribute('aria-current'); if (button.dataset.mobilePanel === 'galaxy') button.setAttribute('aria-current', 'page'); }
      if (shouldResume) resume();
      else if (ownerFocus?.isConnected && !ownerFocus.closest('[hidden]')) ownerFocus.focus({ preventScroll: true });
      ownerFocus = null; requestFrame();
    };
    if (immediate) { panel.getAnimations().forEach(animation => animation.cancel()); finish(); closing = null; return Promise.resolve(); }
    closing = (async () => {
      await animateScene(panel, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(28px)' }], 180);
      finish(); if (revision === closeRevision) closing = null;
    })();
    return closing;
  }
  ui.setCloser(() => close(true, true));
  ui.prepareLaunch = () => close(false, true);
  async function open(next) {
    if (!mq.matches || opening) return;
    opening = true;
    try {
    const continuing = panel.open && wasPlaying;
    if (panel.open) await close(false);
    if (!mq.matches) return;
    ownerFocus = document.activeElement;
    wasPlaying = continuing || state() === 'playing';
    if (state() === 'playing') pause();
    kind = next;
    const content = $('rs-mobile-content'); content.replaceChildren();
    $('rs-mobile-panel-title').textContent = { intel: 'Overzicht veerkracht', scan: 'Leveranciersintelligence', feed: 'Live Risk Feed', ranking: 'Leaderboard', menu: 'Missiemenu', briefing: 'Missiebriefing' }[kind];
    $('rs-mobile-panel-state').textContent = state() === 'paused' ? 'Ⅱ  Missie gepauzeerd' : 'Cascade Command';
    $('rs-mobile-done').textContent = wasPlaying ? 'Terug naar de missie →' : state() === 'intro' ? 'Klaar voor de missie →' : 'Sluiten';
    if (kind === 'intel') { move(document.querySelector('.rs-summary'), content); move($('intel-card'), content); }
    if (kind === 'feed') move($('feed-panel'), content);
    if (kind === 'ranking') move($('board-panel'), content);
    if (kind === 'menu') content.append(menuContent);
    if (kind === 'briefing') {
      const lead = document.createElement('p'); lead.className = 'cc-briefing-intro';
      lead.textContent = 'Tik vóór een dreiging om een beschermingsveld te plaatsen. Laat grijze LOW-signalen passeren. Scan voor de ernst en verborgen afhankelijkheden.';
      const metrics = document.createElement('div'); metrics.className = 'cc-briefing-metrics';
      metrics.innerHTML = `<span>${GAME_CONFIG.round.durationSeconds} seconden</span><span>Veld ${GAME_CONFIG.shot.cost}</span><span>Scan ${GAME_CONFIG.scan.cost}</span>`;
      const categories = document.createElement('div'); categories.className = 'category-list';
      categories.append(...[...$('category-list').children].map(child => child.cloneNode(true)));
      const rules = document.createElement('button'); rules.type = 'button'; rules.className = 'cc-rules-link'; rules.textContent = 'Volledige speluitleg & puntentelling';
      rules.addEventListener('click', () => $('intro-help').click());
      content.append(lead, metrics, categories, rules);
    }
    if (kind === 'scan') {
      content.append(...[...$('intel-details').children].map(child => child.cloneNode(true)));
      const note = document.createElement('p'); note.className = 'rs-scan-snapshot';
      note.textContent = 'Momentopname van je scan. Nieuwe intelligence vraagt een nieuwe scan.'; content.append(note);
    }
    $('rs-mobile-target').hidden = kind !== 'intel';
    $('rs-mobile-target').disabled = !wasPlaying || game().energy < GAME_CONFIG.scan.cost || game().tick < game().scanReady;
    document.body.classList.add('rs-sheet-open');
    for (const button of nav.querySelectorAll('button')) {
      button.removeAttribute('aria-current'); if (button.dataset.mobilePanel === kind) button.setAttribute('aria-current', 'page');
    }
    panel.showModal(); content.scrollTop = 0; $('rs-mobile-close').focus({ preventScroll: true });
    void animateScene(panel, [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }], 230);
    } finally { opening = false; }
  }
  $('rs-mobile-close').addEventListener('click', () => close()); $('rs-mobile-done').addEventListener('click', () => close());
  panel.addEventListener('cancel', event => { event.preventDefault(); close(); });
  panel.addEventListener('click', event => { if (event.target === panel) { const r = panel.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close(); } });
  $('rs-mobile-menu').addEventListener('click', () => open('menu'));
  $('rs-mobile-latest').addEventListener('click', () => open('feed'));
  $('rs-mobile-menu-ranking').addEventListener('click', () => open('ranking'));
  for (const button of nav.querySelectorAll('button')) button.addEventListener('click', async () => { if (button.dataset.mobilePanel === 'galaxy') { await close(); if (state() === 'result') $('result-home').click(); } else void open(button.dataset.mobilePanel); });
  $('rs-mobile-target').addEventListener('click', async () => { await close(); if (state() === 'playing') { setTargeting(true); $('game').focus({ preventScroll: true }); requestFrame(); } });
  for (const id of ['intel-more', 'scan-peek']) $(id).addEventListener('click', event => { if (mq.matches && game().intelligence) { event.stopImmediatePropagation(); open('scan'); } }, true);
  for (const id of ['help', 'watch-demo', 'intro-help']) $(id).addEventListener('click', () => { if (panel.open) { const returnToMission = wasPlaying; close(false, true); if (id !== 'watch-demo' && returnToMission) $('rules-dialog').addEventListener('close', () => { if (!document.hidden && state() === 'paused') resume(); }, { once: true }); } }, true);
  function openScan() { if (mq.matches && game().intelligence?.tick === game().tick && state() === 'playing') open('scan'); }
  revealScan = openScan;
  function syncNavigation() {
    const lobby = state() === 'intro' || state() === 'result';
    const mode = lobby ? 'lobby' : 'mission'; if (navMode === mode) return; navMode = mode;
    const items = lobby ? [['galaxy', 'Missie', 'galaxy'], ['briefing', 'Uitleg', 'intel'], ['ranking', 'Ranking', 'ranking'], ['menu', 'Menu', 'menu']] : [['galaxy', 'Galaxy', 'galaxy'], ['intel', 'Intel', 'intel'], ['feed', 'Feed', 'feed'], ['ranking', 'Ranking', 'ranking']];
    for (const [index, button] of [...nav.querySelectorAll('button')].entries()) { const [panelName, label, glyph] = items[index]; button.dataset.mobilePanel = panelName; button.innerHTML = icon(glyph) + `<span>${label}</span>`; button.removeAttribute('aria-current'); if (index === 0) button.setAttribute('aria-current', 'page'); }
  }
  function update() {
    syncNavigation();
    const current = game();
    current.hp.forEach((hp, i) => {
      const health = hp * 25, row = $('rs-compact-' + i), meter = $('rs-compact-meter-' + i);
      meter.setAttribute('aria-valuenow', String(health)); meter.firstElementChild.style.width = health + '%';
      $('rs-compact-health-' + i).textContent = health + '%'; row.classList.toggle('warning', health > 0 && health <= 50); row.classList.toggle('down', health === 0);
    });
    $('rs-mobile-wave').textContent = state() === 'intro' ? `${GAME_CONFIG.round.durationSeconds} seconden` : `Golf ${current.phase} / ${GAME_CONFIG.waves.length}`;
    $('rs-scan-note').textContent = renderer.targeting ? 'Kies een leverancier' : current.tick < current.scanReady ? 'Scan herlaadt' : 'Urgentste risico';
    const latest = current.feed[0];
    $('rs-latest-title').textContent = latest?.text || 'Wacht op het eerste signaal';
    $('rs-latest-detail').textContent = latest?.detail || 'Signalen en dienstimpact uit de keten';
    $('rs-mobile-latest').classList.toggle('critical', latest?.severity === 'critical');
    if (lastState !== state()) { lastState = state(); if (state() === 'intro' || state() === 'result' || state() === 'demo') void close(false, true); }
  }
  const observer = new MutationObserver(update);
  observer.observe($('service-list'), { subtree: true, attributes: true, attributeFilter: ['aria-valuenow'] });
  observer.observe($('risk-feed'), { childList: true });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-state'] });
  observer.observe($('target-scan'), { attributes: true, attributeFilter: ['aria-pressed'] });
  addEventListener('pagehide', () => observer.disconnect(), { once: true }); update();
}
