# RiskStudio Cascade Command

**Performance-rapport · 1 oktober 2026**  
Browser, mobiel en huidige technische staat  
Gemeten publicatie: `cascade-2` · Aanvullend lokaal: `cascade-3-14f91b15`

De game heeft een goede, lichte technische basis en loopt vlot in de geteste browsers. De code is nog niet optimaal voor mobiel gebruik. De grootste verbeteringen zijn kleinere afbeeldingen, minder werk tijdens pauze en een compactere mobiele spelindeling. Een andere game-engine is op basis van deze metingen niet nodig.

## 1. Huidige staat

| Onderdeel | Beoordeling | Onderbouwing |
|---|---|---|
| Spelsimulatie | Goed | Kleine, deterministische simulatie; vaste stappen van 60 Hz; identieke replay van score en dienststatus. |
| Browserweergave | Goed in deze test | Circa 60 animatiecallbacks/s in mobiele emulatie en de herhaalde desktopmeting. |
| Eerste bezoek via mobiel internet | Verbeteren | Circa 3,38 MB aan resources; spelbeelden pas na 17,3 s gereed bij 1,6 Mbit/s. |
| Pauze en eindscherm | Onnodig actief | Volledige redraw blijft doorgaan; pauze veroorzaakt circa 1.200 DOM-mutaties/s. |
| Mobiele bediening | Functioneel, indeling verbeteren | Tikken en scannen werken. Detailbediening, diensten en feed staan ver onder het speelveld. |
| Safari-achtige browser | Basiscontrole geslaagd | In WebKit werken starten, scannen en pauzeren, zonder JavaScript-excepties. |
| Online backend | Goede basis; capaciteit niet bewezen | Replaycontrole, transacties, index voor ranking en limiet van tien zichtbare scores. Geen productiebelastingtest uitgevoerd. |
| Testdekking | Goed voor spelregels | De 16 tests van de gemeten basis slagen; de nieuwere lokale versie slaagt voor 20 tests. Performance heeft nog geen automatische acceptatiegrens. |

**Oordeel:** geschikt als speelbaar prototype voor collega’s. Voor betrouwbaar mobiel gebruik op een beurs zijn vooral de eerste download, landschapmodus en het energieverbruik nog te verbeteren. Echte telefoons moeten dit oordeel bevestigen.

## 2. Wat is gemeten?

- Openbare versie: [RiskStudio Cascade Command](https://riskstudio-cascade-command.codexwillem.chatgpt.site).
- Lokale code: `/Users/wp/WPOS-local/projects/riskstudio-cascade-command/`.
- Testcomputer: Apple M1 Pro. Chrome 154.0.8037.58 zonder zichtbaar venster; aanvullende WebKit 26.5-controle.
- Desktop: 1440 × 900, DPR 2. Mobiel: 390 × 844, aangevraagde DPR 3; de game begrenst de canvas-DPR terecht op 2.
- Mobiele CPU-test: viermaal vertraagde JavaScript-uitvoering op dezelfde Mac. Dit simuleert geen specifieke telefoon of mobiele GPU.
- Netwerktest: 200.000 bytes/s download, ongeveer 1,6 Mbit/s, met 150 ms toegevoegde latency en lege browsercache.
- Live samples: 4 s intro, 8 s spelen en 3 s pauze per profiel. Desktopintro aanvullend 6 s herhaald. Ook een deterministische volledige ronde en renderaanroepen bij 10, 35, 55 en 70 s onderzocht.
- Indeling gecontroleerd op 320, 390, 768, 844, 1280 en 1920 pixels breed, inclusief 844 × 390 in landschap.

Bij de broncontrole rond 21:07 waren gepubliceerde `main.js`, `renderer.js`, `engine.js` en CSS bytegelijk aan de toenmalige lokale bestanden. Tijdens de eerste meting veranderde de publicatie; die eerste desktopmeting is daarom geen hoofdbenchmark. De HTML-respons bevat daarnaast hostingtoevoegingen en is niet bytegelijk aan de lokale HTML. De renderer en engine bleven tijdens deze openbare metingen gelijk.

Daarna is lokaal een nieuwe versie toegevoegd met centrale gameplayconfiguratie: `cascade-3-14f91b15`. Een verse controle van de openbare metadata bevestigt nog `cascade-2`. De uitgebreide browsermetingen hieronder horen daarom bij de openbare versie; aanvullende lokale tests en een aparte korte browsercontrole behandelen de nieuwere code. De belangrijkste verbeterpunten zijn in beide codeversies aanwezig.

Er zijn geen online scores of echte online testsessies aangemaakt. Alleen voor het testen van de browserbediening kreeg de testbrowser een lokaal nagemaakt sessieantwoord. Productie-scoreopslag is hiermee niet opnieuw bewezen. De bestaande backendtests gebruiken een geïsoleerde database.

### Resultaten

| Profiel | Spelbeelden gereed na navigatie | Animatiecallbacks/s tijdens spelen | P95 tijd in spelcallback |
|---|---:|---:|---:|
| Mobiele schermmaat, gewone verbinding | 1,50 s | 60,0 | 0,8 ms |
| Mobiele schermmaat, CPU 4× vertraagd | 1,09 s | 60,0 | 2,2 ms |
| Mobiele schermmaat, CPU 4× en traag netwerk | 17,28 s | 59,9 | 2,5 ms |

De verschillen tussen 1,09 en 1,50 s zijn variatie in losse netwerkmetingen, geen bewijs dat CPU-vertraging het laden versnelt. Bij het trage profiel was de eerste zichtbare inhoud er na 2,72 s; het volledige pagina-loadmoment lag op 18,94 s.

De herhaalde desktopintro haalde 60,0 callbacks/s met P95 0,5 ms. Twee herladingen met warme afbeeldingscache hadden een loadmoment van 0,30 en 0,34 s; de drie PNG-bestanden veroorzaakten daarbij geen nieuwe netwerktransfer.

Een aparte lokale browsercontrole van `cascade-3-14f91b15`, opnieuw op 390 × 844 met 4× CPU-vertraging, haalde tijdens spelen 59,9 callbacks/s en P95 2,8 ms. Er waren geen JavaScript-excepties. De pauzetoestand veroorzaakte ook hier circa 1.200 DOM-mutaties/s. Deze [aanvullende lokale meting](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/docs/performance-evidence-2026-10-01/local-browser-results.json) bevestigt het verbeterpunt in de nieuwe code.

**Interpretatie:** dit zijn animatieplanning en JavaScript-tijden, geen meting van alle daadwerkelijk gepresenteerde GPU-frames. Rasterisatie, warmte, batterijverbruik en echte touchlatency zijn niet gemeten. Er is geen betrouwbare veldmeting van INP of Core Web Vitals. De korte samples bewijzen evenmin stabiele performance tijdens uren beursgebruik.

## 3. Wat is al goed ontworpen?

- Native ES-modules en Canvas 2D. Er zit geen zwaar framework, externe fontdownload of physicsbibliotheek in de browser.
- 36 nodes en 39 verbindingen. Dit is een klein netwerk met voorspelbare rekentijd.
- Simulatie en rendering zijn gescheiden. De accumulator gebruikt vaste 60 Hz-stappen, met een begrensde inhaalronde.
- Categorie- en dienstsymbolen gebruiken vooraf gemaakte `Path2D`-objecten.
- De achtergrond staat in CSS en wordt niet iedere frame opnieuw als canvasafbeelding getekend.
- `ResizeObserver` en een DPR-limiet van 2 beperken overbodige canvasresolutie.
- Feed en intelligence worden alleen opnieuw opgebouwd als hun toestand verandert. De QR-bibliotheek wordt pas bij openen geladen.
- Een echte ronde pauzeert bij een verborgen tabblad. Geluid staat standaard uit.
- De online score wordt uit spelacties herberekend; de ranking heeft een samengestelde database-index.

De volledige testautoplay van `cascade-2` duurde 75 simulatieseconden, telde 48 acties en eindigde met 4.425 punten. In 200 opgewarmde lokale replays kostte die ronde mediaan 0,76 ms en P95 1,82 ms. De nieuwere lokale configuratie eindigde met 7.925 punten uit 51 acties; replay kostte mediaan 1,15 ms en P95 1,69 ms. Dit zijn Node-benchmarks op de Mac, geen metingen van een D1-verzoek. De spelsimulatie is hier geen aangetoond knelpunt.

De nieuwe lokale code valideert en bevriest de centrale instellingen eenmalig. Een fingerprint laat het leaderboard automatisch een andere identiteit gebruiken bij gewijzigde spelregels. De standaardgolven starten nu op 0, 20 en 45 s, met meer dreigingen dan de eerder gemeten versie. De netwerkstructuur blijft 36 nodes en 39 verbindingen.

## 4. Verbeterpunten op volgorde van waarde

### P1 · Maak de eerste download kleiner

| Afbeelding | Afmetingen | Bestandsgrootte |
|---|---:|---:|
| `space.png` | 1254 × 1254 | 1.726.816 bytes |
| `sprites.png` | 1254 × 1254 | 1.349.760 bytes |
| `riskstudio-logo.png` | 2048 × 518 | 272.082 bytes |
| **Samen** | | **3.348.658 bytes, circa 3,19 MiB** |

De afbeeldingen vormen ongeveer 99% van de gemeten resource-payload. JavaScript en CSS worden online al gecomprimeerd. De ongecomprimeerde Worker van circa 4,70 MB is geen JavaScriptdownload voor de speler.

**Voorstel:**

- Gebruik kleinere WebP- of AVIF-varianten voor de achtergrond en een formaat met transparantie voor de sprites.
- Verklein het logo naar de werkelijk benodigde weergaveresolutie; het wordt doorgaans 128 tot 185 CSS-pixels breed getoond.
- Onderzoek een kleiner spriteblad. De renderer gebruikt alleen vakken 0 en 3 van de vier vakken.
- Geef noodzakelijke sprites vroeg laadprioriteit en laat zichtbaar zien wanneer de startknop nog op beelden wacht. Stel noodzakelijke spelbeelden niet uit met lazy loading. [Onderbouwing: web.dev over zichtbare afbeeldingen](https://web.dev/articles/browser-level-image-lazy-loading).

**Voorgesteld budget:** maximaal 800 kB voor alle eerste-loadresources samen en maximaal 5 s tot speelgereed op het beschreven trage netwerk. Dit zijn acceptatiedoelen; de uiteindelijke beeldkwaliteit en winst moeten worden gemeten.

De drie afbeeldingen vragen theoretisch circa 16 MiB als gedecodeerde RGBA-pixels, exclusief browserkopieën en canvasbuffers. Dat is een berekening uit de afmetingen, geen gemeten geheugengebruik.

Bron: `public/assets/`; [spritegebruik en image decode](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/src/renderer.js), regels 9–10, 23–26, 83 en 101.

### P1 · Stop het tekenwerk in pauze en werk de HUD bij op verandering

`frame()` roept `renderer.render()` altijd aan. In pauze en op het eindscherm draait daarnaast `updateHud()` elke animatiecallback. Deze functie zet ook ongewijzigde tekst, attributen en breedtes opnieuw. `services.innerHTML` maakt telkens nieuwe elementen.

**Gemeten:** circa 320–354 DOM-mutaties/s tijdens spelen en circa 1.200/s in pauze. Een DOM-mutatie is niet automatisch een volledige layout of paint, maar deze aantallen tonen wel onnodig werk. De huidige Mac houdt dit bij; het is vooral een kans om stroomverbruik en belasting te verlagen.

**Voorstel:**

- Teken het pauze- en eindbeeld één keer. Alleen resize of een relevante zichtbare wijziging vraagt opnieuw tekenen.
- Bewaar de vorige HUD-waarden en schrijf alleen wat verandert. Gebruik vaste elementen voor het aantal diensten.
- Werk tijd en cooldown bij wanneer de zichtbare seconde verandert. Beperk energie-updates tot een zinvolle frequentie, bijvoorbeeld 10–15 Hz.
- Vervang `game.tick % 4 === 0` als HUD-planning door een expliciete updateklok. Op 120 Hz kan dezelfde simulatietick anders meerdere updates veroorzaken.
- Stop leaderboardpolling wanneer de pagina verborgen is. Controleer de `visibilitychange`-afhandeling ook voor demo en intro. [Onderbouwing: MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).

**Acceptatie:** geen periodieke HUD-mutaties of redraws in een stabiel pauze- of eindscherm; spelregels en replay blijven identiek.

Bron: [game-loop en HUD](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/src/main.js), in de nieuwere lokale versie regels 142–163, 173–193 en de leaderboardtimer onderaan.

### P1 · Houd mobiele informatie en bediening bij het speelveld

Er was geen horizontale overflow op de zes gecontroleerde schermbreedtes. Portret laat het canvas en de gewone scanknop goed zien. De volledige mobiele pagina wordt na een scan echter circa 2.167 CSS-pixels hoog.

Bij 390 × 844 staat gericht scannen ongeveer op y=1.238, de dienststatus op y=1.423 en de feed op y=1.619. Dat zijn posities in één gemeten scan-toestand; de hoogte verandert met de inhoud. De speler moet het speelveld verlaten om deze informatie te gebruiken.

In landschap, 844 × 390, is het canvas circa 591 px hoog en staat de scanknop rond y=779. Het scherm kan daardoor de spelactie en bediening niet tegelijk tonen. Dit is een indelingsprobleem, ook wanneer de animatie snel blijft.

**Voorstel:**

- Geef mobiel een compacte missieweergave met zichtbare A/B/C-dienststatus en scanbediening rond het canvas.
- Open legenda, leverancierskaart en uitgebreide feed als panelen; behoud de bestaande pauze bij detailinformatie.
- Voeg een indeling toe voor kleine schermhoogte en landschap, gebaseerd op beschikbare hoogte in plaats van alleen breedte.
- Houd grotere tikvlakken voor belangrijke knoppen aan en test browserbalken en veilige schermranden op echte telefoons.

**Acceptatie:** speelveld, scan en dienststatus passen tijdens een ronde in zowel 390 × 844 als 844 × 390, zonder noodzakelijk scrollen.

Bron: [responsieve indeling](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/public/style.css), vooral regels 42–43; [meetbeeld mobiel](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/docs/performance-evidence-2026-10-01/mobile-playing.png).

### P2 · Vereenvoudig de levering van statische bestanden

De build stopt de afbeeldingen en bronbestanden als base64 in de Worker. Elk niet-gecachet bestandsverzoek gebruikt opnieuw `atob` plus `Uint8Array.from`. In een lokale benchmark van de bestaande build kostte alleen antwoordconstructie en body-uitlezing voor sprites mediaan 100 ms en voor de achtergrond 128 ms. Dit is Node op de Mac; het bewijst geen gelijke Cloudflare-CPU-tijd.

**Voorstel:** gebruik statische assetlevering als Sites dit ondersteunt, of decodeer per Worker-instantie één keer en hergebruik de bytes. Cloudflare biedt hiervoor een eigen statische assetvoorziening; de beschikbaarheid binnen deze Sites-publicatie is nog te controleren. [Cloudflare-documentatie](https://developers.cloudflare.com/workers/static-assets/).

Afbeeldingscache werkt nu: `private, max-age=86400`. JS en CSS hebben `no-cache`; eigen ETags ontbreken. Geef gewijzigde assets een inhoudshash in de bestandsnaam, zodat lange caching geen oude beelden na publicatie vasthoudt. Gebruik `immutable` alleen voor zulke versiebestanden. [Onderbouwing: MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching).

Bron: [Worker assetrespons](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/worker/index.js), regels 12–15; [build](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/scripts/build.mjs).

### P2 · Verminder herhaald canvaswerk waar het rendabel is

Elke redraw tekent ook de vaste ringen, 72 schaalstreepjes, nodes, verborgen-linkmarkeringen en labels. De renderer maakt daarbij nieuwe Maps en arrays, meet tekst en maakt gradients. Gloed gebruikt meerdere `shadowBlur`-aanroepen.

**Voorstel:** cache vaste geometrie en spritegroottes; houd bewegende dreigingen, actieve links en schade als aparte lagen. Bereken labelmaten en verbindingssleutels vooraf. Bied op zwakkere apparaten minder gloed en decoratie. [MDN adviseert vooraf tekenen, minder tekstwerk en terughoudendheid met schaduwen](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas).

Dit heeft minder prioriteit dan afbeeldingen en pauzegedrag: de gemeten callbacktijd is al laag. Extra canvaslagen kosten ook geheugen. Optimaliseer gericht na een telefoonprofiel. Houd de simulatie op 60 Hz; een eventuele lagere renderfrequentie mag score of snelheid niet beïnvloeden.

Bron: [renderer](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/src/renderer.js), regels 34–54 en 57–138.

### P2 · Voeg een vaste performancecontrole toe

- Bewaak payloadgrootte en speelgereed-tijd na iedere publicatie.
- Meet volle rondes, scannen, pauze, hervatten en opnieuw spelen op een iPhone met Safari en een Android-telefoon van bescheiden capaciteit.
- Test op 60 en 120 Hz, in portret en landschap, en minstens tien rondes achter elkaar.
- Leg framevertragingen, invoerreactie en geheugenontwikkeling vast. Controleer na 10–15 minuten op warmte en batterijbelasting.
- Controleer gelijktijdige spelers en scoreverzoeken in een testomgeving. De harde limiet van 500 niet-verbruikte sessies is geen bewezen capaciteit van 500 actieve spelers.
- Neem configuratievarianten mee. De nieuwe validator staat rondes tot 300 s en spawnintervallen vanaf 0,15 s toe. Geldige instellingen kunnen daardoor veel zwaarder zijn dan de huidige standaard. Beoordeel ook het maximum van 1.000 replayacties bij langere, goedkope schoten; configuratievalidatie alleen bewijst geen speelbare performance of opslaanbaarheid.

**Voorgestelde doelen:** normale gameplay minimaal 55 gepresenteerde frames/s op de afgesproken toestellen, P95 frametijd hoogstens 20 ms bij 60 Hz en geen terugkerende blokkades van meer dan 50 ms. Beoordeel alle doelen samen; gemiddelde FPS kan afzonderlijke haperingen verbergen.

## 5. Aanpak voor de volgende verbetering

1. **Eerste wijziging:** afbeeldingen kleiner maken, laadstatus verbeteren en downloadbudget meten.
2. **Tweede wijziging:** pauze/eindscherm stilzetten en HUD-updates op zichtbare wijzigingen beperken.
3. **Derde wijziging:** compacte mobiele missieweergave en aparte landschapindeling.
4. **Daarna:** statische bestandslevering en rendercaching, gestuurd door echte telefoonmetingen.

Behoud de huidige Canvas 2D-architectuur en de gedeelde replay-engine. WebGL, een Web Worker voor de simulatie, objectpools en een frameworkmigratie hebben bij deze kleine game nog geen aangetoonde noodzaak.

## 6. Bewijs en grenzen

De [browsermetingen](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/docs/performance-evidence-2026-10-01/browser-results.json), [hercontrole met bronhashes, cache en WebKit](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/docs/performance-evidence-2026-10-01/followup-results.json), [oorspronkelijke replaybenchmark](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/docs/performance-evidence-2026-10-01/engine-results-cascade2.json) en [nieuwere lokale replay- en assetbenchmark](/Users/wp/WPOS-local/projects/riskstudio-cascade-command/docs/performance-evidence-2026-10-01/engine-results.json) zijn bij dit rapport bewaard.

De gemeten basis slaagt voor 16 tests; de nieuwere lokale code slaagt voor 20 tests, inclusief vier configuratietests. De validator van het reeds aanwezige Worker-bouwresultaat slaagt ook. Voor dit rapport is geen nieuwe build of publicatie uitgevoerd. Ik heb gameplaybroncode, spelregels en leaderboardgegevens niet aangepast; gelijktijdige wijzigingen zijn hierboven apart benoemd.

Geen fysieke telefoon, echte mobiele GPU, batterijmeting, productiebelastingtest of productie-scoreopslag getest. Dit rapport geeft een onderbouwde huidige stand en een verbeterplan, geen garantie voor elk apparaat of netwerk.
