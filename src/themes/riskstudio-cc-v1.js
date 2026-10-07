// Een zelfstandig licht app-thema. Classic blijft bewaard.
export const RISKSTUDIO_CC_V1_THEME = {
  id: "riskstudio-cc-v1",
  name: "RiskStudio CC v1",
  description: "Mobile-gamebeleving in RiskStudio-stijl, zelfstandige kopie van RiskStudio App.",
  stylesheet: "/themes/riskstudio-cc-v1/game.css",
  leaderboardStylesheet: "/themes/riskstudio-cc-v1/leaderboard.css",
  pluginStylesheet: "/plugins/easter-eggs/themes/riskstudio-cc-v1.css",
  metaColor: "#ffffff",
  fullRiskFeed: true,
  assets: {
    sprites: "/assets/riskstudio-app-sprites.svg",
    background: "/assets/riskstudio-app-background.svg",
    logo: "/assets/riskstudio-app-logo.077fe3765b62.webp"
  },
  categories: {
    incident: "#dc3545",
    cve: "#bd6811",
    geo: "#8950d2",
    law: "#4670dd",
    rating: "#008b9b",
    low: "#737d8f"
  },
  services: {
    portal: "#4670dd",
    payments: "#8b5cf6",
    operations: "#d69518"
  },
  canvas: {
    surface: "#ffffff",
    critical: "#df3348",
    healthWarning: "#e3a125",
    healthGood: "#22ba88",
    healthEmpty: "#e2e8f0",
    serviceFailed: "#dc3545",
    outerOrbit: "#7898f680",
    orbit: "#c6d0e644",
    tickMajor: "#a8b9e166",
    tickMinor: "#dbe3f466",
    linkKnown: "#4670dd",
    link: "#9bb0d3",
    linkHidden: "#b2bfd12a",
    linkParticleKnown: "#4670dd",
    linkParticle: "#b6c5e0",
    hiddenMarker: "#becbe4",
    hiddenText: "#7890b5",
    tierTitle: "#667792",
    tierDescription: "#94a2b7",
    serviceLink: "#94ade066",
    serviceLinkFailed: "#dbb0b666",
    selection: "#4670dd",
    selectionHalo: "#4670dd40",
    target: "#d69518",
    organization: "#f58824",
    organizationRing: "#ced9f3",
    organizationLabel: "#64748b",
    scanRing: "#4670dd77",
    scanHalo: "#4670dd22",
    shotTrail: "#4670dd66",
    shot: "#4670dd",
    shotTarget: "#4670dd99",
    field: "#4670dd0b",
    hitRing: "#4670dd",
    hitText: "#365ab1",
    cascadeRing: "#dc3545",
    cascadeInner: "#e5a623",
    cascadeText: "#aa2434",
    damage: "#dc3545",
    reticle: "#4670dd55",
    reticleLow: "#dc354577",
    crosshair: "#4670dd"
  },
  fonts: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
  },
  renderer: "/src/themes/riskstudio-cc-v1/renderer.js",
  symbols: {
    categories: {
      incident: "M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0 M12 3v4 M12 17v4 M3 12h4 M17 12h4 M5.6 5.6l3 3 M15.4 15.4l3 3 M5.6 18.4l3-3 M15.4 8.6l3-3 M10.5 11h.1 M13.5 13h.1",
      cve: "M12 3L22 21H2Z M12 9v5 M12 17v.5",
      geo: "M2 8l10-6 10 6Z M4 10v9 M9 10v9 M15 10v9 M20 10v9 M2 21h20 M3 19h18",
      law: "M12 3v18 M7 21h10 M3 7h18 M6 7L2 15h8Z M18 7l-4 8h8Z",
      rating: "M2 12Q12-1 22 12Q12 25 2 12Z M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0 M12 10v.1",
      low: "M20 12a8 8 0 1 1-16 0a8 8 0 0 1 16 0 M8 12h8"
    },
    services: {
      portal: "M3 4h18v16H3Z M3 8h18 M6 6h.1 M8 6h.1 M13 11v6 M10 14h7 M15 12l2 2-2 2",
      payments: "M3 5h18v14H3Z M3 9h18 M6 15h4 M15 14h3v2h-3Z",
      operations: "M9 3h6l.5 3 2 1 2.7-1L23 11l-2.4 2 0 2L23 17l-2.8 4-2.7-1-2 1-.5 2H9l-.5-2-2-1-2.7 1L1 17l2.4-2v-2L1 11l2.8-5 2.7 1 2-1Z M16 13a4 4 0 1 1-8 0a4 4 0 0 1 8 0"
    }
  },
  shell: "/src/themes/riskstudio-cc-v1/shell.js"
};
