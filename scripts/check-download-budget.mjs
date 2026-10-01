import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { GAME_CONFIG } from '../src/game-config.js';

const browserTypes = new Set(['.html', '.css', '.js', '.svg', '.png', '.webp']);
const imageTypes = new Set(['.svg', '.png', '.webp']);
// Count every published browser file, even optional QR code, as a safe upper bound.
export async function checkDownloadBudget(root) {
  const budget = JSON.parse(await readFile(path.join(root, 'download-budget.json'), 'utf8'));
  for (const key of ['maxTotalBytes', 'maxImageBytes']) {
    if (!Number.isSafeInteger(budget[key]) || budget[key] <= 0) throw new Error(`Invalid download budget: ${key}`);
  }
  const files = [];
  async function collect(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name);
      if (item.isDirectory()) await collect(filename);
      else if (item.isFile() && browserTypes.has(path.extname(filename))) {
        const bytes = await readFile(filename), image = imageTypes.has(path.extname(filename));
        files.push({ path: path.relative(root, filename), bytes: bytes.length, gzipEstimate: image ? bytes.length : gzipSync(bytes).length, image });
      }
    }
  }
  await collect(path.join(root, 'public'));
  await collect(path.join(root, 'src'));
  if (GAME_CONFIG.easterEggs === true) await collect(path.join(root, 'plugins/easter-eggs'));
  files.sort((a, b) => a.path.localeCompare(b.path));
  const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const imageBytes = files.filter(file => file.image).reduce((sum, file) => sum + file.bytes, 0);
  const gzipEstimate = files.reduce((sum, file) => sum + file.gzipEstimate, 0);
  const report = { budget, totalBytes, imageBytes, gzipEstimate, files };
  if (totalBytes > budget.maxTotalBytes || imageBytes > budget.maxImageBytes) {
    throw new Error(`Download budget exceeded: ${totalBytes}/${budget.maxTotalBytes} total bytes, ${imageBytes}/${budget.maxImageBytes} image bytes.`);
  }
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const report = await checkDownloadBudget(path.resolve(import.meta.dirname, '..'));
  console.log(`Download budget OK: ${report.totalBytes}/${report.budget.maxTotalBytes} bytes; images ${report.imageBytes}/${report.budget.maxImageBytes}; gzip estimate ${report.gzipEstimate} bytes.`);
}
