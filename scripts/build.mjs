import { build } from 'esbuild';
import { readdir, readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { checkDownloadBudget } from './check-download-budget.mjs';
import { GAME_CONFIG } from '../src/game-config.js';
const root = path.resolve(import.meta.dirname, '..');
const budget = await checkDownloadBudget(root);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8', '.md':'text/plain; charset=utf-8' };
const assets = {};
async function collect(directory, prefix) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, item.name), route = prefix + '/' + item.name;
    if (item.isDirectory()) await collect(filename, route);
    else if (item.isFile() && types[path.extname(item.name)] && !(prefix.startsWith('/plugins/') && item.name.endsWith('.md'))) assets[route] = { type: types[path.extname(item.name)], data: (await readFile(filename)).toString('base64') };
  }
}
await collect(path.join(root, 'public'), '');
await collect(path.join(root, 'src'), '/src');
if (GAME_CONFIG.easterEggs === true) await collect(path.join(root, 'plugins/easter-eggs'), '/plugins/easter-eggs');
await rm(path.join(root, 'dist'), { recursive: true, force: true });
await mkdir(path.join(root, 'dist/.openai'), { recursive: true });
await writeFile(path.join(root, 'dist/download-budget.json'), JSON.stringify(budget, null, 2) + '\n');
await cp(path.join(root, '.openai/hosting.json'), path.join(root, 'dist/.openai/hosting.json'));
await build({ entryPoints: [path.join(root, 'worker/index.js')], outfile: path.join(root, 'dist/server/index.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true,
  plugins: [{ name: 'cascade-assets', setup(context) {
    context.onResolve({ filter: /^cascade:assets$/ }, () => ({ path: 'assets', namespace: 'cascade' }));
    context.onLoad({ filter: /.*/, namespace: 'cascade' }, () => ({ contents: JSON.stringify(assets), loader: 'json' }));
  } }],
});
console.log(`Built Cascade Command with ${Object.keys(assets).length} local assets.`);
