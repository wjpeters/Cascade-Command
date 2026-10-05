const $ = id => document.getElementById(id);
const number = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 });
const dates = new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Amsterdam' });
const regions = new Intl.DisplayNames(['nl'], { type: 'region' });
const country = code => { try { return code ? regions.of(code) : 'Onbekend'; } catch { return 'Onbekend'; } };
function text(id, value) { $(id).textContent = value; }
function cell(value, label) { const td = document.createElement('td'); td.textContent = value; if (label) td.dataset.label = label; return td; }
function row(values) { const tr = document.createElement('tr'); for (const [label, value] of values) tr.append(cell(value, label)); return tr; }
function dateLabel(day) { return day.slice(8) + '-' + day.slice(5, 7); }
export function initStats(api) {
  let page = 1, total = 0, loading = false, loaded = false;
  function controls() { $('stats-days').disabled = loading; $('stats-refresh').disabled = loading; $('stats-prev').disabled = loading || page <= 1; $('stats-next').disabled = loading || page * 25 >= total; }
  function showStats(show) {
    $('board-panel').hidden = show; $('stats-panel').hidden = !show;
    $('tab-board').setAttribute('aria-pressed', String(!show)); $('tab-stats').setAttribute('aria-pressed', String(show));
    history.replaceState(null, '', show ? '#stats' : '#leaderboard');
    if (show && !loaded) load();
  }
  function group(id, values, label) {
    const root = $(id); root.replaceChildren();
    if (!values.length) { root.textContent = 'Nog geen gegevens'; return; }
    for (const value of values) { const item = document.createElement('div'); item.className = 'stats-group'; const name = document.createElement('span'), count = document.createElement('strong'); name.textContent = label(value.label); count.textContent = number.format(value.count); item.append(name, count); root.append(item); }
  }
  function render(data) {
    loaded = true; total = data.recentTotal;
    for (const key of ['visits', 'starts', 'completed', 'saved']) text('stats-' + key, number.format(data.totals[key]));
    text('stats-since', data.firstDay ? `Metingen sinds ${data.firstDay} · alle spelversies` : 'De eerste metingen verschijnen zodra de game wordt bezocht.');
    text('stats-rate', data.totals.starts ? `${number.format(100 * data.totals.completed / data.totals.starts)}% van de gestarte rondes` : 'Ook zonder score op het leaderboard');
    text('stats-average', data.totals.completed ? `Gemiddeld ${number.format(data.totals.duration_sum / data.totals.completed)} sec. speeltijd · ${number.format(data.totals.score_sum / data.totals.completed)} punten per afgeronde ronde` : 'Gemiddelde speeltijd en score verschijnen na de eerste afgeronde ronde.');
    text('stats-network', `${data.network.uniqueIps} unieke IP-adressen · maximaal laatste 30 dagen · IP beschikbaar bij ${data.network.known} van ${data.network.samples} bezoeken`);
    $('stats-chart').replaceChildren();
    const maximum = Math.max(1, ...data.daily.flatMap(d => [d.visits, d.starts]));
    for (const day of data.daily) {
      const col = document.createElement('div'); col.className = 'day-column'; col.setAttribute('aria-label', `${day.day}: ${day.visits} bezoeken, ${day.starts} rondes`);
      const bars = document.createElement('div'); bars.className = 'day-bars';
      for (const key of ['visits', 'starts']) { const bar = document.createElement('i'); bar.className = key; bar.style.height = `${day[key] / maximum * 100}%`; bars.append(bar); }
      const label = document.createElement('small'); label.textContent = dateLabel(day.day); col.title = col.getAttribute('aria-label'); col.append(bars, label); $('stats-chart').append(col);
    }
    if (!data.daily.length) $('stats-chart').textContent = 'Nog geen metingen in deze periode.';
    $('stats-daily').replaceChildren(...data.daily.map(d => row([['Datum', d.day], ['Bezoeken', d.visits], ['Rondes', d.starts], ['Afgerond', d.completed], ['Opgeslagen', d.saved]])));
    group('stats-device', data.groups.device, label => label || 'Onbekend'); group('stats-browser', data.groups.browser, label => label || 'Onbekend');
    group('stats-country', data.groups.country, country); group('stats-referrer', data.groups.referrer, label => label || 'Direct / onbekend');
    $('stats-ips').replaceChildren(...data.ips.map(ip => row([['IP-adres', ip.ip], ['Land', country(ip.country)], ['Bezoeken', ip.visits], ['Rondes', ip.starts], ['Laatst gezien', dates.format(ip.lastSeen)]])));
    $('stats-no-ips').hidden = data.ips.length !== 0;
    $('stats-rounds').replaceChildren(...data.recent.map(entry => {
      const result = entry.finished === null ? 'Niet afgerond' : `${number.format(entry.score)} p. · ${number.format(entry.duration)} sec. · ${entry.services}/3 diensten${entry.saved ? ' · opgeslagen' : ''}`;
      const ip = entry.ip || (data.generatedAt - entry.started > 30 * 86400000 ? 'Bewaartijd verstreken' : 'Niet beschikbaar');
      const tr = row([['Start', dates.format(entry.started)], ['Resultaat', result], ['IP / land', `${ip} · ${country(entry.country)}`], ['Apparaat', `${entry.device} · ${entry.browser} · ${entry.os}`], ['Herkomst', entry.referrer || 'Direct / onbekend']]);
      const extra = document.createElement('small'); extra.className = 'round-extra'; extra.textContent = [entry.language, entry.viewport, entry.version].filter(Boolean).join(' · '); tr.children[3].append(extra); return tr;
    }));
    text('stats-round-count', `${number.format(total)} rondes met details`); text('stats-page', `Pagina ${page} van ${Math.max(1, Math.ceil(total / 25))}`);
    $('stats-no-rounds').hidden = data.recent.length !== 0;
    $('stats-content').hidden = false;
  }
  async function load() {
    if (loading) return;
    loading = true; controls(); $('stats-error').hidden = true; $('stats-panel').setAttribute('aria-busy', 'true');
    try {
      const data = await api('stats?' + new URLSearchParams({ days: $('stats-days').value, page }));
      if (page > 1 && !data.recent.length) { page = Math.max(1, Math.ceil(data.recentTotal / 25)); loading = false; return await load(); }
      render(data);
    } catch (error) { $('stats-error').textContent = error.message; $('stats-error').hidden = false; }
    finally { loading = false; controls(); $('stats-panel').setAttribute('aria-busy', 'false'); }
  }
  $('tab-stats').addEventListener('click', () => showStats(true)); $('tab-board').addEventListener('click', () => showStats(false));
  $('stats-days').addEventListener('change', () => { page = 1; load(); }); $('stats-refresh').addEventListener('click', load);
  $('stats-prev').addEventListener('click', () => { page--; load(); }); $('stats-next').addEventListener('click', () => { page++; load(); });
  showStats(location.hash === '#stats');
}
