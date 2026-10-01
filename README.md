# RiskStudio · Cascade Command

Speelbaar prototype voor beurs, Mac met groot scherm en mobiel. Alleen lokaal opgeslagen, expliciet gekozen op 1 oktober 2026.

## Spelen

- Dubbelklik op **Start Cascade Command.command**. Of voer in deze map `rtk proxy npm start` uit.
- Open http://localhost:4317 op de Mac.
- Klik in het spel op **Speel op je telefoon** voor het actuele wifi-adres. Open dat adres op een telefoon op hetzelfde netwerk. De Mac moet aan blijven; sommige gastnetwerken blokkeren onderling verkeer.
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

**Prototypegrens:** dit is geen productieklare prijsvraag. Replayvalidatie verhindert verzonnen scores, maar geen bots, meerdere namen of meerdere pogingen. Voor echte prijzen ontbreken nog identiteit/deelnameregels, moderatie, rate limits, een afsluitmoment en een beveiligde publieke deployment. Het is een gedeeld prototypeklassement, geen automatisch dagklassement.

De server luistert op het lokale netwerk voor mobiele deelname. Er is niets op internet gepubliceerd en geen portforwarding ingesteld. De app haalt geen klantdata op en wijzigt RiskStudio niet. Beschermingsvelden zijn een spelmetafoor, geen bestaande RiskStudio-functionaliteit.

## Techniek

Dependencyvrije browsergame met native ES-modules, Canvas 2D voor het stabiele netwerk, Image Gen-assets voor het spelbeeld en gewone HTML-bediening. Simulatie en weergave zijn gescheiden. De server en browser gebruiken dezelfde vaste simulatiestappen van 60 Hz. Mobiele indeling vanaf 760px, bediening zonder hoververeiste. Geen externe scripts of fonts.

- `src/engine.js`: deterministische spelregels en replaycontrole.
- `src/renderer.js`: canvasweergave en gegenereerde sprites.
- `src/main.js`: schermen, bediening en scoreflow.
- `server.mjs`: lokale webserver, sessies en leaderboard.
- `design/`: visueel concept en ontwerpkeuzes.
- `public/assets/`: lokale spelbeelden.

Voer `rtk proxy npm test` uit voor betekenisvolle regressietests. Optioneel: `PORT`, `HOST` en `CASCADE_DATA_DIR` instellen. Dit prototype is nog niet in de homepage geïntegreerd; de statische frontend en API kunnen later worden gehost en geïntegreerd.
