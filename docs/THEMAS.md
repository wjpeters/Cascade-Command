# Thema’s voor Cascade Command

De oorspronkelijke vormgeving is vastgelegd als **Classic** (`classic`). Het nieuwe **RiskStudio App**-thema (`riskstudio-app`) gebruikt de lichte Explore-workspace uit de aangeleverde RiskStudio-screenshot. Dit is het eerste bewaarde thema, van 5 oktober 2026. Nieuwe experimenten krijgen een eigen naam en eigen bestanden. Houd Classic intact om de oorspronkelijke look terug te kunnen kiezen.

## Een thema kiezen

Wijzig bovenaan `src/game-config.js`:

```js
export const GAME_CONFIG = {
  theme: 'classic',
  // Overige spelinstellingen…
};
```

De beschikbare namen staan in `src/themes/index.js`. Er zijn twee bewaarde thema’s: `classic` en `riskstudio-app`. De lokale game gebruikt nu `classic`. Kies `riskstudio-app` voor de lichte Explore-workspace. Herlaad de lokale game na een wijziging. Voor de online game: opnieuw bouwen en publiceren. Een lokaal gewijzigde keuze past de al gepubliceerde site niet aan.

Een ontbrekende of onbekende naam valt terug op Classic. Als de stylesheet van een geregistreerd thema niet kan laden, blijft de vorige stylesheet aanwezig en start de game met Classic. De loader wacht maximaal acht seconden op een nieuwe stylesheet. Het actieve thema staat als `data-theme` op het HTML-element, voor inspectie en eventuele themaspecifieke selectors.

Een themawissel verandert geen spelregels, moeilijkheid, scenarioseed, scorevalidatie, score-identiteit of opgeslagen klassement. De keuze is een instelling voor de gehele game, geen persoonlijke spelersvoorkeur.

## RiskStudio App

De nieuwe vormgeving volgt de RiskStudio Explore-workspace uit de screenshot van 22 september 2026: het officiële logo, een witte app-header met de werkwijze, witte panelen met subtiele randen, het blauwe accent `#4670dd`, en een lichte Galaxy met een blauwe buitenring en een geel centrum.

Het linkerpaneel toont de missie, leverancierszoekfunctie, huidige focus, intelligence en de tabs Insights / Risico’s. Zoeken selecteert een echte leverancier uit de huidige Galaxy en markeert de locatie; een scan blijft nodig voor intelligence. Het rechterpaneel heeft een donut die de actuele weerbaarheid van de drie diensten volgt, de dienststatus, Live Risk Feed en het volledige klassement. De werkwijze bovenaan geeft app-context; de spelknoppen blijven op hun eigen plek. Op mobiel staan de panelen onder elkaar en brengt Start missie het speelveld in beeld.

| Bestand | Vormgeving |
|---|---|
| `src/themes/riskstudio-app.js` | Zelfstandig palet, pictogrammen, fonts, beeldpaden en onderdelen |
| `public/themes/riskstudio-app/game.css` en `tokens.css` | Volledige lichte opmaak en responsieve app-layout |
| `src/themes/riskstudio-app/renderer.js` | Lichte Galaxy, leverancierspictogrammen, organisatie en beschermingsvelden; dezelfde spelcoördinaten |
| `src/themes/riskstudio-app/shell.js` | App-header, panelen, zoeken, toetsenbordtabs en actuele weerbaarheidsdonut |
| `plugins/easter-eggs/themes/riskstudio-app.css` | Lichte Council-opmaak, alleen bij ingeschakelde plugin |

Het officiële logo komt uit de bestaande lokale RiskStudio-app (`nextjs/public/logo.png`) en is verkleind naar een WebP van 6.042 bytes met bestandsvingerafdruk. De nieuwe achtergrond en spritebron zijn kleine eigen SVG’s; leveranciers en velden worden als vectoren getekend. Er is geen externe download tijdens het spelen. De Council-opmaak gebruikt de bewaarde Classic-geometrie met eigen lichte kleuroverrides. De fontstack kiest Inter indien aanwezig, met de systeemfont als fallback.

Een thema mag optioneel een eigen `shell`-module leveren. `mount(document)` wordt na de CSS-selectie en vóór de gedeelde spelinitialisatie uitgevoerd, zodat bestaande spelknoppen en IDs naar andere panelen kunnen verhuizen. `connect({ game, renderer, requestFrame })` wordt daarna aangeroepen voor presentatiegedrag. Het app-thema leest de simulatie; zoeken verandert alleen de geselecteerde rendererlocatie. Themaselectie en terugschakelen gebeuren bij het herladen van de pagina.

Browsercontrole op 1685, 1440, 1024, 390 en 320 pixels bevestigt starten, richten, scannen, intelligence, pauze, hervatten en resultaat zonder horizontale overflow. De donut volgt werkelijke dienstschade. WebKit mobiel is eveneens gecontroleerd. Classic is opnieuw pixel voor pixel vergeleken met de originele bewaarde schermen op 1440/390px. [Controlebewijs](riskstudio-app-evidence-2026-10-05/verification.json).

## Wat Classic bewaart

| Bestand | Vormgeving |
|---|---|
| `src/themes/classic.js` | Beeldpaden, categorie- en dienstkleuren, iconen, Canvas-kleuren en fonts, browserkleur en verwijzingen naar de themaonderdelen |
| `public/themes/classic/game.css` | Volledige huidige opmaak, indeling, bediening, effecten en responsieve regels |
| `public/themes/classic/tokens.css` | Basiskleuren en UI-fonts |
| `src/themes/classic/renderer.js` | De huidige Galaxy-tekening, inclusief vormen, plaatsing, labels en effecten |
| `plugins/easter-eggs/themes/classic.css` | De oorspronkelijke Galactic Council-opmaak |

De bestaande WebP-beelden blijven behouden op hun huidige adres met bestandsvingerafdruk. `public/style.css`, `src/renderer.js` en `plugins/easter-eggs/plugin.css` blijven kleine compatibiliteitsverwijzingen naar Classic. De gedeelde symbolenmodule bewaart alleen inhoudelijke namen, dienstletters en hulpmiddelen; de gekozen themadefinitie levert de iconen en kleuren. De beheer- en privacypagina houden hun eigen bestaande opmaak.

## Een nieuw experiment toevoegen

1. Kopieer `src/themes/classic.js` naar bijvoorbeeld `src/themes/aurora.js`. Geef de export een eigen naam, zoals `AURORA_THEME`, en stel `id: 'aurora'` en een eigen `name` in.
2. Kopieer de map `public/themes/classic/` naar `public/themes/aurora/`. Pas in de nieuwe `game.css` het token-importpad aan naar `/themes/aurora/tokens.css`. Zet in de nieuwe definitie `stylesheet: '/themes/aurora/game.css'`.
3. Pas de nieuwe CSS, kleuren, fonts of beeldpaden aan. De categorie- en dienstpaletten uit de definitie worden bij opstarten ook aan de HTML-symbolen doorgegeven. Die CSS gebruikt `--risk-incident`, `--risk-cve`, enzovoort, en `--service-portal`, `--service-payments`, `--service-operations`. Gebruik voor categorieën volledige kleuren met zes hextekens; de Canvas-tekening voegt zelf transparantie toe aan sporen en verbindingen.
4. Voor andere Galaxy-vormen of effecten: kopieer `src/themes/classic/renderer.js` naar `src/themes/aurora/renderer.js`, pas die kopie aan en zet `renderer: '/src/themes/aurora/renderer.js'` in de nieuwe definitie. Bij alleen andere kleuren, fonts of iconen kan de bestaande Classic-renderer met het nieuwe palet worden gebruikt.
5. Voor een andere Council-opmaak: kopieer `plugins/easter-eggs/themes/classic.css` naar `plugins/easter-eggs/themes/aurora.css` en stel het bijbehorende `pluginStylesheet`-pad in. Deze stijl wordt alleen geladen als de plugin is ingeschakeld.
6. Importeer de nieuwe definitie in `src/themes/index.js` en voeg haar toe aan `THEMES`:

```js
import { AURORA_THEME } from './aurora.js';
export const THEMES = deepFreeze({ classic: CLASSIC_THEME, aurora: AURORA_THEME });
```

7. Kies `theme: 'aurora'` in de gameconfig en herlaad. Terug naar de oorspronkelijke vormgeving: `theme: 'classic'`.
8. Controleer een echte ronde, speluitleg, pauze, resultaat, mobiele indeling en Council. Voer `rtk proxy npm test`, `rtk proxy npm run build` en `rtk proxy node scripts/validate-build.mjs` uit vóór publicatie.

Themadefinities worden diep bevroren, zodat spelcode de bewaarde instellingen niet per ongeluk overschrijft. De lokale server en Sites-build leveren de themabestanden automatisch. Het bestaande downloadbudget blijft gelden voor alle gepubliceerde bestanden, inclusief bewaarde thema’s. Houd nieuwe beelden compact en controleer het budget bij elk experiment.

## Downloadbudget en build

De build verkleint alle gepubliceerde JS en CSS met de bestaande esbuild-afhankelijkheid. `scripts/browser-file.mjs` wordt gedeeld door de build en budgetcontrole, zodat het budget de exacte gepubliceerde bytes meet. De QR-bibliotheek behoudt haar copyright-, MIT-licentie- en merkmelding. `scripts/validate-build.mjs` vergelijkt elke gemeten bestandsgrootte met het daadwerkelijke Worker-antwoord en controleert die licentiemelding. De bestaande limieten van 800.000 bytes totaal en 650.000 bytes voor beelden blijven gelden, ook met beide thema’s en de optionele Council ingeschakeld. De verkleinde build is afzonderlijk in de browser getest.
