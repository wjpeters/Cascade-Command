// Bewaar dit thema. Maak voor experimenten een nieuw thema met eigen bestanden.
export const CLASSIC_THEME = {
  id: "classic",
  name: "Classic",
  description: "De oorspronkelijke Cascade Command-vormgeving, vastgelegd op 5 oktober 2026.",
  stylesheet: "/themes/classic/game.css",
  leaderboardStylesheet: "/themes/classic/leaderboard.css",
  pluginStylesheet: "/plugins/easter-eggs/themes/classic.css",
  metaColor: "#030d18",
  assets: {
    sprites: "/assets/sprites.093cb099440e.webp",
    background: "/assets/space.269c230f8b18.webp",
    logo: "/assets/riskstudio-logo.87fc5d84cca0.webp"
  },
  categories: {
    incident: "#ff6969",
    cve: "#ffb45c",
    geo: "#b287ff",
    law: "#709fff",
    rating: "#72e4ec",
    low: "#9babbd"
  },
  services: {
    portal: "#81dff2",
    payments: "#c4b5fd",
    operations: "#f5cf86"
  },
  canvas: {
    surface: "#071421",
    critical: "#ff616f",
    healthWarning: "#ffb45c",
    healthGood: "#66dfb0",
    healthEmpty: "#304051",
    serviceFailed: "#ff7078",
    outerOrbit: "#21415155",
    orbit: "#477895a0",
    tickMajor: "#52758e77",
    tickMinor: "#23425744",
    linkKnown: "#81e4f6",
    link: "#71afca",
    linkHidden: "#718aa92a",
    linkParticleKnown: "#b9f8ff",
    linkParticle: "#80cee5",
    hiddenMarker: "#a1bace88",
    hiddenText: "#bed4e4",
    tierTitle: "#c1e3f5",
    tierDescription: "#81a4bf",
    serviceLink: "#79d8ebaa",
    serviceLinkFailed: "#743a4b77",
    selection: "#97edff",
    selectionHalo: "#97edff50",
    target: "#ffbd76",
    organization: "#ff9d4c",
    organizationRing: "#eea15b70",
    organizationLabel: "#ffb87c",
    scanRing: "#80e5f866",
    scanHalo: "#80e5f828",
    shotTrail: "#8cdded60",
    shot: "#c8f6ff",
    shotTarget: "#8cdded80",
    field: "#70dced0b",
    hitRing: "#d7f7ff",
    hitText: "#a7edff",
    cascadeRing: "#ff6b69",
    cascadeInner: "#ffb45c",
    cascadeText: "#ffb6a4",
    damage: "#ff645b",
    reticle: "#96e6f760",
    reticleLow: "#ff645b80",
    crosshair: "#b8f2ff"
  },
  fonts: {
    sans: "-apple-system, sans-serif",
    mono: "SFMono-Regular, monospace"
  },
  renderer: "/src/themes/classic/renderer.js",
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
  }
};
