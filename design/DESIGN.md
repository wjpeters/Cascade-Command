# Cascade Command visual specification

Working concept: concept.png, generated with the built-in Image Gen tool on 2026-10-01. The user requested a playable prototype; no separate design approval gate was requested.

- Navy #030d18 / #07101e, thin slate #244358 rules, orange #ff9d4c, ice cyan #8cdded, coral #ff645b.
- Header: RiskStudio hexagonal icon and wordmark, divider, Cascade Command, sound/fullscreen controls. System sans, 24px brand, 22px title; mobile 17/14px.
- Desktop: 74% arena, 26% score rail, full viewport, no marketing cards. HUD above galaxy and energy/scan below. Score/time: tabular monospace 46px; labels: 11px uppercase tracking.
- Arena: concentric rings, stable network geometry, 36 nodes and 3 crown jewels. Native geometry and SVG icons are intentional vector elements, necessary for accurate dynamic connection and collision display. Supplier/crystal/incident/shockwave artwork is the generated transparent sprite atlas. Background is generated space art.
- Gameplay score/HUD values are real dynamic state. Empty leaderboard has no invented players.
- Start, result, pause and connection-error panels extend the same visual system; these functional states are required for play. Start is an unboxed left-aligned briefing over a dim demo arena, not a marketing homepage.
- Mobile: header, HUD, square arena, energy/scan controls, service status, leaderboard. Touch targets at least 44px. Hide keyboard hints on coarse input. No fullscreen dependency.
- Sound off initially. Respect reduced motion. Canvas pointer plus keyboard cursor and Enter; Space scans, Escape pauses. DOM mirrors mission state for screen readers.
- Copy: Cascade Command; SCORE; TIJD; DIENSTEN; Leaderboard; Op deze game-server; De eerste plek is nog vrij.; Speel een ronde en zet jouw naam bovenaan.; ENERGIE; Scan; Spatie; Klik of tik om te onderscheppen.; Stop incidenten vóór ze zich splitsen.; Een spel over afhankelijkheden. Een wereld aan inzicht.
- Required state extensions: Bescherm je galaxy.; Start missie; Demo bekijken; Pauze; Verder spelen; Opnieuw; Zet je score neer; Naam; Bewaar score; Klantportaal; Betalingen; Operatie; Scan onthult routes en vertraagt incidenten; Prototype: fictieve keten. Scores worden op deze Mac bewaard.

Production image prompts: concept specifies a complete 1536x1024 mission-control game screen; sprite pass isolates four transparent 2x2 assets; space pass generates a dark square starfield with clean center. Originals copied locally from built-in Image Gen output. No remote asset dependencies.

## Final visual comparison, 1 October 2026

Compared the concept and final Browser/IAB screenshots directly with view_image, at 1536×1024 desktop and 390×844 mobile. No Playwright fallback. Key comparisons:

| Aspect | Concept evidence | Implementation and decision |
|---|---|---|
| Composition | Galaxy at left, unboxed leaderboard right | Matching 73.3/26.7 split at 1536px; sidebar text enlarged after comparison. |
| Palette | Navy, orange score/energy, cyan services/scan | Shared locked tokens. Red-shifted incident sprite improves threat contrast. |
| Game art | Supplier orbs, crystal services, shockwaves | Matching generated assets, larger nodes for distant reading. Functional vector links and rings are intentional. |
| Typography | Large tabular HUD, simple sans chrome | System sans and local monospace fallback; same hierarchy, no external fonts. Exact font glyphs differ from raster concept. |
| Controls | Energy and scan at bottom | Both accessible on desktop and 390px mobile; corrected intrinsic canvas sizing after a viewport switch clipped the controls. |
| Responsive | Full desktop primary screen | Mobile keeps HUD, square arena and controls visible; leaderboard flows below. No horizontal overflow. |
| Copy and states | Primary game labels and empty board | Main labels retained. Intentional required additions: start/pause/result/demo, critical-service health, input hints and phone link. Decorative small center text removed for readability. |

Above-the-fold copy review: no new product claims or marketing sections. Extra copy belongs to necessary playable states and controls. The implementation follows the concept's visual direction; it is not a pixel-identical raster reproduction. The generated network topology, exact starfield, sprite sizes and system-font glyphs intentionally differ because the canvas implements real game state. No remaining clipping or broken core controls observed in tested viewports.

Functional evidence: start → pointer/keyboard interception → energy drop and score increase → scan → pause/resume → loss/result → name → server-validated leaderboard → reload → restart. Six simulation tests pass. Invalid session, forged action and foreign Origin rejected. Actual touch emulation is unsupported in this IAB and no physical phone was tested. The selected desktop preview is retained as a handoff image; temporary QA images are removed after delivery preparation.
