import { deepFreeze } from '../game-rules.js';
import { CLASSIC_THEME } from './classic.js';
import { RISKSTUDIO_APP_THEME } from './riskstudio-app.js';
import { RISKSTUDIO_CC_V1_THEME } from './riskstudio-cc-v1.js';

export const DEFAULT_THEME_ID = 'classic';
// Register complete, independent presets here. Presentation never changes gameplay.
export const THEMES = deepFreeze({ classic: CLASSIC_THEME, 'riskstudio-app': RISKSTUDIO_APP_THEME, 'riskstudio-cc-v1': RISKSTUDIO_CC_V1_THEME });

export function resolveTheme(id = DEFAULT_THEME_ID) {
  return typeof id === 'string' && Object.hasOwn(THEMES, id) ? THEMES[id] : THEMES[DEFAULT_THEME_ID];
}
