import { ensureCanonicalLocation } from '/src/site-location.js';
await ensureCanonicalLocation();
import { initStats } from './admin-stats.js';
const $ = id => document.getElementById(id);
let prizeDraw = null, drawing = false;
let version = '', currentVersion = '', page = 1, total = 0, versions = [], rows = [], selected = null, action = '', loading = false, loadId = 0;
const number = new Intl.NumberFormat('nl-NL');
const date = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short' });
function status(message, error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
function accessError(error) {
  $('manager').hidden = true; $('access').hidden = false;
  $('access').querySelector('h2').textContent = error.status === 401 ? 'Inloggen voor beheer' : 'Geen toegang';
  $('access-message').textContent = error.message;
  $('signin').hidden = error.status !== 401;
  $('switch-account').hidden = error.status !== 403;
}
async function api(path, body) {
  const response = await fetch('/api/admin/' + path, { cache: 'no-store', ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  let data; try { data = await response.json(); } catch { throw new Error('Geen antwoord ontvangen. Probeer het opnieuw.'); }
  if (!response.ok) {
    const error = Object.assign(new Error(data.error || 'Dit lukte niet. Probeer opnieuw.'), { status: response.status, adminUrl: data.adminUrl });
    if ([401, 403].includes(response.status)) accessError(error);
    throw error;
  }
  return data;
}
function drawControls() {
  const done = prizeDraw?.winner?.day === prizeDraw?.day;
  $('draw-prize').disabled = loading || drawing || !prizeDraw || done || !prizeDraw.eligibleCount || version !== currentVersion;
  $('draw-prize').textContent = drawing ? 'Winnaar kiezen…' : done ? 'Vandaag al verloot' : 'Kies willekeurige winnaar';
}
function renderDraw() {
  const winner = prizeDraw?.winner, today = winner?.day === prizeDraw?.day;
  $('prize-draw-status').textContent = today ? `${winner.name} wint ${winner.prize.title}! Verloot op ${winner.day}.`
    : `${prizeDraw.eligibleCount} spelersnamen kunnen vandaag meedoen. ` + (winner ? `Vorige winnaar: ${winner.name} (${winner.day}).` : 'Nog geen winnaar gekozen.');
  drawControls();
}
$('draw-prize').addEventListener('click', async () => {
  if (drawing || !prizeDraw) return;
  drawing = true; drawControls();
  try {
    const result = await api('prize-draw', { version: currentVersion, day: prizeDraw.day });
    prizeDraw.winner = result.winner; renderDraw();
    status(`${result.winner.name} wint de troostprijs. Het leaderboard wordt automatisch bijgewerkt.`);
    await load();
  } catch (error) { status(error.message, true); await load(); }
  finally { drawing = false; drawControls(); }
});
function controls() {
  drawControls();
  for (const id of ['version', 'search', 'refresh', 'export', 'reset']) $(id).disabled = loading;
  $('previous').disabled = loading || page <= 1;
  $('next').disabled = loading || page * 50 >= total;
  for (const button of $('rows').querySelectorAll('button')) button.disabled = loading;
  const count = versions.find(v => v.version === version)?.count || 0;
  $('reset').disabled = loading || !count;
  $('export').disabled = loading || !count;
}
function render() {
  const options = [{ version: currentVersion, count: versions.find(v => v.version === currentVersion)?.count || 0 }, ...versions.filter(v => v.version !== currentVersion)];
  if (!options.some(v => v.version === version)) options.push({ version, count: 0 });
  $('version').replaceChildren(...options.map(v => new Option((v.version === currentVersion ? 'Huidig klassement' : 'Eerder: ' + v.version) + ` (${v.count})`, v.version)));
  $('version').value = version;
  $('board-title').textContent = version === currentVersion ? 'Huidig klassement' : 'Eerder klassement';
  $('count').textContent = `${number.format(total)} ${total === 1 ? 'score' : 'scores'}${$('search').value.trim() ? ' gevonden' : ' opgeslagen'}`;
  $('rows').replaceChildren(...rows.map(entry => {
    const tr = document.createElement('tr');
    for (const [label, value] of [['Speler', entry.name], ['Score', number.format(entry.score)], ['Diensten', `${entry.services} / 3`], ['Gespeeld', Number.isNaN(Date.parse(entry.date)) ? entry.date : date.format(new Date(entry.date))]]) {
      const td = document.createElement('td'); td.textContent = value;
      if (label !== 'Speler') td.dataset.label = label;
      tr.append(td);
    }
    const td = document.createElement('td');
    for (const [label, handler] of [['Bewerken', edit], ['Verwijderen', remove]]) {
      const button = document.createElement('button'); button.textContent = label; button.setAttribute('aria-label', `${label}: ${entry.name}`); button.addEventListener('click', () => handler(entry)); td.append(button);
    }
    tr.append(td); return tr;
  }));
  $('empty').hidden = rows.length !== 0;
  $('empty').textContent = $('search').value.trim() ? 'Geen spelers gevonden met deze naam.' : 'Dit klassement is leeg. Nieuwe gespeelde scores verschijnen hier.';
  $('table-wrap').hidden = !rows.length;
  $('page').textContent = `Pagina ${page} van ${Math.max(1, Math.ceil(total / 50))}`;
  controls();
}
async function load() {
  const id = ++loadId; loading = true; controls();
  try {
    const data = await api('leaderboard?' + new URLSearchParams({ version, page, q: $('search').value.trim() }));
    if (id !== loadId) return;
    const draw = await api('prize-draw');
    if (id !== loadId) return;
    prizeDraw = draw; renderDraw();
    ({ version, currentVersion, total, versions } = data); rows = data.scores;
    if (page > 1 && !rows.length) { page = Math.max(1, Math.ceil(total / 50)); return await load(); }
    render();
  } catch (error) { status(error.message, true); }
  finally { if (id === loadId) { loading = false; controls(); } }
}
function edit(entry) {
  selected = { ...entry }; $('edit-name').value = entry.name; $('edit-score').value = entry.score; $('edit-services').value = entry.services; $('edit-error').textContent = '';
  $('edit-dialog').showModal(); $('edit-name').focus();
}
function remove(entry) {
  selected = { ...entry }; action = 'delete'; $('confirm-title').textContent = 'Score verwijderen?';
  $('confirm-description').textContent = `${entry.name} · ${number.format(entry.score)} punten wordt definitief verwijderd. Andere scores blijven staan.`;
  $('reset-label').hidden = true; $('reset-text').required = false; $('confirm-button').textContent = 'Verwijderen'; $('confirm-error').textContent = '';
  $('confirm-dialog').showModal(); $('confirm-dialog').querySelector('[data-close]').focus();
}
$('reset').addEventListener('click', () => {
  action = 'reset'; selected = null; $('confirm-title').textContent = 'Klassement resetten?';
  const count = versions.find(v => v.version === version)?.count || 0;
  $('confirm-description').textContent = `Alle ${count} scores in dit ${version === currentVersion ? 'huidige' : 'eerdere'} klassement worden definitief verwijderd. Ook lopende rondes van dit klassement vervallen. Andere klassementen en uitgevoerde prijstrekkingen blijven staan. Exporteer eerst als je een kopie wilt bewaren.`;
  $('reset-label').hidden = false; $('reset-text').value = ''; $('reset-text').required = true; $('confirm-button').textContent = 'Definitief resetten'; $('confirm-error').textContent = '';
  $('confirm-dialog').showModal(); $('reset-text').focus();
});
async function submit(form, dialog, errorId, operation) {
  const buttons = [...form.querySelectorAll('button')]; buttons.forEach(b => b.disabled = true);
  const prevent = event => event.preventDefault(); dialog.addEventListener('cancel', prevent);
  $(errorId).textContent = '';
  try { const message = await operation(); dialog.close(); status(message); await load(); }
  catch (error) { $(errorId).textContent = error.message; }
  finally { buttons.forEach(b => b.disabled = false); dialog.removeEventListener('cancel', prevent); }
}
$('edit-form').addEventListener('submit', event => {
  event.preventDefault(); submit(event.currentTarget, $('edit-dialog'), 'edit-error', async () => {
    await api('update', { id: selected.id, version: selected.version, expected: selected, name: $('edit-name').value, score: Number($('edit-score').value), services: Number($('edit-services').value) });
    return 'Score opgeslagen. De ranglijst is bijgewerkt.';
  });
});
$('confirm-form').addEventListener('submit', event => {
  event.preventDefault(); submit(event.currentTarget, $('confirm-dialog'), 'confirm-error', async () => {
    if (action === 'reset') { const result = await api('reset', { version, confirmation: $('reset-text').value }); page = 1; return `Klassement gereset. ${result.removed} scores verwijderd.`; }
    await api('delete', { id: selected.id, version: selected.version, expected: selected }); return 'Score verwijderd.';
  });
});
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => button.closest('dialog').close());
$('version').addEventListener('change', () => { version = $('version').value; page = 1; $('search').value = ''; status(''); load(); });
let timer; $('search').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { page = 1; load(); }, 300); });
$('refresh').addEventListener('click', () => { status(''); load(); });
$('previous').addEventListener('click', () => { page--; load(); }); $('next').addEventListener('click', () => { page++; load(); });
$('export').addEventListener('click', async () => {
  loading = true; controls();
  try {
    const data = await api('export?' + new URLSearchParams({ version }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `cascade-leaderboard-${version.replace(/[^a-z0-9_-]/gi, '_')}-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status(`${data.scores.length} scores geëxporteerd.`);
  } catch (error) { status(error.message, true); } finally { loading = false; controls(); }
});
try {
  const me = await api('me'); $('access').hidden = true; $('manager').hidden = false;
  $('environment').textContent = me.hosting === 'sites' ? 'Online klassement' : 'Lokaal klassement';
  $('account').textContent = me.email; $('signout').hidden = me.hosting !== 'sites'; await load(); initStats(api);
} catch (error) { if(error.status===410){$('access').querySelector('h2').textContent='Beheer via Django';$('access-message').textContent=error.message;$('signin').hidden=true;$('switch-account').hidden=true;if(error.adminUrl){const link=document.createElement('a');link.href=error.adminUrl;link.textContent='Open Django admin ↗';link.target='_blank';link.rel='noopener';$('access').append(link);}}else if (![401, 403].includes(error.status)) { $('access').querySelector('h2').textContent = 'Beheer niet bereikbaar'; $('access-message').textContent = error.message; } }
