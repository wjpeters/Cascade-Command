// The gateway mirrors Sites without changing the browser URL. Navigate before any POST.
const alias = 'https://game.riskstudio.com';
const canonical = 'https://riskstudio-cascade-command.codexwillem.chatgpt.site';
export function canonicalGameUrl(currentUrl) {
  const url = new URL(currentUrl);
  if (url.origin !== alias) return null;
  return canonical + url.pathname + url.search + url.hash;
}
export function ensureCanonicalLocation(current = location) {
  const destination = canonicalGameUrl(current.href);
  if (!destination) return;
  current.replace(destination);
  // Stop page initialization while the browser switches origins.
  return new Promise(() => {});
}
