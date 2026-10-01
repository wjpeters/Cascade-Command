// Presentation-only achievements. No engine imports, timers or game mutations.
export function createDetector({ discovered = new Set(), onUnlock = () => {} } = {}) {
  const tiers = new Set();
  let fastHits = 0, firstHitSeen = false, firstWaveChecked = false;
  const unlock = id => {
    if (discovered.has(id)) return false;
    discovered.add(id);
    onUnlock(id);
    return true;
  };
  return {
    scanned(tier) {
      if ([1, 2, 3].includes(tier)) tiers.add(tier);
      if (tiers.size === 3) unlock('kevin');
    },
    intercepted({ scans, fast, combo, prevented }) {
      if (!firstHitSeen) {
        firstHitSeen = true;
        if (scans === 0) unlock('luuk');
      }
      if (fast && ++fastHits >= 3) unlock('robin');
      if (combo >= 5) unlock('stefan');
      if (prevented >= 3) unlock('jelle');
    },
    sample({ seconds, firstWaveEnd, hp, lost, ignored, prevented }) {
      if (!firstWaveChecked && seconds >= firstWaveEnd) {
        firstWaveChecked = true;
        if (lost === 0 && hp.every(value => value === 4)) unlock('niels');
      }
      if (ignored >= 3) unlock('nick');
      if (prevented >= 3) unlock('jelle');
    },
  };
}
