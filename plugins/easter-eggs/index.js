import { CARDS, STORAGE_KEY } from './cards.js';
import { PORTRAITS } from './portraits.js';
import { observeGame } from './observe.js';

export function mount(host) {
  const abort = new AbortController(), { signal } = abort;
  const discovered = new Set();
  const ids = new Set(CARDS.map(card => card.id));
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(saved)) for (const id of saved) if (ids.has(id)) discovered.add(id);
  } catch {}
  let stopped = false, detachGame = () => {}, flushTimer = null, hideTimer = null, holdTimer = null;
  let helpCount = 0, timeTaps = 0, holdStart = null, pending = [], roundFinds = [];
  let detailId = null, celebration = false, introReveal = null;
  const style = document.createElement('link');
  style.rel = 'stylesheet'; style.href = host.theme?.pluginStylesheet || '/plugins/easter-eggs/plugin.css';
  const root = document.createElement('div'); root.className = 'ee-plugin';
  root.innerHTML = `<button class="ee-launcher" aria-label="Galactic Council" title="Galactic Council" type="button"><span aria-hidden="true">✦</span><span class="ee-count"></span></button>
    <aside class="ee-cameo" hidden aria-live="polite"></aside>
    <dialog class="ee-dialog" aria-labelledby="ee-title"><div class="ee-dialog-bar"><button class="ee-back" type="button" hidden>← Council</button><button class="ee-close" type="button" aria-label="Sluiten">×</button></div><div class="ee-content"></div></dialog>
    <div class="ee-announcement" role="status" aria-live="polite"></div>`;
  const $ = selector => root.querySelector(selector);
  const dialog = $('.ee-dialog'), content = $('.ee-content'), launcher = $('.ee-launcher'), cameo = $('.ee-cameo');
  const clock = document.getElementById('time');
  const clockAttributes = ['tabindex', 'role', 'aria-label'].map(name => [name, clock.getAttribute(name)]);
  const ownTimers = () => {
    for (const id of [flushTimer, hideTimer, holdTimer]) if (id !== null) clearTimeout(id);
    flushTimer = hideTimer = holdTimer = null; holdStart = null;
  };
  function destroy() {
    if (stopped) return;
    stopped = true; abort.abort(); ownTimers(); detachGame(); stateObserver.disconnect();
    if (dialog.open) dialog.close(); root.remove(); style.remove(); document.getElementById('ee-result-button')?.remove();
    for (const [name, value] of clockAttributes) { if (value === null) clock.removeAttribute(name); else clock.setAttribute(name, value); }
    host.canvas.classList.remove('ee-holding');
  }
  function fail(error) {
    destroy(); console.warn('Galactic Council uitgeschakeld; de missie blijft beschikbaar.', error?.message || 'Pluginfout');
  }
  const protect = callback => (...args) => { if (!stopped) try { return callback(...args); } catch (error) { fail(error); } };
  const listen = (target, type, callback) => target?.addEventListener(type, protect(callback), { signal });
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...discovered])); } catch {}
  }
  function updateBadge() { $('.ee-count').textContent = `${discovered.size}/10`; }
  function image(card, className = '') {
    const img = document.createElement('img'); img.src = PORTRAITS[card.id];
    img.alt = `${card.name} als ${card.character}`; img.width = img.height = 384;
    img.className = className; img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('error', () => { img.hidden = true; }, { once: true, signal });
    return img;
  }
  function effect(card) {
    const layer = document.createElement('div'); layer.className = `ee-effect ee-${card.effect}`; layer.setAttribute('aria-hidden', 'true');
    const markup = {
      guide: '<span>⌖</span><i></i><b>Tier 3 → Tier 2 → Tier 1</b>',
      sprint: '<span class="ee-saber"></span><b>Dreigingen <em>Done ✓</em></b><b>Blockers <em>Done ✓</em></b>',
      code: '<span>{ }</span><i></i>',
      scanner: '<span>◎</span><i></i><b>INTELLIGENCE COLLECTED</b>',
      xwing: '<svg viewBox="0 0 240 80"><path d="M16 40h155m-45-23 30 23-30 23m25-49 25 26-25 26m22-47 20 21-20 21m-15-21h38"/><path d="m180 13 28 11m-28 43 28-11"/></svg>',
      guitar: '<span>♫</span><i></i><b>WOOKIEE SOLO</b>',
      mind: '<span>○</span><span>○</span><span>○</span><b>Geen bedrijfsimpact</b>',
      speeder: '<svg viewBox="0 0 240 80"><path d="M5 44h130m-105 8h95m-80 9h60m43-32h59l-15 18h-42l-17-12m74-6 18-7m-5 25 19-3"/></svg>',
      falcon: '<svg viewBox="0 0 240 80"><path d="M15 40h120m-60-10h55m-80 20h80"/><ellipse cx="168" cy="40" rx="26" ry="20"/><path d="m186 24 21 8-15 8 15 8-21 8m-43-16h40m-21-19v38"/></svg>',
      lightning: '<svg viewBox="0 0 240 120"><path d="m35 18 24 26-10 5 25 27-5 12 32 16m105-86-24 26 10 5-25 27 5 12-32 16"/><circle cx="120" cy="69" r="27"/><path d="M95 63h50m-49 13h48M120 42v54"/></svg>',
    };
    layer.innerHTML = markup[card.effect]; return layer;
  }
  function openDialog() {
    if (host.state() === 'playing') host.pause();
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('button:not([hidden])')?.focus({ preventScroll: true });
  }
  function showCard(id) {
    const card = CARDS.find(card => card.id === id);
    if (!card || !discovered.has(id)) return;
    detailId = id; content.replaceChildren(); $('.ee-back').hidden = false;
    const article = document.createElement('article'); article.className = `ee-detail ee-theme-${card.effect}`;
    const art = document.createElement('div'); art.className = 'ee-art'; art.append(image(card), effect(card));
    const text = document.createElement('div'); text.className = 'ee-copy';
    const eyebrow = document.createElement('p'); eyebrow.className = 'ee-eyebrow'; eyebrow.textContent = card.character;
    const title = document.createElement('h2'); title.id = 'ee-title'; title.textContent = card.name + ' · ' + card.title;
    const quote = document.createElement('blockquote'); quote.textContent = card.quote;
    const hint = document.createElement('p'); hint.className = 'ee-hint'; hint.textContent = 'Ontdekt: ' + card.hint;
    text.append(eyebrow, title, quote, hint); article.append(art, text); content.append(article); openDialog();
    // Sound follows the game's existing mute control, uses short original tones.
    if (host.audioEnabled() && !document.hidden) playCue(card.effect);
  }
  function playCue(kind) {
    const context = host.audioContext(); if (!context || context.state !== 'running') return;
    const notes = kind === 'guitar' ? [164.81, 196, 246.94, 329.63] : kind === 'scanner' ? [660, 880, 550] : [440, 554.37, 659.25];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator(), gain = context.createGain(), start = context.currentTime + index * .1;
      oscillator.type = kind === 'guitar' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.018, start + .01); gain.gain.exponentialRampToValueAtTime(.0001, start + .18);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start); oscillator.stop(start + .2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
  function showCouncil() {
    detailId = null; content.replaceChildren(); $('.ee-back').hidden = true;
    const title = document.createElement('h2'); title.id = 'ee-title'; title.textContent = 'Galactic Council';
    const intro = document.createElement('p'); intro.className = 'ee-intro';
    intro.textContent = `${discovered.size} van 10 ontdekt. The Force Behind the Galaxy.`;
    const grid = document.createElement('div'); grid.className = 'ee-grid';
    for (const card of CARDS) {
      const found = discovered.has(card.id), tile = document.createElement('button');
      tile.type = 'button'; tile.className = 'ee-tile' + (found ? ' ee-found' : ''); tile.dataset.card = card.id;
      if (found) tile.append(image(card));
      else { const placeholder = document.createElement('span'); placeholder.className = 'ee-unknown'; placeholder.textContent = '?'; tile.append(placeholder); }
      const name = document.createElement('strong'); name.textContent = card.name;
      const character = document.createElement('span'); character.textContent = found ? card.character : 'Verborgen cameo';
      tile.append(name, character);
      tile.setAttribute('aria-label', found ? `${card.name}, ${card.character}. Bekijk portret.` : `${card.name}. Toon aanwijzing.`);
      grid.append(tile);
    }
    const hint = document.createElement('p'); hint.className = 'ee-council-hint'; hint.setAttribute('role', 'status');
    hint.textContent = 'Tik op een verborgen kaart voor een aanwijzing.';
    content.append(title, intro, grid, hint);
    if (discovered.size === CARDS.length) {
      const finale = document.createElement('button'); finale.type = 'button'; finale.className = 'ee-finale-button'; finale.textContent = 'The Galaxy is complete · Bekijk de troonzaal'; finale.dataset.finale = 'true'; content.append(finale);
    }
    openDialog();
  }
  function showFinale() {
    if (discovered.size !== CARDS.length) return;
    detailId = 'finale'; $('.ee-back').hidden = false; content.replaceChildren();
    const title = document.createElement('h2'); title.id = 'ee-title'; title.textContent = 'The Galaxy is complete';
    const subtitle = document.createElement('p'); subtitle.className = 'ee-intro'; subtitle.textContent = 'Willem · Emperor Palpatine · Master of the Galaxy';
    const throne = document.createElement('div'); throne.className = 'ee-throne';
    for (const [index, card] of CARDS.filter(card => card.id !== 'willem').entries()) {
      const member = document.createElement('figure'); member.className = `ee-member ee-position-${index}`;
      const caption = document.createElement('figcaption'); caption.textContent = card.name;
      member.append(image(card), caption); throne.append(member);
    }
    const emperor = document.createElement('figure'); emperor.className = 'ee-emperor';
    const caption = document.createElement('figcaption'); caption.textContent = 'UNLIMITED VISIBILITY';
    emperor.append(image(CARDS.find(card => card.id === 'willem')), caption); throne.append(emperor);
    content.append(title, subtitle, throne); openDialog();
  }
  function queueUnlock(id, source = 'round') {
    pending.push({ id, source });
    if (source === 'round') roundFinds.push(id);
    if (flushTimer === null) flushTimer = setTimeout(protect(flush), 0);
  }
  function flush(reveal = true) {
    if (flushTimer !== null) clearTimeout(flushTimer);
    flushTimer = null; if (!pending.length) return;
    const entries = pending, batch = entries.map(entry => entry.id); pending = []; persist(); updateBadge();
    launcher.classList.add('ee-new');
    $('.ee-announcement').textContent = batch.map(id => `${CARDS.find(card => card.id === id).name} ontdekt`).join('. ');
    const card = CARDS.find(card => card.id === batch.at(-1));
    if (reveal && entries.some(entry => entry.source === 'intro') && host.state() === 'intro' && !document.hidden) {
      if (document.querySelector('dialog[open]')) introReveal = card.id;
      else showCard(card.id);
    }
    else if (reveal && host.state() === 'playing' && !document.hidden) {
      cameo.replaceChildren(); const label = document.createElement('strong'); label.textContent = card.name + ' ontdekt';
      const quote = document.createElement('span'); quote.textContent = card.quote; cameo.append(label, quote); cameo.hidden = false;
      if (hideTimer !== null) clearTimeout(hideTimer); hideTimer = setTimeout(() => { cameo.hidden = true; hideTimer = null; }, 2400);
    }
    if (discovered.size === CARDS.length) celebration = true;
    if (dialog.open && host.state() !== 'playing' && detailId === null) showCouncil();
    syncState();
  }
  function syncState() {
    if (host.state() !== 'intro' || document.hidden || dialog.open) cancelHold();
    if (host.state() !== 'playing') cameo.hidden = true;
    launcher.hidden = host.state() === 'playing' || host.state() === 'demo';
    let resultButton = document.getElementById('ee-result-button');
    if (host.state() === 'result' && (roundFinds.length || celebration)) {
      if (!resultButton) {
        resultButton = document.createElement('button'); resultButton.id = 'ee-result-button'; resultButton.type = 'button'; resultButton.className = 'ee-result-button';
        document.getElementById('result-home').before(resultButton);
        listen(resultButton, 'click', () => { if (celebration) showFinale(); else showCard(roundFinds.at(-1)); });
      }
      resultButton.textContent = celebration ? 'The Galaxy is complete ✦' : `Nieuwe cameo’s ontdekt · ${roundFinds.length}`;
    } else resultButton?.remove();
  }
  function cancelHold() {
    if (holdTimer !== null) clearTimeout(holdTimer); holdTimer = null; holdStart = null; host.canvas.classList.remove('ee-holding');
  }
  function unlockSecret(id) {
    if (discovered.has(id)) return;
    discovered.add(id); queueUnlock(id, 'intro');
  }
  function beginHold(point = null) {
    if (host.state() !== 'intro' || dialog.open || document.hidden || discovered.has('willem')) return;
    cancelHold(); holdStart = point; host.canvas.classList.add('ee-holding');
    holdTimer = setTimeout(protect(() => { cancelHold(); if (host.state() === 'intro' && !document.hidden && !dialog.open) unlockSecret('willem'); }), 3000);
  }
  listen(launcher, 'click', () => { launcher.classList.remove('ee-new'); showCouncil(); });
  listen($('.ee-close'), 'click', () => dialog.close());
  listen($('.ee-back'), 'click', showCouncil);
  listen(dialog, 'click', event => { if (event.target === dialog) dialog.close(); });
  listen(dialog, 'close', syncState);
  // Contain keyboard input inside the plugin dialog, including the game's shortcuts.
  listen(dialog, 'keydown', event => event.stopPropagation());
  listen(content, 'click', event => {
    const tile = event.target.closest('[data-card]');
    if (tile) {
      const card = CARDS.find(card => card.id === tile.dataset.card);
      if (discovered.has(card.id)) showCard(card.id);
      else $('.ee-council-hint').textContent = card.hint;
    }
    if (event.target.closest('[data-finale]')) showFinale();
  });
  for (const id of ['help', 'intro-help']) listen(document.getElementById(id), 'click', () => {
    if (host.state() === 'intro' && !discovered.has('marcel') && ++helpCount >= 3) unlockSecret('marcel');
  });
  listen(document.getElementById('rules-dialog'), 'close', () => { if (introReveal && host.state() === 'intro') { const id = introReveal; introReveal = null; showCard(id); } });
  clock.setAttribute('tabindex', '0'); clock.setAttribute('role', 'button'); clock.setAttribute('aria-label', 'Rondetijd. Verborgen Galaxy-signaal.');
  const clockTap = () => { if (host.state() === 'intro' && !dialog.open && !discovered.has('murray') && ++timeTaps >= 3) unlockSecret('murray'); };
  listen(clock, 'click', clockTap);
  listen(clock, 'keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); if (!event.repeat) clockTap(); } });
  const arena = document.getElementById('arena');
  listen(arena, 'pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || host.state() !== 'intro') return;
    if (event.target.closest('button,a,input')) return;
    const point = host.point(event.clientX, event.clientY);
    if (Math.hypot(point.x - 500, point.y - 500) <= 70) { event.preventDefault(); arena.setPointerCapture(event.pointerId); beginHold({ x: event.clientX, y: event.clientY }); }
  });
  listen(arena, 'pointermove', event => { if (holdStart && Math.hypot(event.clientX - holdStart.x, event.clientY - holdStart.y) > 16) cancelHold(); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(arena, type, cancelHold);
  listen(host.canvas, 'blur', cancelHold);
  listen(host.canvas, 'keydown', event => { if (event.code === 'KeyW' && !event.repeat && host.state() === 'intro') { event.preventDefault(); beginHold(); } });
  listen(host.canvas, 'keyup', event => { if (event.code === 'KeyW') cancelHold(); });
  listen(document, 'visibilitychange', () => { cancelHold(); cameo.hidden = true; });
  listen(window, 'blur', cancelHold);
  listen(window, 'pagehide', destroy);
  const stateObserver = new MutationObserver(protect(syncState));
  stateObserver.observe(document.body, { attributes: true, attributeFilter: ['data-state'] });
  listen(style, 'error', () => fail(new Error('Pluginstijl niet beschikbaar')));
  document.head.append(style); document.body.append(root); updateBadge(); syncState();
  return {
    observe(game, track = false) {
      if (stopped) return game;
      try {
        if (pending.length) flush(false);
        introReveal = null;
        detachGame(); roundFinds = []; celebration = discovered.size === CARDS.length;
        detachGame = track ? observeGame(game, { active: () => host.state() === 'playing', discovered,
          onUnlock: queueUnlock, onError: fail }) : () => {};
      } catch (error) { fail(error); }
      return game;
    },
    destroy,
  };
}
