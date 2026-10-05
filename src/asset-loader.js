import { ASSETS } from './assets.js';

// Reuse successfully decoded images when retrying a failed download.
const decoded = new Map();
export async function loadGameAssets(onProgress = () => {}, assets = ASSETS) {
  const images = {}, entries = Object.entries(assets);
  let completed = 0;
  onProgress({ completed, total: entries.length });
  const results = await Promise.allSettled(entries.map(async ([name, url]) => {
    let image = decoded.get(url);
    if (!image) {
      image = new Image();
      image.decoding = 'async';
      image.fetchPriority = name === 'sprites' ? 'high' : 'auto';
      image.src = url;
      await image.decode();
      decoded.set(url, image);
    }
    images[name] = image;
    completed++;
    onProgress({ completed, total: entries.length });
  }));
  // Background and branding have HTML/CSS fallbacks; sprites are essential.
  if (!images.sprites) throw new Error('De spelbeelden konden niet laden. Probeer opnieuw.');
  return { images, decorativeFailures: results.filter(result => result.status === 'rejected').length };
}
