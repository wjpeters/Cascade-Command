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

**Prototypegrens:** dit is geen productieklare prijsvraag. Replayvalidatie verhindert verzonnen scores, maar geen bots, meerdere namen of meerdere pogingen. Voor echte prijzen ontbreken nog deelnemersidentiteit/deelnameregels, moderatie, beperking van pogingen en een afsluitmoment. De RiskStudio Sites-versie is openbaar toegankelijk via de link. Het is een gedeeld prototypeklassement, geen automatisch dagklassement.

De server luistert op het lokale netwerk voor mobiele deelname. Voor lokaal spelen is geen portforwarding nodig; de Sites-versie draait onafhankelijk van deze lokale server. De app haalt geen klantdata op en wijzigt RiskStudio niet. Beschermingsvelden zijn een spelmetafoor, geen bestaande RiskStudio-functionaliteit.

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
