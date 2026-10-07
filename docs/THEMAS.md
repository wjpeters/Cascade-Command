# Thema’s voor Cascade Command

De oorspronkelijke vormgeving is vastgelegd als **Classic** (`classic`). Het nieuwe **RiskStudio App**-thema (`riskstudio-app`) gebruikt de lichte Explore-workspace uit de aangeleverde RiskStudio-screenshot. Dit is het eerste bewaarde thema, van 5 oktober 2026. Nieuwe experimenten krijgen een eigen naam en eigen bestanden. Houd Classic intact om de oorspronkelijke look terug te kunnen kiezen.

## Een thema kiezen

Wijzig bovenaan `src/game-config.js`:

```js
export const GAME_CONFIG = {
  theme: 'riskstudio-app',
  // Overige spelinstellingen…
};
```

De beschikbare namen staan in `src/themes/index.js`. Er zijn twee bewaarde thema’s: `classic` en `riskstudio-app`. De actuele lokale game gebruikt `riskstudio-app`; `classic` blijft beschikbaar. Kies `classic` voor de oorspronkelijke vormgeving. Herlaad de lokale game na een wijziging. Voor de online game: opnieuw bouwen en publiceren. Een lokaal gewijzigde keuze past de al gepubliceerde site niet aan.

Een ontbrekende of onbekende naam valt terug op Classic. Als de stylesheet van een geregistreerd thema niet kan laden, blijft de vorige stylesheet aanwezig en start de game met Classic. De loader wacht maximaal acht seconden op een nieuwe stylesheet. Het actieve thema staat als `data-theme` op het HTML-element, voor inspectie en eventuele themaspecifieke selectors.

Een themawissel verandert geen spelregels, moeilijkheid, scenarioseed, scorevalidatie, score-identiteit of opgeslagen klassement. De keuze is een instelling voor de gehele game, geen persoonlijke spelersvoorkeur.

## RiskStudio App

De nieuwe vormgeving volgt de RiskStudio Explore-workspace uit de screenshot van 22 september 2026: het officiële logo, een witte app-header met de werkwijze, witte panelen met subtiele randen, het blauwe accent `#4670dd`, en een lichte Galaxy met een blauwe buitenring en een geel centrum.

Het linkerpaneel toont de missie, leverancierszoekfunctie, huidige focus, intelligence en de tabs Insights / Risico’s. Zoeken selecteert een echte leverancier uit de huidige Galaxy en markeert de locatie; een scan blijft nodig voor intelligence. Het rechterpaneel heeft een donut die de actuele weerbaarheid van de drie diensten volgt, de dienststatus, Live Risk Feed en het volledige klassement. De werkwijze bovenaan geeft app-context; de spelknoppen blijven op hun eigen plek. Op mobiel gebruikt het thema sinds 7 oktober 2026 een vaste missiepagina. Score, tijd, drie dienstbalken, Galaxy, energie en Scan blijven samen zichtbaar. Intel, Feed en Ranking openen in een gepauzeerd paneel vanaf de onderkant.

| Bestand | Vormgeving |
|---|---|
| `src/themes/riskstudio-app.js` | Zelfstandig palet, pictogrammen, fonts, beeldpaden en onderdelen |
| `public/themes/riskstudio-app/game.css` en `tokens.css` | Volledige lichte opmaak en responsieve app-layout |
| `src/themes/riskstudio-app/renderer.js` | Lichte Galaxy, leverancierspictogrammen, organisatie en beschermingsvelden; dezelfde spelcoördinaten |
| `src/themes/riskstudio-app/shell.js` | App-header, panelen, zoeken, toetsenbordtabs en actuele weerbaarheidsdonut |
| `src/themes/riskstudio-app/mobile.js` | Mobiele DOM-indeling, panelen, pauze/hervatten, dienststatus en links-/rechtshandige scanbediening |
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

## Apart leaderboard, 6 oktober 2026

`/leaderboard` volgt dezelfde themaconfiguratie. De monitor kan ook `?theme=classic` of `?theme=riskstudio-app` kiezen zonder het spelthema te veranderen. Een thema levert hiervoor `leaderboardStylesheet: '/themes/<id>/leaderboard.css'`; die stylesheet importeert de bijbehorende tokens en de gedeelde `/leaderboard.css`. `initializeTheme(id, document, 'leaderboard')` laadt die stijl, het logo en de themakleuren, zonder gameshell of Canvas-renderer.

Nieuwe thema’s moeten ook hun eigen monitorstylesheet toevoegen. De bewaakte gamekosten blijven maximaal 800.000 bytes. De zelfstandige monitorbestanden hebben een aparte limiet van 25.000 bytes; alle bestanden samen maximaal 825.000 bytes. De beeldlimiet blijft 650.000 bytes. [Monitorhandleiding](LEADERBOARD_SCHERM.md).

## Mobile first, 7 oktober 2026

Het goedgekeurde ontwerp is verwerkt binnen `riskstudio-app`. Onder 761 px en bij een liggend scherm tot 1000 px breed en 500 px hoog gebruikt de game de mobiele missiepagina. Panelen verplaatsen de bestaande interactieve onderdelen; IDs en echte spelgegevens blijven behouden. Bij terugschakelen naar desktop worden de onderdelen op hun oorspronkelijke plaats teruggezet.

- Start: één hoofdknop, korte instructies, echte Galaxy-preview en de bestaande privacy-uitleg.
- Spelen: score, tijd, dienstweerbaarheid, Galaxy, laatste feedmelding, energie en Scan binnen de viewport.
- Scan: een geslaagde mobiele scan opent de echte leveranciersintelligence en pauzeert de ronde.
- Intel, Feed en Ranking: native dialoog vanaf de onderkant, automatisch hervatten alleen als het paneel de ronde zelf pauzeerde. Een bestaande pauze blijft behouden. Escape en de sluitknop gebruiken dezelfde levenscyclus.
- Gericht scannen: vanuit Intel terug naar het veld, daarna een leverancier of dreiging kiezen. Bestaande energieprijs en cooldown gelden.
- Missiemenu: speluitleg, geluid, volledig scherm, demo, ranking, privacy en scan links/rechts. Alleen de handvoorkeur wordt lokaal op het apparaat bewaard.
- Resultaat: scrollbaar formulier met 16px-invoer en afzonderlijke knoppen, ook wanneer het toetsenbord ruimte inneemt.
- Landscape: Galaxy links, compacte status en bediening rechts. Tablet en desktop behouden hun bestaande zijpanelen.

De gameplayconfig, engine, score-identiteit, API, database en Classic-themaonderdelen zijn niet aangepast. De grotere dreigingssymbolen wijzigen alleen de tekening; hitboxes en spelcoördinaten blijven gelijk.

Browsercontroles omvatten Chrome op 320/360/390/430 px, liggend 844×390 en tablet/desktop, plus WebKit op 390×844. Start, automatische scan, gerichte scan, panelen sluiten met Escape, hervatten, handvoorkeur en resultaat zijn gecontroleerd. Een volledige ronde is succesvol door de server gevalideerd en opgeslagen in een afzonderlijk tijdelijk testklassement. Geen testscores in de online database geplaatst. Een fysieke iPhone/Android is niet getest. Zie [controlebewijs](mobile-first-evidence-2026-10-07/verification.json).
