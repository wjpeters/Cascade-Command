# Cascade Command: gerichte beveiligingscontrole

Gecontroleerd op 6 oktober 2026. Deze controle beantwoordt de vragen over zichtbare API-keys en het manipuleren van scores.

**Uitkomst:** in de onderzochte publieke bestanden zijn geen geheime API-keys gevonden. De backend blokkeert vervalste punten en ongeldige spelacties. Een automatisch gegenereerde, geldige reeks spelacties wordt echter geaccepteerd. De huidige versie biedt daarom geen betrouwbare garantie dat een highscore door een menselijke speler is behaald.

## Onderzochte versie en werkwijze

- Online: [bestaande openbare game](https://riskstudio-cascade-command.codexwillem.chatgpt.site), Sites-versie 12. Het hostingplatform bevestigde dat de publicatie geslaagd is.
- Geregistreerde broncommit: `1c62399711f20239c6ca5a2476fa78b64c306621`.
- Score-editie: `cascade-3-14f91b15`; vaste seed: `271026`.
- 40 publieke bestanden daadwerkelijk opgehaald en op herkenbare sleutelpatronen en letterlijke secret-toewijzingen onderzocht. De game- en beheerclients gebruiken dezelfde-origin fetch-verzoeken zonder een servicekey mee te sturen.
- 37 bestanden kwamen byte voor byte overeen met de lokale publicatiebuild. De drie HTML-pagina's behouden de oorspronkelijke inhoud en krijgen een Cloudflare-challengescript van de hostinglaag toegevoegd. Publieke challengeparameters zijn geen geheime applicatiekeys.
- API-schrijftests draaiden uitsluitend tegen een lokale kopie van de publicatiebuild met een tijdelijke SQLite-database in geheugen. De engine voor de automatische acties kwam uit de daadwerkelijk opgehaalde publieke JavaScript-bestanden.
- Voor afgeronde testresultaten is uitsluitend in die testdatabase de starttijd teruggezet. In het echt moet een geautomatiseerde indiener nog steeds de vereiste rondetijd afwachten. Er zijn geen testresultaten naar het openbare leaderboard gestuurd.

Bewijs: [publieke bestanden en routes](security-evidence-2026-10-06/public-surface.json), [replay/API-controle](security-evidence-2026-10-06/replay-verification.json).

## Zichtbare keys en beheer

Er waren nul treffers voor de onderzochte private-key-, OpenAI-, Stripe-, AWS-, GitHub-, JWT- en letterlijke secret-toewijzingspatronen. Dat is een gerichte inspectie, geen bewijs dat ieder mogelijk geheim of iedere infrastructuurfout is uitgesloten. De huidige opslag gebruikt een server-side databasebinding; een nieuwe externe backendkoppeling is nog niet gebouwd of gecontroleerd.

De volgende publieke verzoeken leverden 404 op: `/.env`, `/.openai/hosting.json`, `/.git/config`, `/server.mjs`, `/worker/api.js`, `/admin/api.js`, `/data/leaderboard.json`, `/server/index.js` en `/src/main.js.map`.

`/api/admin/me` en `/api/admin/stats` leverden zonder inloggen 401 op. Een read-only verzoek met zelf ingestelde fictieve `oai-authenticated-user-*`-headers leverde eveneens 401 op. Dit is beperkt bewijs voor deze routes en de huidige hostinglaag. Er is geen volledige test van de provideridentiteitsketen of iedere mogelijke bypass uitgevoerd.

De beheerautorisatie vertrouwt op door Sites aangeleverde identiteit plus een server-side e-mailallowlist. Een nieuwe backend moet de identiteit zelf betrouwbaar verifiëren. Browserheaders met een gekozen e-mailadres zijn daar geen vervanging voor.

Alle JavaScript, configuratie en netwerkverzoeken die een browser ontvangt zijn voor die speler te bekijken en aan te passen. Een gedeelde geheime servicekey hoort daarom uitsluitend op de server, bijvoorbeeld in server-side runtimeconfiguratie. Minificatie, een frontend-envvariabele, Canvas, Astro en CORS maken zo'n key niet geheim. Een tijdelijke, beperkt bevoegde spelerssessie in de browser is iets anders dan een gedeelde servicekey.

## Scorecontrole: wat werkt

| Test | Waargenomen resultaat |
|---|---|
| `score: 9999999` en `services: 3` meesturen bij een lege actielijst | Backend slaat de herberekende 0 punten en 0 diensten op |
| Zelf seed/starttijd/expiry in startverzoek kiezen en meteen opslaan | Seed genegeerd; te vroege score geweigerd met 400 |
| Buiten het speelveld klikken | 400 |
| Scan-cooldown omzeilen | 400 |
| Acties in omgekeerde tijdvolgorde | 400 |
| Meer dan 1000 acties | 400 |
| Actie na maximale rondeduur | 400 |
| Verlopen sessie | 400 |
| Tweede score voor dezelfde sessie | Originele score terug; één database-entry |
| Verzoek vanaf een andere Origin | 403 |
| Body groter dan 160000 bytes | 413 |
| Publiek leaderboard | Geen spel-sessie-ID in de response |

De uitkomst is dus onafhankelijk van een lokaal gewijzigd puntentotaal of spelconfiguratie. De server speelt de ontvangen acties opnieuw af onder zijn eigen spelregels.

## Scorecontrole: aangetoonde grens

Een korte automatische simulatie genereerde 51 toegestane acties zonder menselijke speler. De backend accepteerde die lijst als een geldige ronde: **7.925 punten, alle 3 diensten overgebleven**. Dezelfde acties leverden in een tweede, nieuwe sessie opnieuw 7.925 punten op.

Dit vervalst geen punten buiten de spelregels, maar maakt geautomatiseerde of gekopieerde prestaties in het klassement mogelijk. De backend krijgt de actielijst achteraf en controleert spelregels en minimale verstreken tijd. Hij bewijst niet dat een mens die acties tijdens het spelen heeft uitgevoerd. De vaste publieke seed maakt hergebruik tussen nieuwe sessies mogelijk. De eenmalige opslag per sessie blokkeert hergebruik binnen één sessie, maar beperkt het aantal nieuwe sessies per persoon niet.

Een andere seed per ronde kan het letterlijk kopiëren van een bekende lijst bemoeilijken, maar stopt een bot die iedere nieuwe ronde simuleert niet. Ook een ondertekende sessie of hash van browseracties bewijst geen menselijke prestatie.

## Advies voor productie en overdracht

1. Behoud server-side scoreberekening, strikte invoercontrole, sessie-expiry en atomair eenmalig opslaan in de nieuwe API.
2. Houd servicekeys server-side. Verifieer de identiteit en bevoegdheden op iedere beheerroute. Gebruik HTTPS. Maak de opslag-API alleen toegankelijk met de rechten die die route nodig heeft.
3. Voeg limieten voor verzoeken en spelstarts toe per passende speler-/netwerkidentiteit. De huidige globale grens van 500 niet-verbruikte sessies is geen algemene rate-limit. De beschermingsregels van het hostingplatform zijn niet volledig beoordeeld.
4. Als scores prijzen of andere waarde vertegenwoordigen: leg eerst wedstrijdregels, spelersidentiteit en een poginglimiet vast. Bewaar controleerbaar rondebewijs met passende retentie en controleer verdachte/winnende scores. Voor sterkere controle kan de server tijdens de ronde acties ontvangen en volgorde, timing en spelstatus bewaken. Ook dat elimineert bots niet volledig.
5. Laat de uiteindelijke backend en hosting gericht testen voordat een beveiligingsgarantie of wedstrijdvrijgave wordt afgegeven. Een frameworkwissel lost bovenstaande grens niet vanzelf op.

[OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html) onderbouwt HTTPS, toegangscontrole per endpoint, invoergrenzen en request-rate-limiting. Het geautomatiseerde scorebewijs hierboven komt uit de eigen tests, niet uit deze externe bron.

## Grenzen van deze controle

Dit was geen volledige penetratietest, dependency-audit, infrastructuuraudit of belastingtest. Er is geen productie-authenticatie aangepast, geen geheim geëxporteerd en geen bestaande score gewijzigd. De lokale ontwikkelserver is niet als productieomgeving vrijgegeven. Bovenstaand advies is nog niet geïmplementeerd.
