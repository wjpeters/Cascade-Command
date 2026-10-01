# RiskStudio · Cascade Command

Speelbaar prototype voor beurs, Mac met groot scherm en mobiel. Projectcode buiten iCloud opgeslagen, expliciet gekozen op 1 oktober 2026. Dezelfde dag is Sites-publicatie aangevraagd, voorlopig alleen toegankelijk voor Willem.

## Online versie

Sites-locatie: https://riskstudio-cascade-command.qbset.chatgpt.site

De site is op 1 oktober 2026 succesvol privé gepubliceerd. Open de game met je eigen ChatGPT-account. De QR-code opent dezelfde website op je telefoon; log daar met hetzelfde account in. Een telefoon begint een eigen ronde. De Mac hoeft voor de online versie niet aan te blijven. Toegang wordt door Sites afgedwongen; er is geen aparte login gebouwd.

Het online leaderboard staat in een Sites D1-database en blijft behouden na opnieuw publiceren. Online sessies verlopen na 30 minuten; scoreopslag is atomair en herhalen na een verloren antwoord levert dezelfde score op. Lokale en online klassementen zijn afzonderlijk. Lokale scores zijn niet naar Sites gekopieerd.

## Lokaal spelen

- Dubbelklik op **Start Cascade Command.command**. Of voer in deze map `rtk proxy npm start` uit.
- Open http://localhost:4317 op de Mac.
- Klik in het spel op **Speel op je telefoon** en scan de QR-code, of open het getoonde adres op een telefoon op hetzelfde netwerk. De Mac moet aan blijven; sommige gastnetwerken blokkeren onderling verkeer.
- Er zijn geen packages te installeren. Node 20 of nieuwer volstaat.

## Spelregels: supply-chain intelligence

De Galaxy toont Tier 3 → Tier 2 → Tier 1 → kritieke dienst → eigen organisatie. De diensten zijn Klantportaal, Betalingen en Operatie. Alle leveranciers, landen, ratings en risico’s vormen één fictief scenario.

- Houd na 75 seconden zoveel mogelijk diensten operationeel. Bij drie uitgevallen diensten eindigt de ronde eerder.
- Vijf herkenbare categorieën: incident (rode virusvorm), kwetsbaarheid (oranje waarschuwingsdriehoek), geopolitiek (paarse zuilen), regelgeving (blauwe weegschaal) en cyberrating (cyaan oog). Een Critical CVE heeft een extra rode buitenring en geeft 50 procentpunten schade; de andere hoge risico’s geven 25. Kleine grijze LOW-signalen hebben geen bedrijfsimpact in dit scenario en hoeven niet onderschept te worden.
- Risico’s beginnen in verschillende tiers en volgen bestaande verbindingen. Vanaf golf 2 splitsen relevante dreigingen bij gedeelde leveranciers. Kind, oorsprong en identiteit blijven behouden langs de keten.
- Klik/tik vóór een dreiging. Een onderschepper reist vanuit het centrum naar een beschermingsveld. Dat kost 20 energie; energie herstelt met 13 per seconde. Het veld kan ook een laag risico raken, wat 50 punten kost.
- Scan kost 25 energie, vertraagt signalen 5 seconden en herlaadt 18 seconden. De knop onderzoekt de dreiging met de grootste potentiële impact op operationele diensten. Met ‘Kies een leverancier’ selecteer je een dreiging of node met klik/tik. Op de Mac kan dit ook met richten en spatie. Escape annuleert de gerichte selectie; Enter scant in deze modus. Zonder dreiging onderzoekt de knop een leveranciersnode.
- Scan toont een momentopname van tier, type, ernst, mogelijke bedrijfsimpact, land, jurisdictie en cyberrating. Verborgen uitgaande verbindingen van de onderzochte nodes worden blijvend zichtbaar. Dezelfde verbinding telt maar één keer als ontdekking.
- Leaderboard, kritieke diensten en Live Risk Feed zijn tegelijk zichtbaar. Groene, amberkleurige en lege balken tonen de actuele weerbaarheid. De feed toont echte spelgebeurtenissen met simulatietijd. De leverancierskaart staat op desktop naast de Galaxy en op smallere schermen onder de bediening. Op mobiel opent het scanbericht de detailkaart; deze pauzeert de ronde. ‘Terug naar de missie’ hervat de ronde.
- +50 per onderschepte dreiging; +100 voor een relevante dreiging die vanaf golf 2 vóór de eerste mogelijke splitsing is gestopt; +200 per dienst die na afloop nog operationeel is. De kettingreactiebonus geldt één keer per oorspronkelijke dreiging, nooit na een eerdere splitsing.
- Snelle reactie binnen 3 seconden: +25. Combo binnen 2,5 seconden: +25 per extra onderschepping, maximaal +100. Een verkeerde onderschepping of inslag op een operationele dienst: −50. Scores worden niet negatief.
- De eindrapportage toont onderschepte dreigingen, voorkomen kettingreacties, ontdekte afhankelijkheden, operationele diensten, combo en fouten. De kernboodschap: een risico kan drie leveranciers verderop beginnen en toch jouw organisatie raken. RiskStudio maakt die afhankelijkheden zichtbaar.
- Muis/touch schiet. Pijltjes richten, Enter schiet, spatie scant, Escape pauzeert. Shift+pijltjes richten preciezer. Speluitleg openen en wisselen naar een ander tabblad pauzeren een echte ronde. Geluid staat standaard uit.

De volledige uitleg staat onder **?** in de header en **Speluitleg & puntentelling** op het startscherm.

De drie kritieke diensten hebben in de Galaxy en rechterbalk dezelfde identiteit: **A · Klantportaal** (portaal, cyaan), **B · Betalingen** (betaalkaart, paars) en **C · Operatie** (tandwiel, goud). De volledige namen staan in de rechterbalk; de Galaxy houdt alleen de herkenbare pictogrammen en letters. Letters, kleuren en pictogrammen blijven herkenbaar bij schade of uitval; de gezondheidsbalken geven afzonderlijk de actuele weerbaarheid aan.

## Leaderboard en gegevens

Een lokale Node-server bewaart de top 100 per spelversie in `data/leaderboard.json`, buiten iCloud. Het scherm toont de top 10. Mac en telefoons op dezelfde server delen dit klassement. Alleen een zelfgekozen naam en spelresultaat worden opgeslagen, geen e-mailadres of account.

De server herberekent de score aan de hand van een deterministische replay van de spelacties. De client kan geen eigen score insturen. De server controleert actievolgorde, energie, cooldown, sessie en minimale rondeduur. Een sessie kan één score opslaan en verloopt na 30 minuten. Alle spelers binnen dezelfde spelversie krijgen dezelfde scenarioseed. De nieuwe spelregels gebruiken `cascade-2`; eerdere `cascade-1`-scores blijven bewaard en zijn apart op te vragen via de versie-keuze in het leaderboard. Scores met verschillende puntentellingen worden niet gemengd.

**Prototypegrens:** dit is geen productieklare prijsvraag. Replayvalidatie verhindert verzonnen scores, maar geen bots, meerdere namen of meerdere pogingen. Voor echte prijzen ontbreken nog deelnemersidentiteit/deelnameregels, moderatie, beperking van pogingen en een afsluitmoment. De Sites-versie is voorlopig privé. Het is een gedeeld prototypeklassement, geen automatisch dagklassement.

De server luistert op het lokale netwerk voor mobiele deelname. Voor lokaal spelen is geen portforwarding nodig; de Sites-versie draait onafhankelijk van deze lokale server. De app haalt geen klantdata op en wijzigt RiskStudio niet. Beschermingsvelden zijn een spelmetafoor, geen bestaande RiskStudio-functionaliteit.

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

Er is optionele WebMCP-leestoegang tot hetzelfde leaderboard wanneer de browser dit ondersteunt. Niet vereist voor spelen. WebMCP is lokaal gecontroleerd met geldige en ongeldige invoer. Een fysieke telefoon is niet getest; gebruik daarvoor hetzelfde ingelogde ChatGPT-account.

## Controle van de nieuwe spelregels

De regressieset controleert onder meer deterministische replay, energie/cooldown, schade per severity, LOW-signalen, splitsingen met behoud van dreiging, voorkomen kettingreacties, eenmalige ontdekkingen, eindbonus en gescheiden historische klassementen. Browsercontrole omvat speluitleg/pauze, scan-intelligence, Live Risk Feed, mobiele viewport, eindrapportage en opslaan in een apart lokaal testklassement. Geen testscores in de online database geplaatst.

## Ontwerpuitwerking, 1 oktober 2026

Gebaseerd op het door Willem aangeleverde ontwerp: een omlijst commandoscherm, permanent zichtbare contextpanelen, vijf categorie-symbolen, gekleurde actieve ketenroutes met pijlen, kettingreactie-effecten, vraagtekens voor verborgen relaties, een leverancierskaart met gerichte scan en een categorielegenda met punten. Het bestaande eigen logo, de gecentreerde tierlabels in nodevrije zones, QR-code en klassementen blijven behouden. Alle signalen zijn fictieve spelsignalen. De decoratieve genummerde toelichtingskaders uit het ontwerp zijn vertaald naar de bediening, legenda en speluitleg.

Gecontroleerd op schermbreedtes 320, 390, 1280 en 1440 pixels, inclusief gericht scannen, detailkaart, pauzeren/hervatten, ronde-einde en scoreopslag in een geïsoleerd lokaal testklassement. Geen testscores in de online database geplaatst.
