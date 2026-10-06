// Controle en stabiele identiteit voor gedeelde browser/server-spelinstellingen.
const fail = message => { throw new Error('Ongeldige gameplayconfig: ' + message); };
export function validateGameConfig(config) {
  const number = (value, name, min, max) => {
    if (!Number.isFinite(value) || value < min || value > max) fail(`${name} moet tussen ${min} en ${max} liggen.`);
  };
  const weights = (values, names, name) => {
    if (!values || Object.keys(values).sort().join(',') !== [...names].sort().join(',')) fail(`${name} heeft ongeldige categorieën.`);
    for (const key of names) number(values[key], `${name}.${key}`, 0, 10000);
    if (Object.values(values).reduce((sum, value) => sum + value, 0) <= 0) fail(`${name} moet minstens één positief gewicht hebben.`);
  };
  if (!config?.round || !config.energy || !config.shot || !config.scan) fail('round, energy, shot en scan zijn verplicht.');
  if (config.easterEggs !== undefined && typeof config.easterEggs !== 'boolean') fail('easterEggs moet true of false zijn.');
  const { round, energy, shot, scan, waves } = config;
  number(round.durationSeconds, 'round.durationSeconds', 10, 300);
  if (!Number.isInteger(round.durationSeconds)) fail('round.durationSeconds moet een geheel aantal seconden zijn.');
  if (!Number.isInteger(round.seed) || round.seed < 0 || round.seed > 0xffffffff) fail('round.seed moet een geheel getal van 0 t/m 4294967295 zijn.');
  number(round.firstSpawnSeconds, 'round.firstSpawnSeconds', 0, round.durationSeconds);
  number(round.quietEndSeconds, 'round.quietEndSeconds', 0, round.durationSeconds);
  if (round.firstSpawnSeconds >= round.durationSeconds - round.quietEndSeconds) fail('de eerste spawn moet vóór de rustige eindperiode liggen.');
  number(energy.regenerationPerSecond, 'energy.regenerationPerSecond', 0, 100);
  number(shot.cost, 'shot.cost', 1, 100);
  number(shot.cooldownSeconds, 'shot.cooldownSeconds', 1 / 60, 10);
  number(shot.travelSeconds, 'shot.travelSeconds', 0, 10);
  number(shot.fieldRadius, 'shot.fieldRadius', 5, 250);
  number(shot.fieldDurationSeconds, 'shot.fieldDurationSeconds', 0.1, 10);
  number(shot.growSeconds, 'shot.growSeconds', 1 / 60, shot.fieldDurationSeconds);
  number(shot.fadeSeconds, 'shot.fadeSeconds', 1 / 60, shot.fieldDurationSeconds);
  if (shot.growSeconds + shot.fadeSeconds > shot.fieldDurationSeconds) fail('de groei- en uitdooftijd mogen samen niet langer zijn dan het veld.');
  number(scan.cost, 'scan.cost', 1, 100);
  number(scan.durationSeconds, 'scan.durationSeconds', 0.1, 30);
  number(scan.cooldownSeconds, 'scan.cooldownSeconds', scan.durationSeconds, 300);
  number(scan.speedMultiplier, 'scan.speedMultiplier', 0.05, 1);
  if (!Array.isArray(waves) || waves.length < 1 || waves.length > 10) fail('gebruik 1 t/m 10 golven.');
  let previous = -1;
  for (const [index, wave] of waves.entries()) {
    const label = `waves[${index}]`;
    if (!wave || typeof wave !== 'object') fail(`${label} ontbreekt.`);
    number(wave.startsAtSeconds, `${label}.startsAtSeconds`, 0, round.durationSeconds - 1 / 60);
    if (wave.startsAtSeconds <= previous || (index === 0 && wave.startsAtSeconds !== 0)) fail('golven moeten oplopend beginnen, met de eerste op 0.');
    previous = wave.startsAtSeconds;
    if (typeof wave.name !== 'string' || !wave.name.trim() || typeof wave.message !== 'string') fail(`${label} heeft een naam en bericht nodig.`);
    number(wave.spawnIntervalSeconds, `${label}.spawnIntervalSeconds`, 0.15, 10);
    number(wave.spawnJitterSeconds, `${label}.spawnJitterSeconds`, 0, 5);
    number(wave.speed, `${label}.speed`, 1, 500);
    number(wave.warningSeconds, `${label}.warningSeconds`, 0, 5);
    if (![1, 2].includes(wave.maxBranches)) fail(`${label}.maxBranches moet 1 of 2 zijn.`);
    weights(wave.tierWeights, ['1', '2', '3'], `${label}.tierWeights`);
    weights(wave.threatWeights, ['cve', 'incident', 'geo', 'law', 'rating', 'low'], `${label}.threatWeights`);
  }
  return config;
}
export function deepFreeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') deepFreeze(child);
  return Object.freeze(value);
}
const stable = value => Array.isArray(value) ? '[' + value.map(stable).join(',') + ']' :
  value && typeof value === 'object' ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}' : JSON.stringify(value);
export function configFingerprint(config) {
  const { easterEggs, theme, leaderboard, ...settings } = config;
  const gameplay = { ...settings, waves: config.waves.map(({ name, message, ...wave }) => wave) };
  let hash = 2166136261;
  for (const char of stable(gameplay)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16).padStart(8, '0');
}
export function pickWeighted(weights, random) {
  const keys = Object.keys(weights).sort(), total = keys.reduce((sum, key) => sum + weights[key], 0);
  let roll = random() * total;
  for (const key of keys) { roll -= weights[key]; if (roll < 0) return key; }
  return keys.findLast(key => weights[key] > 0);
}
