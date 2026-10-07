// Server-only defaults. Runtime settings override these without changing gameplay.
export const STORAGE_CONFIG = Object.freeze({
  backend: 'legacy',
  apiBaseUrl: 'https://riskstudio-fafnir.abibia.com/api/v1/internal/games/cascade-command/',
});

class StorageConfigurationError extends Error { constructor(message) { super(message); this.name = 'StorageConfigurationError'; } }
export function storageConfig(env = {}) {
  const backend = env.CASCADE_STORAGE_BACKEND ?? STORAGE_CONFIG.backend;
  if (!['legacy', 'django'].includes(backend)) throw new StorageConfigurationError('CASCADE_STORAGE_BACKEND moet legacy of django zijn.');
  if (backend === 'legacy') return { backend };
  const token = env.CASCADE_COMMAND_API_TOKEN;
  if (typeof token !== 'string' || !token.trim() || /[\r\n]/.test(token)) throw new StorageConfigurationError('CASCADE_COMMAND_API_TOKEN ontbreekt of is ongeldig.');
  let url;
  try { url = new URL(env.DJANGO_GAMES_API_BASE_URL || STORAGE_CONFIG.apiBaseUrl); } catch { throw new StorageConfigurationError('DJANGO_GAMES_API_BASE_URL is ongeldig.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || !(url.protocol === 'https:' || (local && url.protocol === 'http:')) || !url.pathname.endsWith('/api/v1/internal/games/cascade-command/')) throw new StorageConfigurationError('Gebruik een volledige, veilige Django game-API-URL met afsluitende slash.');
  return { backend, baseUrl: url.href, token };
}
