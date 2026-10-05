import { GAME_CONFIG } from './game-config.js';
import { resolveTheme } from './themes/index.js';

export const ASSETS = resolveTheme(GAME_CONFIG.theme).assets;
