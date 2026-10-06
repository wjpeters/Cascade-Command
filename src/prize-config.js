import { GAME_CONFIG } from './game-config.js';
export function validatePrizeConfig(config) {
  if (!config || !Number.isFinite(config.flipIntervalSeconds) || (config.flipIntervalSeconds !== 0 && (config.flipIntervalSeconds < 3 || config.flipIntervalSeconds > 3600))) throw new Error('Prijzenconfig: flipIntervalSeconds moet 0 of 3–3600 zijn.');
  if (typeof config.timeZone !== 'string' || !config.timeZone) throw new Error('Prijzenconfig: geef een tijdzone op.');
  if (typeof config.demo !== 'boolean') throw new Error('Prijzenconfig: demo moet true of false zijn.');
  new Intl.DateTimeFormat('nl-NL', { timeZone: config.timeZone }).format();
  if (!Array.isArray(config.prizes?.podium) || config.prizes.podium.length !== 3) throw new Error('Prijzenconfig: geef precies drie podiumprijzen op.');
  for (const prize of [...config.prizes.podium, config.prizes.consolation]) {
    if (!prize || typeof prize.title !== 'string' || !prize.title.trim() || prize.title.length > 80 || typeof prize.description !== 'string' || prize.description.length > 160) throw new Error('Prijzenconfig: controleer titel en omschrijving.');
    if (typeof prize.image !== 'string' || !(/^(\/(?!\/)[^\s\\]*|https:\/\/[^\s\\]+)$/.test(prize.image))) throw new Error('Prijzenconfig: afbeelding moet een lokaal pad of HTTPS-link zijn.');
    const url = new URL(prize.image, 'https://game.example');
    if (url.username || url.password) throw new Error('Prijzenconfig: gebruik een afbeeldingslink zonder inloggegevens.');
  }
  return config;
}
export const PRIZE_CONFIG = validatePrizeConfig(GAME_CONFIG.leaderboard);
