import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { GAME_CONFIG } from '../src/game-config.js';
import { browserFile } from './browser-file.mjs';

const browserTypes = new Set(['.html', '.css', '.js', '.svg', '.png', '.webp']);
const imageTypes = new Set(['.svg', '.png', '.webp']);
// Count every published browser file, even optional QR code, as a safe upper bound.
export async function checkDownloadBudget(root) {
  const budget = JSON.parse(await readFile(path.join(root, 'download-budget.json'), 'utf8'));
  for (const key of ['maxTotalBytes', 'maxImageBytes', 'maxGameBytes', 'maxLeaderboardBytes']) {
    if (!Number.isSafeInteger(budget[key]) || budget[key] <= 0) throw new Error(`Invalid download budget: ${key}`);
  }
  const files = [];
  async function collect(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name);
      if (item.isDirectory()) await collect(filename);
      else if (item.isFile() && browserTypes.has(path.extname(filename))) {
        const source = await readFile(filename), bytes = await browserFile(source, filename), image = imageTypes.has(path.extname(filename));
        files.push({ path: path.relative(root, filename), bytes: bytes.length, sourceBytes: source.length, gzipEstimate: image ? bytes.length : gzipSync(bytes).length, image });
      }
    }
  }
  await collect(path.join(root, 'public'));
  await collect(path.join(root, 'src'));
  if (GAME_CONFIG.easterEggs === true) await collect(path.join(root, 'plugins/easter-eggs'));
  files.sort((a, b) => a.path.localeCompare(b.path));
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  // A standalone monitor page has its own allowance. The existing game ceiling stays 800 KB; prize artwork is display-only.
  const displayFiles = new Set(['public/leaderboard.html', 'public/leaderboard.css', 'src/leaderboard-display.js', 'src/leaderboard-live.js', 'src/storage-ui.js', 'src/leaderboard-prizes.js', 'src/prize-config.js', 'public/themes/classic/leaderboard.css', 'public/themes/riskstudio-app/leaderboard.css']);
  const leaderboardBytes = files.filter(file => (displayFiles.has(file.path) || file.path.startsWith('public/assets/prizes/'))).reduce((sum, file) => sum + file.bytes, 0);
  const gameBytes = totalBytes - leaderboardBytes;
  const imageBytes = files.filter(file => file.image).reduce((sum, file) => sum + file.bytes, 0);
  const gzipEstimate = files.reduce((sum, file) => sum + file.gzipEstimate, 0);
  const report = { budget, totalBytes, imageBytes, gzipEstimate, gameBytes, leaderboardBytes, files };
  if (totalBytes > budget.maxTotalBytes || imageBytes > budget.maxImageBytes || gameBytes > budget.maxGameBytes || leaderboardBytes > budget.maxLeaderboardBytes) {
    throw new Error(`Download budget exceeded: ${totalBytes}/${budget.maxTotalBytes} total bytes, ${imageBytes}/${budget.maxImageBytes} image bytes; game ${gameBytes}/${budget.maxGameBytes}, leaderboard ${leaderboardBytes}/${budget.maxLeaderboardBytes}.`);
  }
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const report = await checkDownloadBudget(path.resolve(import.meta.dirname, '..'));
  console.log(`Download budget OK: ${report.totalBytes}/${report.budget.maxTotalBytes} bytes; images ${report.imageBytes}/${report.budget.maxImageBytes}; game ${report.gameBytes}/${report.budget.maxGameBytes}; leaderboard ${report.leaderboardBytes}/${report.budget.maxLeaderboardBytes}; gzip estimate ${report.gzipEstimate} bytes.`);
}
