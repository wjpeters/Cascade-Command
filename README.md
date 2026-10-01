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

## Spelregels

Houd drie kritieke diensten 75 seconden beschikbaar. Incidenten reizen van externe leveranciers door het netwerk naar je diensten. Vanaf fase twee splitsen ze zich bij gedeelde leveranciers.

- Klik/tik waar je een beschermingsveld wilt plaatsen. De onderschepper reist eerst vanuit het centrum naar die plek: richt iets vóór het incident.
- Een veld kost 20 energie. Energie herstelt automatisch met 13 per seconde. Velden blijven kort actief en kunnen meerdere incidenten raken.
- Scan toont verborgen routes en vertraagt incidenten vijf seconden. Daarna volgt een afkoeltijd; scan is elke 18 seconden beschikbaar.
- Elke dienst heeft vier gezondheidspunten. Geen diensten over betekent einde van de ronde.
- Onderscheppingen geven punten. Snelle opeenvolgende onderscheppingen geven combo’s. Behouden gezondheid en diensten geven aan het einde een continuïteitsbonus.
- Met toetsenbord: pijltjes richten, Enter schieten, spatie scannen, Escape pauzeren. Shift+pijltjes richten preciezer.
- Geluid is standaard uit; rechtsboven kun je het inschakelen. De demonstratie bij start speelt automatisch. Achtergrondtabbladen pauzeren een echte ronde.

## Leaderboard en gegevens

Een lokale Node-server bewaart de top 100 in `data/leaderboard.json`, buiten iCloud. Het scherm toont de top 10. Mac en telefoons op dezelfde server delen dit klassement. Alleen een zelfgekozen naam en spelresultaat worden opgeslagen, geen e-mailadres of account.

De server herberekent de score aan de hand van een deterministische replay van de spelacties. De client kan geen eigen score insturen. De server controleert actievolgorde, energie, cooldown, sessie en minimale rondeduur. Een sessie kan één score opslaan en verloopt na 30 minuten. Alle spelers krijgen dezelfde scenarioseed.

**Prototypegrens:** dit is geen productieklare prijsvraag. Replayvalidatie verhindert verzonnen scores, maar geen bots, meerdere namen of meerdere pogingen. Voor echte prijzen ontbreken nog deelnemersidentiteit/deelnameregels, moderatie, beperking van pogingen en een afsluitmoment. De Sites-versie is voorlopig privé. Het is een gedeeld prototypeklassement, geen automatisch dagklassement.

De server luistert op het lokale netwerk voor mobiele deelname. Voor lokaal spelen is geen portforwarding nodig; de Sites-versie draait onafhankelijk van deze lokale server. De app haalt geen klantdata op en wijzigt RiskStudio niet. Beschermingsvelden zijn een spelmetafoor, geen bestaande RiskStudio-functionaliteit.

## Techniek

Dependencyvrije browsergame met native ES-modules, Canvas 2D voor het stabiele netwerk, Image Gen-assets voor het spelbeeld en gewone HTML-bediening. Simulatie en weergave zijn gescheiden. De server en browser gebruiken dezelfde vaste simulatiestappen van 60 Hz. Mobiele indeling vanaf 760px, bediening zonder hoververeiste. Geen externe scripts of fonts.

- `src/engine.js`: deterministische spelregels en replaycontrole.
- `src/renderer.js`: canvasweergave en gegenereerde sprites.
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
