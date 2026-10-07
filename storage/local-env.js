import { execFileSync } from 'node:child_process';
import { STORAGE_CONFIG } from './config.js';
// Node-only helper. No token is written to disk or included in command arguments.
export function localStorageEnvironment(env = process.env, readKeychain = account => execFileSync('/usr/bin/security', ['find-generic-password', '-s', 'wpos.cascade-command', '-a', account, '-w'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()) {
  if ((env.CASCADE_STORAGE_BACKEND ?? STORAGE_CONFIG.backend) !== 'django' || env.CASCADE_COMMAND_API_TOKEN) return env;
  try {
    const account = new URL(env.DJANGO_GAMES_API_BASE_URL || STORAGE_CONFIG.apiBaseUrl).hostname;
    const token = readKeychain(account);
    return token ? { ...env, CASCADE_COMMAND_API_TOKEN: token } : env;
  } catch { return env; }
}
