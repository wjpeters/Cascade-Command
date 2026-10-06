// Centrale gameplayconfiguratie. Alleen dit bestand aanpassen om te tweaken.
// Na aanpassen: stop de lokale server (Ctrl+C), start opnieuw en vernieuw de pagina.
// Het leaderboard volgt gewijzigde spelinstellingen automatisch. Oude scores blijven bewaard.
// Tijden zijn seconden. Snelheid en straal gebruiken het speelveld van 1000 × 1000.
// Gewichten zijn verhoudingen: bijvoorbeeld 60 / 30 / 10. Een gewicht 0 schakelt die optie uit.

export const GAME_CONFIG = {
  theme: 'riskstudio-app',  // Vormgeving. Beschikbare thema’s: src/themes/index.js.
  // Presentatieplugin: true = aan, false = geen plugincode of portretten laden.
  // Na wijzigen lokaal herstarten + pagina vernieuwen; online opnieuw bouwen/publiceren.
  // Deze schakelaar verandert de spelregels of het leaderboard niet.
  easterEggs: false,
  // Prijzen en schermrotatie veranderen het bestaande klassement niet.
  leaderboard: {
    demo: true,                 // false bij echte prijzen: verwijdert het demo-label.
    flipIntervalSeconds: 12,      // Tijd per kant. 0 = alleen handmatig draaien.
    timeZone: 'Europe/Amsterdam', // Kalenderdag van de dagelijkse trekking.
    prizes: {
      podium: [
        { title: 'Galaxy koptelefoon', description: 'Draadloos genieten. Demo-prijs.', image: '/assets/prizes/headphones.svg' },
        { title: 'Orbit speaker', description: 'Een feestje voor onderweg. Demo-prijs.', image: '/assets/prizes/speaker.svg' },
        { title: 'Cascade thermos', description: 'Warme koffie, koele keten. Demo-prijs.', image: '/assets/prizes/thermos.svg' },
      ],
      consolation: { title: 'Mission snackbox', description: 'Een lekkere verrassing. Demo-prijs.', image: '/assets/prizes/snacks.svg' },
    },
  },

  round: {
    durationSeconds: 75,
    seed: 271026,                 // Zelfde scenario voor alle spelers.
    firstSpawnSeconds: 1.2,
    quietEndSeconds: 2,            // Laatste seconden zonder nieuwe dreigingen.
  },
  energy: {
    regenerationPerSecond: 13,     // Lager = minder vaak onderscheppen/scannen.
  },
  shot: {
    cost: 20,
    cooldownSeconds: 0.2,
    travelSeconds: 1,              // Reistijd per 1000 afstandseenheden.
    fieldRadius: 77,               // Kleiner = preciezer richten.
    fieldDurationSeconds: 1.8,     // Korter = minder bescherming.
    growSeconds: 0.2,
    fadeSeconds: 0.4,
  },
  scan: {
    cost: 25,
    durationSeconds: 5,
    cooldownSeconds: 18,
    speedMultiplier: 0.4,         // 0.4 = 40% van de normale snelheid tijdens scan.
  },

  // Voeg golven toe of wijzig starttijden. Eerste golf begint altijd op seconde 0.
  // Lager spawnIntervalSeconds = meer risico's. Hoger speed = minder reactietijd.
  // Meer tier 1/2 en meer CVE's maken de keten sneller kwetsbaar.
  waves: [
    {
      startsAtSeconds: 0,
      name: 'Eerste signalen',
      message: 'Herken de signalen. Bescherm je diensten.',
      spawnIntervalSeconds: 2.1,
      spawnJitterSeconds: 0.4,     // Willekeurige extra tijd tussen spawns.
      speed: 50,
      warningSeconds: 0.7,        // Waarschuwing vóór een nieuw risico gaat bewegen.
      maxBranches: 1,             // 1 = geen splitsing; 2 = alle gedeelde routes.
      tierWeights: { 3: 100, 2: 0, 1: 0 },
      threatWeights: { cve: 12, incident: 20, geo: 16, law: 16, rating: 16, low: 20 },
    },
    {
      startsAtSeconds: 20,
      name: 'Kettingreacties',
      message: 'Gedeelde leveranciers. Stop risico’s vóór ze splitsen!',
      spawnIntervalSeconds: 1.3,
      spawnJitterSeconds: 0.3,
      speed: 65,
      warningSeconds: 0.55,
      maxBranches: 2,
      tierWeights: { 3: 60, 2: 30, 1: 10 },
      threatWeights: { cve: 18, incident: 20, geo: 16, law: 15, rating: 15, low: 16 },
    },
    {
      startsAtSeconds: 45,
      name: 'Onder druk',
      message: 'Laatste golf. Houd je diensten operationeel!',
      spawnIntervalSeconds: 0.9,
      spawnJitterSeconds: 0.25,
      speed: 80,
      warningSeconds: 0.4,
      maxBranches: 2,
      tierWeights: { 3: 48, 2: 34, 1: 18 },
      threatWeights: { cve: 24, incident: 20, geo: 15, law: 15, rating: 14, low: 12 },
    },
  ],
};
