# RiskStudio CC v1

Zelfstandig thema `riskstudio-cc-v1`, gemaakt op verzoek van Willem op 7 oktober 2026 als kopie van `riskstudio-app`. De oorspronkelijke themaonderdelen van RiskStudio App en Classic blijven behouden. De actieve keuze staat in `src/game-config.js`; terug naar `riskstudio-app` of `classic` blijft mogelijk zonder ander klassement.

## Mobiele gamebeleving

- Geanimeerd opstartscherm met RiskStudio-logo, ketenringen en echte laadvoortgang. Overslaan blijft mogelijk. Bij een laadfout komt de bestaande herstelknop in beeld; het scherm claimt geen gereedheid zonder spelbeelden. Een vangnet na 6,5 seconden brengt de laad-/herstelbediening terug in beeld.
- Game-lobby met Cascade Command, een echte Galaxy-preview, missiegegevens, één startknop en navigatie naar uitleg, ranking en menu.
- Korte missie-intro 3, 2, 1, GO. De simulatie staat in `launching` en begint pas daarna. Overslaan start de missie eerder; bij een verborgen tabblad start de ronde gepauzeerd.
- Game-navigatie met actieve knoppen en zachte beweging. In de ronde: Galaxy, Intel, Feed en Ranking.
- Paneelentree en -uitgang. Hervatten gebeurt pas nadat de afsluitanimatie klaar is. Dubbele navigatie en wisselen naar desktop herstellen bestaande elementen veilig.
- Compacte HUD, duidelijke dienstbalken, een stevig vormgegeven Scan-knop en echte schademeldingen. Geen camera-beweging of gewijzigde hitboxes.
- Eindrapportage met stijl passend bij drie, enkele of nul operationele diensten. Werkelijke punten en scoreopslag blijven leidend.
- Minder beweging schakelt extra animaties en countdownvertraging uit. Desktop houdt de Explore-werkruimte. Landscape en kleine telefoons zijn meegenomen.

## Eigen bestanden

`src/themes/riskstudio-cc-v1.js`, `src/themes/riskstudio-cc-v1/` en `public/themes/riskstudio-cc-v1/` bevatten de zelfstandige definitie, shell, mobiele indeling, renderer, animaties en opmaak. De Council heeft een eigen gekopieerde stylesheet. Bestaande kleine logo-/achtergrond-/sprite-assets worden gedeeld; die beelden zijn niet aangepast.

De engine, moeilijkheid, energie, puntentelling, API en database zijn niet gewijzigd. Alleen de themakeuze in de gameplayconfig is gewijzigd; deze keuze telt niet mee voor score-identiteit `cascade-3-14f91b15`.

## Controle

62 regressietests slagen, inclusief de nieuwe themakeuze in de vergelijking van score-identiteiten en replay. Chrome op 320/360/390/430 px, landscape, tablet en desktop; WebKit mobiel. Launching houdt tick 0; een sluitanimatie houdt de simulatietick vast totdat de ronde hervat. Minder beweging, laadfout/herstel, snelle navigatie en desktop-herstel zijn getest. Een volledige echte lokale ronde is gevalideerd en opgeslagen, HTTP 201, in apart tijdelijk testklassement. Geen testscores in de online database. De originele RiskStudio App-bestanden zijn met SHA-256 vergeleken en ongewijzigd. Geen fysieke iPhone/Android getest. [Controlebewijs](riskstudio-cc-v1-evidence-2026-10-07/verification.json).

Navigatie tijdens een vertraagde sessie-aanvraag is aanvullend getest: Ranking sluit vóór de missie-intro en de echte ronde start zonder open dialoog.
