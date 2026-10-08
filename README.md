# RiskStudio · Cascade Command

Speelbaar prototype voor beurs, Mac met groot scherm en mobiel. Projectcode buiten iCloud opgeslagen, expliciet gekozen op 1 oktober 2026. Op 1 oktober 2026 is de game succesvol onder het RiskStudio-account gepubliceerd, met expliciete keuze voor een openbare link.

## Online versie

Sites-locatie onder RiskStudio: https://riskstudio-cascade-command.codexwillem.chatgpt.site

Willem koos op 1 oktober 2026 expliciet openbare toegang: iedereen met de link kan de game openen en met collega’s spelen. De QR-code opent dezelfde website op je telefoon. Een telefoon begint een eigen ronde. De Mac hoeft voor de online versie niet aan te blijven. Toegang wordt door Sites afgedwongen; er is geen aparte login gebouwd.

Het online leaderboard staat in een Sites D1-database en blijft behouden na opnieuw publiceren. Online sessies verlopen na 30 minuten; scoreopslag is atomair en herhalen na een verloren antwoord levert dezelfde score op. Lokale en online klassementen zijn afzonderlijk. Lokale scores zijn niet naar Sites gekopieerd. Deze RiskStudio-publicatie heeft een eigen database; scores van de eerdere privésite zijn niet overgezet. De eerdere privésite op https://riskstudio-cascade-command.qbset.chatgpt.site en de oude koppeling in `.openai/hosting-personal.json` zijn behouden.

## Lokaal spelen

- Dubbelklik op **Start Cascade Command.command**. Of voer in deze map `rtk proxy npm start` uit.
- Open http://localhost:4317 op de Mac.
- Klik in het spel op **Speel op je telefoon** en scan de QR-code, of open het getoonde adres op een telefoon op hetzelfde netwerk. De Mac moet aan blijven; sommige gastnetwerken blokkeren onderling verkeer.
- Er zijn geen packages te installeren. Node 20 of nieuwer volstaat.

## Spelregels: supply-chain intelligence

De Galaxy toont Tier 3 → Tier 2 → Tier 1 → kritieke dienst → eigen organisatie. De diensten zijn Klantportaal, Betalingen en Operatie. Alle leveranciers, landen, ratings en risico’s vormen één fictief scenario.

- Houd na 75 seconden zoveel mogelijk diensten operationeel. Bij drie uitgevallen diensten eindigt de ronde eerder.
- Vijf herkenbare categorieën: incident (rode virusvorm), kwetsbaarheid (oranje waarschuwingsdriehoek), geopolitiek (paarse zuilen), regelgeving (blauwe weegschaal) en cyberrating (cyaan oog). Een Critical CVE heeft een extra rode buitenring en geeft 50 procentpunten schade; de andere hoge risico’s geven 25. Kleine grijze LOW-signalen hebben geen bedrijfsimpact in dit scenario en hoeven niet onderschept te worden.
- Risico’s beginnen in verschillende tiers en volgen bestaande verbindingen. Vanaf golf 2 (seconde 20 in de standaardconfig) splitsen relevante dreigingen bij gedeelde leveranciers. Kind, oorsprong en identiteit blijven behouden langs de keten.
- Klik/tik vóór een dreiging. Een onderschepper reist vanuit het centrum naar een beschermingsveld. Dat kost 20 energie; energie herstelt met 13 per seconde. Het veld kan ook een laag risico raken, wat 50 punten kost.
- Scan kost 25 energie, vertraagt signalen 5 seconden en herlaadt 18 seconden. De knop onderzoekt de dreiging met de grootste potentiële impact op operationele diensten. Met ‘Kies een leverancier’ selecteer je een dreiging of node met klik/tik. Op de Mac kan dit ook met richten en spatie. Escape annuleert de gerichte selectie; Enter scant in deze modus. Zonder dreiging onderzoekt de knop een leveranciersnode.
- Scan toont een momentopname van tier, type, ernst, mogelijke bedrijfsimpact, land, jurisdictie en cyberrating. Verborgen uitgaande verbindingen van de onderzochte nodes worden blijvend zichtbaar. Dezelfde verbinding telt maar één keer als ontdekking.
- Kritieke diensten, Live Risk Feed en leaderboard zijn tegelijk zichtbaar, in die volgorde. Het leaderboard staat onder de Live Risk Feed op desktop, tablet en mobiel. Groene, amberkleurige en lege balken tonen de actuele weerbaarheid. De feed toont echte spelgebeurtenissen met simulatietijd. De leverancierskaart staat op desktop naast de Galaxy en op smallere schermen onder de bediening. Op mobiel opent het scanbericht de detailkaart; deze pauzeert de ronde. ‘Terug naar de missie’ hervat de ronde.
- +50 per onderschepte dreiging; +100 voor een relevante dreiging die vanaf golf 2 vóór de eerste mogelijke splitsing is gestopt; +200 per dienst die na afloop nog operationeel is. De kettingreactiebonus geldt één keer per oorspronkelijke dreiging, nooit na een eerdere splitsing.
- Snelle reactie binnen 3 seconden: +25. Combo binnen 2,5 seconden: +25 per extra onderschepping, maximaal +100. Een verkeerde onderschepping of inslag op een operationele dienst: −50. Scores worden niet negatief.
- De eindrapportage toont onderschepte dreigingen, voorkomen kettingreacties, ontdekte afhankelijkheden, operationele diensten, combo en fouten. De kernboodschap: een risico kan drie leveranciers verderop beginnen en toch jouw organisatie raken. RiskStudio maakt die afhankelijkheden zichtbaar.
- Muis/touch schiet. Pijltjes richten, Enter schiet, spatie scant, Escape pauzeert. Shift+pijltjes richten preciezer. Speluitleg openen en wisselen naar een ander tabblad pauzeren een echte ronde. Geluid staat standaard uit.

De volledige uitleg staat onder **?** in de header en **Speluitleg & puntentelling** op het startscherm.

De drie kritieke diensten hebben in de Galaxy en rechterbalk dezelfde identiteit: **A · Klantportaal** (portaal, cyaan), **B · Betalingen** (betaalkaart, paars) en **C · Operatie** (tandwiel, goud). De volledige namen staan in de rechterbalk; de Galaxy houdt alleen de herkenbare pictogrammen en letters. Letters, kleuren en pictogrammen blijven herkenbaar bij schade of uitval; de gezondheidsbalken geven afzonderlijk de actuele weerbaarheid aan.

## Leaderboard en gegevens

Een lokale Node-server bewaart de top 100 per spelversie in `data/leaderboard.json`, buiten iCloud. Het scherm toont de top 10. Mac en telefoons op dezelfde server delen dit klassement. Alleen een zelfgekozen naam en spelresultaat worden opgeslagen, geen e-mailadres of account.

De server herberekent de score aan de hand van een deterministische replay van de spelacties. De client kan geen eigen score insturen. De server controleert actievolgorde, energie, cooldown, sessie en minimale rondeduur. Een sessie kan één score opslaan en verloopt na 30 minuten. Alle spelers binnen dezelfde spelversie krijgen dezelfde scenarioseed. Er is één zichtbaar leaderboard zonder keuze voor eerdere spelregels. Het gebruikt automatisch de actuele spelversie uit `src/engine.js`, nu `cascade-3` met een afdruk van de gameplayconfig, ook wanneer een oud API-adres een andere versie opvraagt. Een numerieke wijziging aan `src/game-config.js` geeft automatisch een nieuwe score-identiteit. Alleen golfnamen en toelichtingen aanpassen laat de scores intact. Bij wijzigingen aan de spelengine zelf moet de vaste versieprefix worden verhoogd. Scores met een eerdere puntentelling blijven bewaard buiten het zichtbare leaderboard. De spelacties van oude rondes zijn niet opgeslagen, dus oude scores kunnen niet eerlijk worden herberekend naar nieuwe regels.

**Prototypegrens:** dit is geen productieklare prijsvraag. Replayvalidatie verhindert verzonnen scores, maar geen bots, meerdere namen of meerdere pogingen. Voor echte prijzen ontbreken nog deelnemersidentiteit/deelnameregels, beperking van pogingen en een afsluitmoment. De RiskStudio Sites-versie is openbaar toegankelijk via de link. Het is een gedeeld prototypeklassement, geen automatisch dagklassement.

De server luistert op het lokale netwerk voor mobiele deelname. Voor lokaal spelen is geen portforwarding nodig; de Sites-versie draait onafhankelijk van deze lokale server. De app haalt geen klantdata op en wijzigt RiskStudio niet. Beschermingsvelden zijn een spelmetafoor, geen bestaande RiskStudio-functionaliteit.

## Thema kiezen en vormgeving bewaren

De oorspronkelijke look is bewaard als **Classic**. De huidige lokale keuze is **RiskStudio CC v1** (`theme: 'riskstudio-cc-v1'`). **RiskStudio App** en **Classic** blijven via de config terug te kiezen. RiskStudio App heeft de lichte Explore-layout uit de app, leverancierszoeken, intelligence links en een actuele weerbaarheidsdonut rechts. Kies een thema met `theme: 'classic'` of `theme: 'riskstudio-app'` bovenaan [src/game-config.js](src/game-config.js). De beschikbare thema’s staan in [src/themes/index.js](src/themes/index.js). Nieuwe experimenten krijgen eigen CSS, kleuren, beelden, pictogrammen en eventueel een eigen Galaxy-renderer; Classic blijft behouden. Een onbekende naam valt terug op Classic. Thema’s veranderen de spelregels en het klassement niet.

Herlaad de lokale pagina om een keuze toe te passen. De online versie vereist opnieuw bouwen en publiceren. Zie [themahandleiding](docs/THEMAS.md) voor de bestanden en het toevoegen van een nieuw thema. Het themasysteem en RiskStudio App-thema zijn op 5 oktober 2026 gepubliceerd als Sites-versie 10. Alle 48 tests, de build, bouwcontrole en downloadbudget slagen. Classic is op desktop (1440px) en mobiel (390px) pixel voor pixel gelijk aan de vorige weergave. Themaselectie, terugschakelen, een onbekende naam, een ontbrekende stylesheet en mobiele bediening op 320/390px zijn in de browser gecontroleerd met tijdelijke testgegevens. [Controlebewijs](docs/themas-evidence-2026-10-05/verification.json).

## Moeilijkheid beheren

Het centrale bestand is [src/game-config.js](src/game-config.js). Alle tijden zijn seconden; het speelveld gebruikt 1000 × 1000 afstandseenheden. Browsergame en beide servers gebruiken dezelfde instellingen voor spelen en scorecontrole. De puntentelling blijft gelijk.

De nieuwe standaard heeft golven op seconde **0, 20 en 45**. Spawns komen gemiddeld na **2,3 → 1,45 → 1,025 seconden**; dreigingsnelheid loopt op van **50 → 65 → 80**. Vanaf de tweede golf zijn splitsingen mogelijk. De laatste golf begint vaker dichter bij de diensten en heeft meer Critical CVE's. In een volledige gesimuleerde ronde met dezelfde seed ontstaan 53 startsignalen in plaats van 37. Dit is een simulatievergelijking, geen menselijke speeltest.

| Instelling | Wat je ermee verandert |
|---|---|
| `waves[].startsAtSeconds` | Wanneer de druk toeneemt. De eerste golf begint op 0; daarna oplopend. |
| `waves[].spawnIntervalSeconds` | Lager = meer nieuwe signalen. |
| `waves[].spawnJitterSeconds` | Hoeveel extra willekeurige tijd tussen signalen zit. |
| `waves[].speed` | Hoger = minder tijd om te reageren. |
| `waves[].warningSeconds` | Lager = minder waarschuwing voor een signaal gaat bewegen. |
| `waves[].tierWeights` | Relatieve kans op starts in tier 1, 2 en 3. Meer tier 1 = risico begint dichterbij. |
| `waves[].threatWeights` | Relatieve kans per risicotype. Meer `cve` = vaker zware schade; `low` vraagt herkenning. |
| `waves[].maxBranches` | 1 houdt het risico op één route; 2 volgt alle gedeelde routes. |
| `energy.regenerationPerSecond` | Lager = minder vaak schieten/scannen. |
| `shot` | Energieprijs, herlaadtijd, reistijd, straal en levensduur van het beschermingsveld. |
| `scan` | Energieprijs, duur, herlaadtijd en vertraging van signalen. |
| `round` | Rondeduur, scenarioseed, eerste signaal en rustige eindperiode. |

Gewichten hoeven niet samen 100 te zijn: 6/3/1 heeft dezelfde kansen als 60/30/10. Een 0 schakelt die categorie uit. Je kunt 1 t/m 10 golven instellen. De configuratiecontrole weigert onder meer negatieve gewichten, ongeldige tijden en golven in de verkeerde volgorde.

**Aanpassen en toepassen:**

1. Wijzig alleen `src/game-config.js` en sla op. Begin met één waarde tegelijk, bijvoorbeeld de laatste `spawnIntervalSeconds` van 0.9 naar 0.75.
2. Stop de lokale game in het servervenster van Terminal met **Ctrl+C**.
3. Dubbelklik weer op **Start Cascade Command.command** en vernieuw de browserpagina.
4. Speel een ronde. Timer, golfnamen, scanbediening en speluitleg volgen automatisch de config.

Een gewijzigde moeilijkheid krijgt automatisch de actuele lijst in hetzelfde leaderboard. Oude scores blijven bewaard buiten die lijst; ze missen opgeslagen spelacties en kunnen niet eerlijk worden herberekend. Namen/berichten wijzigen geeft geen nieuw klassement. Voor de online game moet de gewijzigde versie opnieuw worden gebouwd en gepubliceerd; lokaal tweaken verandert de reeds gepubliceerde Sites-versie niet.

Twintig regressietests en de Worker-bouwcontrole slagen voor deze uitvoering. De lokale server is herstart en levert dezelfde configuratie-identiteit als de engine. De in-app browserverbinding liep bij deze laatste controle vast; de nieuwe spelweergave is daardoor nog niet visueel gecontroleerd. De eerdere indelingscontrole hoort bij de vorige lokale wijziging.

## Techniek

Dependencyvrije browsergame met native ES-modules, Canvas 2D voor het stabiele netwerk, Image Gen-assets voor het spelbeeld en gewone HTML-bediening. Simulatie en weergave zijn gescheiden. De server en browser gebruiken dezelfde vaste simulatiestappen van 60 Hz. Gestapelde indeling onder 1100px, bediening zonder hoververeiste. Geen externe scripts of fonts.

- `src/engine.js`: deterministische spelregels en replaycontrole.
- `src/renderer.js`: canvasweergave, routepijlen, verborgen-linkmarkeringen en gegenereerde sprites.
- `src/symbols.js`: gedeelde categorie-symbolen voor canvas, legenda en leverancierskaart.
- `src/main.js`: schermen, bediening en scoreflow.
- `server.mjs`: lokale webserver, sessies en leaderboard.
- `design/`: visueel concept en ontwerpkeuzes.
- `public/assets/`: lokale spelbeelden.

Voer `rtk proxy npm test` uit voor betekenisvolle regressietests (Node 22.13+ voor SQLite-tests). Optioneel: `PORT`, `HOST` en `CASCADE_DATA_DIR` instellen. Dit prototype is nog niet in de homepage geïntegreerd; de Sites-versie heeft een afzonderlijke Worker-backend met dezelfde spelregels.

De QR-code wordt lokaal in de browser gemaakt met de meegeleverde MIT-bibliotheek qrcode-generator 2.0.4. Er is geen externe QR-dienst of installatie nodig.

## Sites bouwen

Installeer de ontwikkelpakketten met `rtk proxy npm ci`. `rtk proxy npm run build` maakt één zelfstandige Worker inclusief lokale spelbeelden, CSS, JavaScript en QR-bibliotheek. De browserversie gebruikt geen externe CDN. `rtk proxy node scripts/validate-build.mjs` controleert het bouwresultaat.

Het schema staat in `db/schema.ts`; `rtk proxy npm run db:generate` maakt nieuwe migraties. Gepubliceerde migraties nooit wijzigen. De Sites-workflow pusht broncode naar de bij deze site behorende bronrepository; de lokale checkout blijft buiten iCloud. Gegevens en geheimen zijn uitgesloten. `.openai/hosting.json` bevat alleen de sitekoppeling en logische databasebinding.

Er is optionele WebMCP-leestoegang tot hetzelfde leaderboard wanneer de browser dit ondersteunt. Niet vereist voor spelen. WebMCP is lokaal gecontroleerd met geldige en ongeldige invoer. Een fysieke telefoon is niet getest; de openbare RiskStudio-link kan ook mobiel worden geopend.

## Controle van de nieuwe spelregels

De regressieset controleert onder meer deterministische replay, energie/cooldown, schade per severity, LOW-signalen, splitsingen met behoud van dreiging, voorkomen kettingreacties, eenmalige ontdekkingen, eindbonus en één actueel leaderboard waarbij eerdere scores bewaard blijven buiten het zichtbare klassement. Browsercontrole omvat speluitleg/pauze, scan-intelligence, Live Risk Feed, mobiele viewport, eindrapportage en opslaan in een apart lokaal testklassement. Geen testscores in de online database geplaatst.

## Ontwerpuitwerking, 1 oktober 2026

Gebaseerd op het door Willem aangeleverde ontwerp: een omlijst commandoscherm, permanent zichtbare contextpanelen, vijf categorie-symbolen, gekleurde actieve ketenroutes met pijlen, kettingreactie-effecten, vraagtekens voor verborgen relaties, een leverancierskaart met gerichte scan en een categorielegenda met punten. Het bestaande eigen logo, de gecentreerde tierlabels in nodevrije zones, QR-code en klassementen blijven behouden. Alle signalen zijn fictieve spelsignalen. De decoratieve genummerde toelichtingskaders uit het ontwerp zijn vertaald naar de bediening, legenda en speluitleg.

Gecontroleerd op schermbreedtes 320, 390, 1280 en 1440 pixels, inclusief gericht scannen, detailkaart, pauzeren/hervatten, ronde-einde en scoreopslag in een geïsoleerd lokaal testklassement. Geen testscores in de online database geplaatst.

## Eén actueel leaderboard, 1 oktober 2026

Willem vraagt één leaderboard volgens de laatste spelregels, onder de Live Risk Feed. Lokaal doorgevoerd en herstart; zestien regressietests en de bouwcontrole slagen. De volgorde en afwezigheid van een versie-keuze zijn gecontroleerd op 390, 800 en 1440 pixels. Deze wijzigingen zijn op 1 oktober 2026 succesvol als Sites-versie 2 op dezelfde openbare RiskStudio-link gepubliceerd. De online database is behouden; er zijn geen scores gewist. Voor de ene bestaande lokale score zonder spelacties is voorlopig gekozen voor bewaren buiten het zichtbare leaderboard; een andere gebruikerskeuze is nog niet ontvangen.

## Performance-rapport, 1 oktober 2026

[Rapport](docs/performance-rapport-2026-10-01.md) · [PDF](docs/performance-rapport-2026-10-01.pdf). Codecontrole, browsermetingen, mobiele indeling en geprioriteerde verbeterpunten. Meetbewijs staat onder docs/performance-evidence-2026-10-01/. De openbare cascade-2-versie en de nieuwere lokale cascade-3-configuratie zijn apart benoemd.

## Nieuwste Sites-publicatie, 1 oktober 2026

Sites-versie 3 is succesvol op https://riskstudio-cascade-command.codexwillem.chatgpt.site gepubliceerd. Alle nieuwe lokale bestanden zijn meegenomen, inclusief de configureerbare moeilijkheid en de actuele cascade-3-spelinstellingen. Twintig regressietests en de bouwcontrole slagen. Dezelfde openbare toegang en database zijn behouden. Eerdere scores blijven opgeslagen buiten het leaderboard voor de nieuwe spelinstellingen.

## Performanceverbetering 1, 1 oktober 2026

De lokale spelbeelden zijn omgezet naar WebP en verkleind van 3.348.658 naar
234.404 bytes (93% kleiner). Laadvoortgang, gereedstatus en opnieuw laden na
een fout zijn toegevoegd. Start- en demoknoppen wachten op de spelbeelden.
De originele PNG-bestanden zijn bewaard onder `design/source-assets/`.

`rtk proxy npm run check:budget` controleert het downloadbudget. De build voert
deze controle ook uit en stopt boven 800.000 bytes browserbestanden of
650.000 bytes afbeeldingen. De huidige build telt 412.154 bytes, inclusief
de optionele QR-bibliotheek. `dist/download-budget.json` bevat het overzicht.

Op hetzelfde koude, vertraagde mobiele profiel daalde de mediane tijd tot
speelgereed van 16,14 naar 2,17 seconden. Twintig regressietests, de bouwcontrole
en Chrome/WebKit-controles slagen, inclusief laadfout en herstelactie.
De lokale game is herstart. Deze afbeeldingsverbetering is op 1 oktober 2026 succesvol als Sites-versie 4 gepubliceerd op dezelfde openbare RiskStudio-link. Twintig regressietests, de downloadbudgetcontrole en de Worker-bouwcontrole slagen. Toegang, spelinstellingen en online scoregegevens zijn behouden.

[Resultaat en meetmethode](docs/performance-verbetering-1-2026-10-01.md).
Meetbewijs: `docs/performance-verbetering-1-evidence-2026-10-01/`.

## Performanceverbetering 2, 1 oktober 2026

Pauze en het eindscherm tekenen alleen bij de schermovergang of gewijzigde
canvasafmetingen. De HUD controleert tijdens animatie maximaal 15 keer per
seconde en schrijft alleen gewijzigde waarden. Het aantal diensten behoudt
dezelfde tekstnode. Tijdelijke berichten gebruiken één timer. Ongewijzigde
leaderboardantwoorden bouwen de lijst niet opnieuw op; automatische polling
en animatie stoppen wanneer het tabblad verborgen is, ook in intro en demo.

In de stabiele pauze- en eindschermmeting daalde circa 60 tekenrondes/s naar
0 en circa 1.080 HUD-mutaties/s naar 0. Twintig regressietests, de build en zeven
browsercontroles slagen, inclusief resize, hervatten en een gesimuleerde
120 Hz-klok. Het downloadbudget telt nu 414.275 van maximaal 800.000 bytes.
Spelregels en score-identiteit zijn behouden. Deze tweede wijziging is op
1 oktober 2026 succesvol als Sites-versie 5 op dezelfde openbare link gepubliceerd.

[Resultaat en meetmethode](docs/performance-verbetering-2-2026-10-01.md).
Meetbewijs: `docs/performance-verbetering-2-evidence-2026-10-01/`.

## Tierlabels achter spelobjecten, 1 oktober 2026

De labels TIER 1, TIER 2 en TIER 3 worden als deel van de netwerkachtergrond getekend. Sprites, dreigingsiconen, beschermingsvelden en inslageffecten verschijnen daarna, zodat de labels ze niet meer afdekken. Posities, spelregels en score-identiteit blijven gelijk.

Lokaal gecontroleerd met iconen en effecten die bewust alle drie de labels overlappen. Twintig regressietests en de bouwcontrole slagen. De tijdelijke controlescène is verwijderd en het startscherm is hersteld. Deze wijziging is op 1 oktober 2026 succesvol als Sites-versie 5 op dezelfde openbare RiskStudio-link gepubliceerd.

## Sites-versie 5 gepubliceerd, 1 oktober 2026

De nieuwste lokale versie staat op https://riskstudio-cascade-command.codexwillem.chatgpt.site. Performanceverbetering 2, tierlabels achter spelobjecten en de laatste indeling van de start- en demoknoppen zijn meegenomen. Twintig regressietests, downloadbudget en Worker-bouwcontrole slagen. De laatste HTML/CSS-wijzigingen zijn opnieuw gebouwd en gecontroleerd; spelcode en scorecontrole bleven daarbij gelijk. Openbare toegang, spelinstellingen en online scores zijn behouden.


## Easter Egg-plugin: The Force Behind the Galaxy

De tien teamcameo’s, portretten, geluiden en Galactic Council staan zelfstandig in `plugins/easter-eggs/`. Niels is Mace Windu en Willem is Darth Sidious / Emperor Palpatine, Master of the Galaxy.

De huidige instelling in `src/game-config.js` is `easterEggs: true`. Met `false` worden geen pluginmodules, CSS of portretten geladen en zijn geen pluginobservers, listeners of timers actief. De lokale server geeft dan ook 404 voor pluginroutes. Het online bouwpakket laat de plugin en beelden volledig weg. Na aanpassen: lokaal de server herstarten en de pagina vernieuwen; online opnieuw bouwen en publiceren. Een `.env` is niet nodig.

De plugin verandert geen score, energie, risico’s, timing, scenarioseed of klassementidentiteit. De server gebruikt dezelfde ongewijzigde simulatie. Tijdens echte rondes worden alleen korte tekstmeldingen getoond op desktop. Portretten, geluiden en animaties verschijnen in het start-/eindscherm en de Council. Op mobiel worden onthullingen uitgesteld tot het eindscherm. Geen extra renderlus of continue polling.

Op het startscherm staat bij ingeschakelde plugin een ✦-knop voor de Galactic Council. Verborgen kaarten geven een aanwijzing. Ontdekkingen blijven lokaal op dit apparaat bewaard, ook als je de plugin later uitzet. Alle tien gevonden? De finale toont de hele Council rond Willems troon. Geluid volgt de bestaande geluidsknop. Verminderde animatie wordt gerespecteerd.

Zie `plugins/easter-eggs/README.md` voor de triggers, architectuur en grenzen. De oorspronkelijke reviewportretten staan buiten de game; de plugin gebruikt kleinere transparante WebP’s met bestandsvingerafdrukken. Deze uitbreiding is op 2 oktober 2026 succesvol als Sites-versie 6 op de bestaande openbare RiskStudio-link gepubliceerd.

## Sites-versie 6 gepubliceerd, 2 oktober 2026

De laatste versie inclusief Galactic Council, tien collega-portretten en voornamen staat op https://riskstudio-cascade-command.codexwillem.chatgpt.site. Willem bevestigde publicatie na de expliciete vraag over deze portretten. Alle 31 regressietests, downloadbudget en Worker-bouwcontrole slagen; het bouwpakket bevat de ingeschakelde plugin en alle tien portretten. De gecontroleerde publicatiekopie kwam overeen met alle 114 lokale bronbestanden. Openbare toegang, database en spelregels zijn behouden. De browserbestanden tellen 757.725 bytes van maximaal 800.000. Sites bevestigt succesvolle publicatie van broncommit 8661281ed0fddd8360df5d43c37255c116a4ee5d. Geen aanvullende visuele controle of live-performancehermeting.


## Leaderboardbeheer, 5 oktober 2026

Open **https://riskstudio-cascade-command.codexwillem.chatgpt.site/admin** of dubbelklik op **Beheer Online Leaderboard.command**. De game hoeft niet open te staan en de Mac hoeft niet als server te draaien. Log in met ChatGPT met het RiskStudio-beheerdersaccount `codex+willem@riskstudio.com`.

- Namen, punten en operationele diensten aanpassen; de ranglijst sorteert daarna automatisch opnieuw.
- Individuele scores verwijderen, spelers zoeken en door alle scores bladeren.
- Een eerder klassement kiezen; de game toont nog steeds uitsluitend de actuele spelversie.
- Het volledige gekozen klassement exporteren als JSON, inclusief datum en spelversie. Dit is een bewaarbestand; automatisch terugzetten is niet ingebouwd.
- Alleen het gekozen klassement resetten met de bevestiging **RESET**. Dit verwijdert de scores definitief en beëindigt lopende rondes van die spelversie. Andere klassementen blijven bestaan.

Voor lokale scores: **Beheer Lokaal Leaderboard.command**, of `/admin` op de lokale gameserver. Alleen toegang vanaf deze Mac via localhost is toegestaan. Als de oude server nog draait, stop deze eerst met Ctrl+C en start opnieuw. Online en lokaal blijven twee afzonderlijke databases.

**Toegang:** Sites verzorgt de ChatGPT-aanmelding en levert geverifieerde gebruikersheaders. Elke beheer-API controleert deze server-side tegen de expliciete `CASCADE_ADMIN_EMAILS`-lijst in de Sites-omgeving. Zonder configuratie of geldige aanmelding blijft beheer gesloten. De spelpagina blijft openbaar. Het lokale beheer vertrouwt uitsluitend loopbackverbindingen met een lokale hostnaam, nooit ingestuurde Sites-identiteitsheaders. Schrijfacties vereisen bovendien dezelfde website als oorsprong. Er zijn geen nieuwe wachtwoorden of tokens opgeslagen.

Bewerken en verwijderen weigeren achterhaalde invoer wanneer iemand dezelfde score intussen heeft aangepast. De oorspronkelijke speeldatum blijft behouden. Een al ingediende ronde kan een verwijderde score niet opnieuw insturen. Resetten gebeurt online atomair; lokaal wordt eerst het scorebestand veilig vervangen voordat rondes vervallen.

37 tests slagen, inclusief de bestaande speltests en controles voor toegang, invoer, paginering, oude klassementen, opnieuw insturen na verwijderen, reset en lokale opslag na herstart. De Worker-bouwcontrole slaagt. Browsercontrole met uitsluitend tijdelijke testgegevens bevestigt bewerken, hersorteren, eerdere klassementen en resetbevestiging. Geen horizontale overflow bij 320 en 390 pixels. Echte opgeslagen highscores zijn tijdens het bouwen en testen niet gewijzigd. De echte ChatGPT-inlogflow wordt door Sites verzorgd en is niet met een beheerderssessie getest.


## Gebruiksstatistieken, 5 oktober 2026

Open `/admin#stats` en kies **Statistieken**. Dezelfde beheerdersrechten gelden als voor het leaderboard. De statistieken omvatten alle spelversies; lokaal en online blijven gescheiden.

- Bezoeken: een geopende spelpagina die het meetverzoek verstuurt. Herladen telt opnieuw; een bezoek aan beheer telt niet.
- Gestarte rondes: succesvol aangemaakte spelsessies. Demo’s tellen niet mee.
- Afgeronde rondes: het spel stuurt automatisch het einde in, ook zonder een naam of score op het leaderboard. De server controleert de spelacties en minimale rondeduur met dezelfde replay als bij scoreopslag.
- Opgeslagen scores: eenmalig geteld bij het opslaan van een ronde. Opnieuw proberen na een verloren antwoord telt niet dubbel.
- Periodekeuze: vandaag, 7, 30, 90 dagen of sinds de start van de metingen. Daggrenzen en tijden volgen Europe/Amsterdam. De grafiek toont maximaal 30 dagen; de totalen volgen de volledige geselecteerde periode.
- Inzichten: afrondingspercentage, gemiddelde simulatieduur en score, apparaat, browser, besturingssysteem, taal, globale schermbreedteklasse, land, verwijzende website en recente rondes. Alleen de hostnaam van de verwijzer blijft bewaard, zonder URL-pad of zoekparameters.
- IP-overzicht: maximaal de 20 actiefste adressen in de gekozen periode en maximaal de afgelopen 30 dagen. ‘Unieke IP-adressen’ betreft bezoeken met een beschikbaar adres; dit zijn geen unieke personen. Een gedeelde wifi-verbinding, VPN of wisselend adres beperkt de interpretatie.

Online gebruikt de server uitsluitend `CF-Connecting-IP`, nooit een door de browser ingestuurd IP of een willekeurige `X-Forwarded-For`-waarde. Land gebruikt beschikbare Cloudflare-landmetadata. Het bekende gedeelde Cloudflare-Workeradres wordt als onbekend behandeld. Zie [Cloudflare: HTTP-headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/). Ontbrekende gegevens krijgen ‘Niet beschikbaar’ of ‘Onbekend’; de IP-dekkingsregel maakt dit zichtbaar. De mate waarin Sites oorspronkelijke bezoekersmetadata doorgeeft is een hostingafhankelijkheid. Lokaal komt het IP van de socket; er wordt geen IP-geolocatiedienst aangeroepen.

Volledige IP-adressen zijn 30 dagen zichtbaar, overige details 90 dagen. Opschoning gebeurt bij volgende meet- of statistiekverzoeken. Bij een volledig ongebruikte site is er dus geen apart nachtelijk verwijderproces. Anonieme dagtotalen blijven behouden. Er worden geen analyticscookies, blijvende bezoekerscodes, namen, volledige User-Agent-headers of precieze locaties aan statistieken toegevoegd. De bestaande openbare leaderboardnamen zijn apart opgeslagen. Spelers zien een korte melding met een link naar `/privacy.html`.

Leaderboardbewerkingen en resets veranderen de historische gebruiksmetingen niet. ‘Niet afgerond’ kan nog lopend betekenen of een ontbrekend eindbericht. Metingen zijn geen garantie op menselijke bezoeken: bots, netwerkverlies en geblokkeerde scripts kunnen de cijfers beïnvloeden. Er is geen historische backfill van bestaande scores naar vermeende bezoek- of speeltellingen.

**Opslag:** online nieuwe tabellen `analytics_events` en `analytics_daily` via de aanvullende Drizzle-migratie `0001_free_firedrake.sql`; bestaande tabellen en scores worden niet gewijzigd. Lokaal `data/analytics.json`, buiten iCloud, met beperkte bestandsrechten. Een statistiekfout blokkeert het starten of opslaan van een spelronde niet. Een onleesbaar lokaal statistiekbestand wordt niet overschreven met een leeg bestand.

**Controle:** 44 tests slagen, inclusief herhaalde verzoeken, tellen zonder leaderboardinzending, privacygrenzen, Amsterdamse dagfilters, IP- en detailretentie, behoud van totalen, afgeschermde API en lokale HTTP-compatibiliteit. Worker-bouwcontrole en downloadbudget slagen. Een echte lokale browsertestronde is automatisch als bezoek/start/einde geregistreerd zonder scoreopslag; dezelfde statistieken zijn in de beheerinterface bevestigd. Geen horizontale overflow op 320 en 390 pixels. De reeds ingelogde online beheeromgeving is gelezen; bestaande toegang werkt. Er zijn geen bestaande highscores veranderd of IP-adressen naar WPOS gekopieerd.

Het RiskStudio App-thema is op desktop en mobiel gecontroleerd, inclusief de verkleinde lokale build. Classic blijft pixel voor pixel gelijk. [Nieuw controlebewijs](docs/riskstudio-app-evidence-2026-10-05/verification.json). Sites-versie 10 publiceerde het RiskStudio App-thema. De actuele themakeuze volgt `src/game-config.js`.

## Sites-versie 10 gepubliceerd, 5 oktober 2026

Het RiskStudio App-thema en het themasysteem staan op https://riskstudio-cascade-command.codexwillem.chatgpt.site. Classic blijft bewaard en is via de config terug te kiezen. De gecontroleerde broncommit is `17a6a219de3326b8909fae85c2e759295537d986`. Sites bevestigt geslaagde productiepublicatie. Openbare toegang, bestaande database en score-editie `cascade-3-14f91b15` zijn behouden. De eerder uitgevoerde 48 tests en lokale build-/browsercontroles gelden voor deze ongewijzigde bron; geen nieuwe online browsertest uitgevoerd.

## Apart live leaderboard, 6 oktober 2026

Open `/leaderboard` op een tweede monitor of dubbelklik op **Toon Lokaal Leaderboard.command**. De pagina toont een grote top 10 met podium, de QR-code van de game en een knop voor volledig scherm. De game bevat hiervoor **Apart scherm ↗**. De pagina volgt het gekozen gamethema; met `?theme=classic` of `?theme=riskstudio-app` kan de monitor zelfstandig donker of licht worden getoond. De huidige lokale config staat op Classic.

Scores worden elke twee seconden opgehaald. Bij verbindingsverlies blijven de laatste scores zichtbaar en probeert de pagina opnieuw; na een achtergrondtab wordt direct ververst. QR en link openen dezelfde game, lokaal via wifi of na Sites-publicatie via het openbare gameadres. De pagina gebruikt dezelfde score-API en voegt geen klassement toe.

53 tests, downloadbudget en Worker-bouwcontrole slagen. Top 10, QR, een scorewijziging binnen twee seconden, reset, herstel van de verbinding, beide thema’s, volledig scherm en mobiele indeling zijn met tijdelijke fictieve scores gecontroleerd. De uitbreiding is lokaal klaar; nog geen nieuwe Sites-publicatie. [Gebruik en controle](docs/LEADERBOARD_SCHERM.md).

## Sites-versie 13 gepubliceerd, 6 oktober 2026

De afzonderlijke [live leaderboardpagina](https://riskstudio-cascade-command.codexwillem.chatgpt.site/leaderboard) staat op de bestaande openbare RiskStudio-site. De gepubliceerde bron kiest RiskStudio App; Classic blijft via `?theme=classic` te kiezen voor het monitorscherm. Top 10, game-QR, volledig scherm en automatische updates iedere twee seconden zijn meegenomen. Broncommit `4107c1b5b68ece190033bfd11e7d5498e71e91fa`; native Sites-resultaat bevestigt succes. Build en Worker-controle slagen. Bestaande openbare toegang en databasebinding zijn behouden. Geen aanvullende online browsertest; eerdere geïsoleerde browsercontroles blijven het functionele bewijs. [Publicatiebewijs](docs/publicatie-leaderboard-2026-10-06.json).

## Winnaarsanimaties, 6 oktober 2026

Het aparte leaderboard heeft bewegende goud-/zilver-/bronseffecten voor de top 3: kroon, beker, medaille, glans en korte confettipulsen. Nieuwe podiumplekken vieren direct hun entree. De scores en QR blijven vast; pauzeren, minder beweging en beide thema’s zijn gecontroleerd. 53 tests en browsercontrole op zes schermmaten slagen. [Details en bewijs](docs/WINNAARSANIMATIES.md).

## Sites-versie 14 gepubliceerd, 6 oktober 2026

De top 3-winnaarsanimaties staan op [het live leaderboard](https://riskstudio-cascade-command.codexwillem.chatgpt.site/leaderboard): zwevende kroon, beker en medaille, glans, confetti en een entree bij een nieuwe podiumplek. Pauzeknop en minder beweging zijn meegenomen. 53 tests, browsercontrole op zes schermmaten, downloadbudget en Worker-bouwcontrole slagen. Native Sites-publicatiesucces bevestigd voor broncommit `4b48903ca1cd78cac01cd704d57338b7b80304a7`; bestaande toegang en databasebinding behouden. [Details](docs/WINNAARSANIMATIES.md), [publicatiebewijs](docs/publicatie-winnaars-2026-10-06.json).

## Prijzen en dagelijkse troostprijs, 6 oktober 2026

De missiekaart op `/leaderboard` draait iedere twaalf seconden naar configureerbare prijzen met afbeeldingen. Instellingen staan onder `GAME_CONFIG.leaderboard`; demo-prijzen meegeleverd. In `/admin` kiest de beheerder één troostprijswinnaar per Nederlandse kalenderdag uit alle spelersnamen van het huidige klassement, met uitsluiting van alle scores van de podiumspelers. De uitslag verschijnt live en blijft opgeslagen. [Handleiding](docs/PRIJZEN_EN_TREKKING.md).

Sites-versie 15 met deze prijzenuitbreiding is succesvol live gepubliceerd. 60 tests, browsercontrole van beide kaartzijden in beide thema’s en bouw-/budgetcontrole slagen. [Publicatiebewijs](docs/publicatie-prijzen-2026-10-06.json).

## Game-domein hersteld, 6 oktober 2026

Sites-versie 16 stuurt de browser vanaf `https://game.riskstudio.com` eerst naar het bestaande Sites-adres, vóór game-/meet-/beheerverzoeken. De tussenserver leverde de game via een proxy, waardoor starten met 403 werd geweigerd. Pad, parameters en fragment blijven behouden; game, leaderboard en beheer zijn geïsoleerd getest. 62 tests en bouwcontrole slagen. De huidige config schakelt de optionele Council-plugin uit. [Diagnose en werking](docs/GAME_DOMEIN.md), [publicatiebewijs](docs/publicatie-game-domein-2026-10-06.json).

## Mobile-first RiskStudio App, 7 oktober 2026

Het goedgekeurde mobiele voorstel is verwerkt in het bestaande RiskStudio App-thema: één vast speelscherm, compacte dienststatus, grote Scan-knop, onderste navigatie en gepauzeerde Intel-/Feed-/Rankingpanelen. De ronde gebruikt echte intelligence en dezelfde spelregels, energie en scorevalidatie. Start en eindrapportage zijn voor een telefoon ingericht; de scanknop kan links of rechts staan. Landscape krijgt een brede Galaxy met bediening rechts.

Chrome en WebKit, kleine telefoons, landscape, tablet/desktop en een volledige ronde met echte lokale scorevalidatie zijn gecontroleerd met afzonderlijke tijdelijke testgegevens. Classic-bronbestanden en score-editie `cascade-3-14f91b15` blijven behouden. Geen fysieke telefoontest. [Werking](docs/THEMAS.md#mobile-first-7-oktober-2026) · [Controlebewijs](docs/mobile-first-evidence-2026-10-07/verification.json).

**Publicatie:** Sites-versie 17 staat succesvol op de bestaande openbare RiskStudio-link, met broncommit `8a202255cedbc560079e87b9575a22c98568fa18`. Openbare toegang, databasebinding en score-editie behouden. Native Sites-resultaat bevestigt succes; geen aanvullende online browsertest. [Publicatiebewijs](docs/publicatie-mobile-first-2026-10-07.json).

## RiskStudio CC v1, 7 oktober 2026

Zelfstandig `riskstudio-cc-v1`-thema als kopie van RiskStudio App, met een geanimeerd mobiel opstartscherm, echte laadvoortgang, game-lobby, missie-intro, game-navigatie en paneelovergangen. De simulatie start pas na de intro en blijft gepauzeerd tot een paneelovergang klaar is. Minder beweging en laadfoutherstel zijn ondersteund. Alle oorspronkelijke RiskStudio App-bestanden blijven gelijk. Spelregels en score-editie blijven behouden. [Themahandleiding](docs/RISKSTUDIO_CC_V1.md) · [Controlebewijs](docs/riskstudio-cc-v1-evidence-2026-10-07/verification.json).

**RiskStudio CC v1 gepubliceerd:** definitieve Sites-versie 19 staat succesvol op de bestaande openbare game. Broncommit `87035a4478847d5247d82480084ecbbf468aa143`; originele thema’s, openbare toegang, database en score-editie behouden. Geen aanvullende online browsertest. [Publicatiebewijs](docs/publicatie-riskstudio-cc-v1-2026-10-07.json).
