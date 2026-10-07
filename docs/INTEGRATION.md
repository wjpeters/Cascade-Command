# Cascade Command — overdracht voor de gameserver

Gecontroleerd tegen de Django-implementatie op 6 oktober 2026. Dit bestand kan zelfstandig aan de ontwikkelaar of AI van de game worden gegeven. Alle spelersgegevens, UUID's en resultaten in de voorbeelden zijn fictief.

## 1. Opdracht en verdeling

Vervang de bestaande game-opslag in SQLite/D1, lokale JSON-bestanden en het servergeheugen door de interne Django-API uit dit document. Django wordt de centrale bron voor sessies, scores, privécontactgegevens en statistieken. De bestaande gameserver behoudt de JavaScript-engine, de publieke browserroutes en de controle van spelacties.

```text
Browser: game, acties en scoreformulier
    ↓ bestaande publieke game-API
Gameserver: oorsprongcontrole, metadata, replaycontrole en geheime API-token
    ↓ /api/v1/internal/games/cascade-command/...
Django: validatie, transacties, rangschikking en centrale PostgreSQL-opslag

Beheerders → Django admin → dezelfde centrale opslag
```

Django rekent het spel niet opnieuw uit. De gameserver moet met de opgeslagen seed en spelversie de acties opnieuw afspelen en zelf `score`, `services` en `duration` bepalen. Neem deze drie waarden nooit rechtstreeks van de browser over. Actielijsten worden niet naar Django gestuurd of daar opgeslagen.

De huidige publieke routes kunnen blijven bestaan. Het scoreformulier krijgt de hieronder beschreven contactvelden en het leaderboard wordt per dag geselecteerd. De bestaande game-admin wordt vervangen door Django admin; bouw daarvoor geen extra API-koppeling met de game-token.

## 2. Verbinding en inrichting

De basis-URL is:

```text
<DJANGO_ORIGIN>/api/v1/internal/games/cascade-command/
```

Lokaal is dat normaal `http://localhost:8000/api/v1/internal/games/cascade-command/`. Gebruik voor testing, staging en productie de origin die de backendbeheerder verstrekt. `localhost` werkt alleen wanneer de gameserver Django op dezelfde machine kan bereiken; vanuit een container of gehoste game is een andere bereikbare host nodig.

Alle routes hebben een afsluitende slash. Iedere call, ook `GET`, heeft deze header nodig:

```http
Authorization: Bearer <CASCADE_COMMAND_API_TOKEN>
Accept: application/json
```

Gebruik bij een POST ook `Content-Type: application/json`. De naam `Bearer` is hoofdlettergevoelig in deze implementatie. Er is geen tokenaanvraag- of loginendpoint: beide servers krijgen dezelfde geheime waarde via hun configuratie.

Voorstel voor de configuratie van de gameserver:

```dotenv
DJANGO_GAMES_API_BASE_URL=http://localhost:8000/api/v1/internal/games/cascade-command/
CASCADE_COMMAND_API_TOKEN=cascade-command-development-only
```

`DJANGO_GAMES_API_BASE_URL` is een voorgestelde naam voor de gameserver, geen bestaande Django-setting. De token hierboven is uitsluitend de reeds ingestelde ontwikkelwaarde. Staging en productie lezen hun eigen `CASCADE_COMMAND_API_TOKEN` uit de omgeving; een ontbrekende of lege waarde weigert daar alle toegang. Gebruik daar de apart verstrekte geheime token.

Bewaar de token alleen op de gameserver, nooit in browsercode, een publieke omgevingsvariabele, URL of log. De token geeft geen toegang tot Django admin of andere Riskstudio-API's. De infrastructuur schermt `/api/v1/internal/` af: de gameserver moet ook op netwerkniveau toegang krijgen. Een correcte token alleen passeert die firewall niet.

De backendbeheerder moet vóór gebruik de games-migratie toepassen en in `/django-admin/games/game/` een Game instellen:

| Instelling | Waarde |
| --- | --- |
| `slug` | Exact `cascade-command`; dit is de vaste sleutel voor de databasekoppeling. |
| `name` | Bijvoorbeeld `Cascade Command`. |
| `current_version` | Exact de spelregelversie van de gebruikte engine. |
| `is_active` | Ingeschakeld. |
| Contactvereisten | Per veld `disabled`, `optional` of `required`; standaard allemaal `disabled`. |

De migratie maakt geen Game-record aan. Een ontbrekende of inactieve game geeft `404`. Een ander Game-record aanmaken levert geen nieuwe API-routes op. De route `riskstudio.com/game` moet afzonderlijk in de website/hosting naar de game leiden.

## 3. Wat Django opslaat en hoe de code werkt

| Model | Verantwoordelijkheid |
| --- | --- |
| `Game` | Spelconfiguratie, actieve spelregelversie en contactvereisten. |
| `GameSession` | UUID, seed, versie, Amsterdamse startdag, starttijd, vervaltijd en verbruikstatus. |
| `GameScore` | Openbare alias, score, operationele diensten, versie en startdag; maximaal één score per sessie. |
| `GameScoreContact` | Privénaam, e-mail en telefoon bij één score. Dezelfde persoon mag bij meerdere scores voorkomen. |
| `GameAnalyticsEvent` | Een bezoek of ronde, gesaneerde metadata en het oorspronkelijke ronde-resultaat. |
| `GameDailyStats` | Dagtellingen voor bezoeken, starts, afgeronde rondes, opgeslagen scores en sommen van speeltijd/punten. |

Een bezoek, ronde en leaderboardinzending zijn verschillende gebeurtenissen. Spelen en afronden vereisen geen contactgegevens. Er is geen account of blijvende speler-ID en er is geen verplichte relatie tussen een bezoek-ID en een ronde-ID.

`urls.py` registreert vaste routes. De viewsets in `views/` controleren de token en laten `serializers/` de invoer valideren. `services.py` voert de opslaghandelingen uit. Schrijfacties gebruiken database-transacties en een lock per game: sessie, analytics en tellers worden samen opgeslagen. Bij een opslagfout wordt de hele actie teruggedraaid. Scoreopslag, contactopslag en het verbruiken van de sessie gebeuren eveneens samen.

De rangschikking is: punten aflopend, operationele diensten aflopend, opslagmoment oplopend en score-ID oplopend. Alle ingediende scores blijven bewaard; het openbare endpoint retourneert maximaal tien scores. Dagtotalen omvatten alle spelversies, terwijl leaderboards per dag én spelversie worden geselecteerd.

## 4. Overzicht van de endpoints

Alle paden hieronder zijn relatief aan de basis-URL uit hoofdstuk 2. `{id}` is het sessie-ID, niet het score-ID.

| Methode | Pad | Succes | Betekenis |
| --- | --- | --- | --- |
| GET | `meta/` | 200 | Actieve versie en contactvereisten. |
| POST | `visits/` | 201 nieuw, 200 retry | Eén bezoek registreren. |
| POST | `sessions/` | 201 nieuw, 200 retry | Eén ronde aanmaken met serverseed. |
| GET | `sessions/{id}/` | 200 | Sessiedata ophalen voor replaycontrole. |
| POST | `sessions/{id}/finish/` | 200 | Geverifieerd resultaat registreren zonder leaderboardinzending. |
| POST | `sessions/{id}/score/` | 201 nieuw, 200 retry | Score en eventuele privécontactgegevens opslaan. |
| GET | `leaderboard/` | 200 | Top tien voor een dag en spelversie. |

Er zijn geen game-admin-, player-, update-, delete- of resetendpoints voor deze token. De game-endpoints ondersteunen alleen de genoemde GET/POST-acties. Bodies mogen maximaal 16 KiB zijn. Onbekende JSON-velden worden genegeerd; bouw daarom zelf expliciete payloads en stuur geen complete browserbody door. API-responses schakelen caching uit met `Cache-Control: no-store`.

## 5. API-contract met voorbeelden

In alle voorbeelden is `cascade-3-14f91b15` een voorbeeldversie. Gebruik de echte engineversie en stel die ook in Django in. Het is een spelregel-ID, geen publicatie-, thema- of deploymentversie. Een verschil tussen de engineversie en `meta.version` moet worden opgelost voordat een nieuwe ronde start; vervang niet alleen het versielabel van een andere engine.

### 5.1 Configuratie — `GET meta/`

Voorbeeld van een `200`-response bij geconfigureerde contactvereisten:

```json
{
  "game": "cascade-command",
  "version": "cascade-3-14f91b15",
  "timezone": "Europe/Amsterdam",
  "contact_requirements": {
    "full_name": "required",
    "email": "required",
    "phone": "optional",
    "retention_days": 90
  }
}
```

Geef de versie en contactvereisten via de publieke meta-route aan de browser door. `hosting` en `mobileUrls` komen niet uit Django; die blijven configuratie van de gameserver. Er staan geen privégegevens in deze response.

### 5.2 Bezoek — `POST visits/`

Minimale body:

```json
{
  "id": "12345678-1234-4123-8123-123456789abc",
  "version": "cascade-3-14f91b15"
}
```

`id` is de UUID v4 van één paginabezoek. Bij herladen ontstaat een nieuw bezoek-ID; bij een retry blijft het hetzelfde. De bestaande browser kan dit bezoek-ID blijven genereren. Optioneel mag de gameserver `metadata` toevoegen zoals beschreven in hoofdstuk 7.

Response: `201` voor een nieuw bezoek, `200` voor hetzelfde al geregistreerde bezoek:

```json
{"recorded": true}
```

Een retry verhoogt `visits` niet opnieuw en vervangt eerdere metadata niet. Een bezoek-ID opnieuw gebruiken met een andere versie wordt geweigerd. Alleen het adminscherm openen telt niet als gamebezoek.

### 5.3 Ronde starten — `POST sessions/`

De gameserver maakt vóór de eerste Django-call een UUID v4 voor deze ronde en hergebruikt die bij retries. Gebruik een andere UUID dan voor het paginabezoek.

```json
{
  "id": "22345678-1234-4123-8123-123456789abc",
  "version": "cascade-3-14f91b15"
}
```

Ook hier is `metadata` optioneel. Django kiest de seed en tijdstippen. Een nieuwe ronde geeft `201`; een retry `200` met dezelfde sessie-identiteit, seed en oorspronkelijke tijden:

```json
{
  "id": "22345678-1234-4123-8123-123456789abc",
  "seed": 123456789,
  "version": "cascade-3-14f91b15",
  "day": "2026-10-06",
  "started": 1791273600000,
  "expires": 1791275400000,
  "consumed": false
}
```

`seed` is een unsigned 32-bit integer. `started` en `expires` zijn Unix-milliseconden. De sessie is dertig minuten geldig. `day` is de startdatum in `Europe/Amsterdam`. Geef minimaal `{id, seed, version}` aan de browser terug en bewaar ook de dag/vervaltijd waar nodig voor de gebruikersflow.

Een ronde mag pas starten nadat Django succesvol antwoordt. Maak geen eigen vervangende seed of lokale sessie bij een fout. Demo's en startschermanimaties maken geen sessies. Er mogen maximaal 500 niet-verbruikte, niet-verlopen sessies tegelijk bestaan.

### 5.4 Sessiedata lezen — `GET sessions/{id}/`

Dit geeft dezelfde velden als de sessieresponse hierboven. Gebruik deze serverdata als basis voor de replaycontrole, niet de seed of tijden uit een browserpayload.

Een verlopen sessie geeft `400`; een fysiek verwijderde of onbekende sessie `404`. Een sessie waarvan de versie niet meer actief is, wordt geweigerd. Een verbruikte sessie kan zolang zij geldig is nog worden gelezen voor een score-retry, mits de bijbehorende score nog bestaat. Een verwijderde of geresette score kan niet met dezelfde sessie opnieuw worden ingediend.

### 5.5 Ronde afronden — `POST sessions/{id}/finish/`

Haal de sessie op, valideer/replay de geaccepteerde browseracties met de bestaande engine en stuur uitsluitend het berekende resultaat:

```json
{
  "version": "cascade-3-14f91b15",
  "score": 1234,
  "services": 2,
  "duration": 95.5
}
```

| Veld | Validatie |
| --- | --- |
| `version` | Verplicht; 1–100 tekens, gelijk aan de sessieversie en actieve gameversie. |
| `score` | Integer, 0–9.999.999. |
| `services` | Integer, 0–3 operationele diensten. |
| `duration` | Eindig getal, 0–1.800 simulatieseconden; bijvoorbeeld `game.tick / 60`. Pauzetijd telt niet mee. |

Django vereist dat sinds de sessiestart minimaal `duration - 1,5` seconden zijn verstreken. Het voorbeeld met 95,5 seconden kan dus niet direct na de start worden ingestuurd. Gebruik de werkelijk berekende duur.

Een geldige afronding geeft `200`:

```json
{"recorded": true}
```

Afronden maakt geen leaderboardscore en vereist geen naam of contactgegevens. Het oorspronkelijke resultaat en de dagtotalen worden eenmaal bijgewerkt. Een herhaling met exact hetzelfde resultaat is toegestaan; een gewijzigd resultaat geeft `400`. Gebruik bij finish en score dezelfde deterministisch berekende waarden, zonder verschillende afronding van `duration`.

### 5.6 Score indienen — `POST sessions/{id}/score/`

Valideer de ronde ook voor scoreopslag met de bestaande gameservercontrole. Bij de contactconfiguratie uit §5.1 is dit een geldige body:

```json
{
  "name": "Jelle Player",
  "version": "cascade-3-14f91b15",
  "score": 1234,
  "services": 2,
  "duration": 95.5,
  "contact": {
    "full_name": "Jane Example",
    "email": "jane@example.com",
    "phone": "+31 6 1234 5678"
  }
}
```

`name` is de openbare alias: na NFKC-normalisatie, trimmen en samenvoegen van spaties zijn 1–18 letters/cijfers/spaties of `.`, `_`, `-` toegestaan. `contact.full_name` is een afzonderlijke privénaam. Als alle contactvelden uitgeschakeld zijn, laat je het hele `contact`-object weg.

Nieuwe inzending: `201`. Retry van dezelfde opgeslagen score: `200`.

```json
{
  "id": "32345678-1234-4123-8123-123456789abc",
  "rank": 1,
  "score": 1234,
  "day": "2026-10-06",
  "version": "cascade-3-14f91b15",
  "scores": [
    {
      "id": "32345678-1234-4123-8123-123456789abc",
      "name": "Jelle Player",
      "score": 1234,
      "services": 2,
      "date": "2026-10-06T08:01:35.500000Z"
    }
  ]
}
```

De bovenste `id` is het nieuwe score-ID. `score` is een getal, geen object. `date` is een ISO 8601-tijdstip met tijdzone van de scoreopslag; de serialisatie kan ook een UTC-offset gebruiken. `rank` is de positie in het volledige klassement voor deze startdag en versie. `scores` bevat maximaal de eerste tien; een score met rang 11 of hoger is dus wel opgeslagen, maar staat niet in deze lijst.

Scoreopslag registreert zo nodig ook de afronding wanneer de aparte finish-call ontbreekt. De eerste succesvolle inzending verbruikt de sessie. Een retry behoudt hetzelfde score-ID en verandert de alias/contactgegevens niet. Als een beheerder de openbare score heeft aangepast, kan de response die actuele wijziging tonen; de replaycontrole blijft het oorspronkelijke ronde-resultaat vergelijken. Ook een retry vereist een nog geldige sessie.

### 5.7 Dagklassement — `GET leaderboard/`

Zonder queryparameters gebruikt Django vandaag in `Europe/Amsterdam` en de actieve spelregelversie. Voor een specifieke dag en versie:

```text
leaderboard/?day=2026-10-06&version=cascade-3-14f91b15
```

Encodeer queryparameters met de URL-helper van de gebruikte runtime. `day` is een kalenderdatum in `YYYY-MM-DD`; `version` is een tekst van maximaal 100 tekens. Ontbrekende of lege parameters krijgen de genoemde defaults; omliggende spaties in een opgegeven versie worden verwijderd. Ongeldige waarden geven `400`.

Voorbeeldresponse zonder scores:

```json
{
  "day": "2026-10-06",
  "version": "cascade-3-14f91b15",
  "scores": []
}
```

Met scores bevat `scores` dezelfde openbare objecten als bij scoreopslag. Een onbekende maar geldig gevormde versie, of een dag zonder scores, geeft een leeg klassement met `200`.

Een ronde gestart om 23:59 en afgerond na middernacht hoort bij de vorige startdag. Gebruik voor het resultaatenscherm de `day`, `version` en `scores` uit de score-response. Een losse call zonder datum na middernacht toont inmiddels het nieuwe dagklassement. Leid de startdag niet af uit `date` van de score of de lokale tijdzone van de browser.

## 6. Contactformulier en prijzen

Lees de beleidswaarden uit `meta.contact_requirements` en pas het formulier voor score-inzending daarop aan:

| Beleid | Browserformulier | Inzending |
| --- | --- | --- |
| `disabled` | Veld niet tonen. | Weglaten of lege string; een niet-lege waarde wordt geweigerd. |
| `optional` | Veld optioneel tonen. | Weglaten, leeg of geldige waarde. |
| `required` | Veld verplicht tonen. | Niet-lege, geldige waarde vereist. |

De vereisten gelden alleen bij de eerste leaderboardinzending. Starten en afronden blijven zonder contactgegevens mogelijk. De openbare alias is altijd verplicht bij scoreopslag, ook als geen privégegevens nodig zijn. Er bestaat geen gecombineerde instelling “email of telefoon verplicht”.

| Contactveld | Formaat |
| --- | --- |
| `full_name` | Maximaal 120 tekens; NFKC-normalisatie en normalisatie van spaties; geen controlekarakters. |
| `email` | Geldig e-mailadres, maximaal 254 tekens. |
| `phone` | Invoer maximaal 40 tekens; 7–15 cijfers, optionele voorloop-`+`, spaties/haakjes/punten/streepjes toegestaan. Opslag bevat alleen cijfers en een eventuele voorloop-`+`. |

Laat ontbrekende waarden weg of gebruik `""`; stuur geen `null`. Django controleert het formaat, maar verifieert niet wie eigenaar van een telefoonnummer/e-mailadres is en verstuurt geen verificatiebericht.

Bij een validatiefout blijft de sessie bruikbaar zolang deze niet verlopen is. Toon de fout bij het veld en laat de speler dezelfde sessie opnieuw indienen. Een al geslaagde finish blijft geregistreerd. Als het beleid tijdens een ronde wijzigt, gelden bij inzenden de actuele vereisten; vernieuw zo nodig de meta-informatie.

Een persoon mag meerdere rondes onder dezelfde alias, naam, e-mail of telefoon indienen. Per sessie bestaat maximaal één score; per score maximaal één contactrecord. Een retry wijzigt of herstelt contactgegevens niet, ook niet na een beleidswijziging of verwijdering door een beheerder.

Privégegevens verschijnen niet in leaderboard-, sessie- of score-responses en zijn niet via de game-token op te vragen. Django admin biedt daarvoor aparte contactrechten. Maak in het formulier duidelijk welke gegevens voor de leaderboard-/prijsdeelname worden gevraagd. Er is geen automatische marketinginschrijving, eigendomsverificatie, winnaarselectie of beperking tot één prijs per persoon ingebouwd.

## 7. Metadata bij bezoek en rondestart

De gameserver mag aan `visits/` en `sessions/` een object `metadata` toevoegen. Alle velden zijn optioneel. Bijvoorbeeld:

```json
{
  "ip": "192.0.2.1",
  "ip_source": "cloudflare",
  "country": "NL",
  "browser": "Chrome",
  "os": "macOS",
  "device": "Computer",
  "language": "nl-NL",
  "referrer": "example.com",
  "viewport": "≥1200 px"
}
```

| Veld | Toegestane waarden |
| --- | --- |
| `ip` | Geldig IPv4/IPv6-adres of `null`; standaard `null`. |
| `ip_source` | `cloudflare`, `socket`, `unavailable`; standaard `unavailable`. |
| `country` | Twee hoofdletters of `""`. Zonder bekend IP wordt het leeg gemaakt. |
| `browser` | `Edge`, `Opera`, `Firefox`, `Chrome`, `Safari`, `Onbekend`. |
| `os` | `Android`, `iOS / iPadOS`, `Windows`, `macOS`, `Linux`, `Onbekend`. |
| `device` | `Bot / automatisch`, `Tablet`, `Telefoon`, `Computer`, `Onbekend`. |
| `language` | Maximaal 35 letters/cijfers/streepjes, of `""`; bijvoorbeeld `nl-NL`. |
| `referrer` | Alleen gesaneerde externe hostnaam, maximaal 253 tekens, of `""`. Geen schema, pad of querystring. |
| `viewport` | `<768 px`, `768–1199 px`, `≥1200 px`, of `""`. |

Gebruik de bestaande netwerk- en User-Agent-normalisatie van de gameserver. Vertrouw niet op een IP of land uit vrije browser-JSON of willekeurige `X-Forwarded-For`-headers. Online blijft de bestaande betrouwbare Cloudflare-herkomstcontrole leidend; lokaal het betrouwbare socketadres. Het socketadres dat Django ziet is doorgaans dat van de gameserver en mag niet als speler-IP worden opgeslagen.

Bij onbekend IP: `ip: null`, `ip_source: "unavailable"`, `country: ""`. Een niet-null IP met bron `unavailable` wordt geweigerd. Zet een verwijzing vanaf de eigen website om naar `""`. Zet de browserbreedte om naar een klasse; stuur geen exacte afmetingen of volledige User-Agent door. De bestaande Nederlandse categoriewaarden zijn onderdeel van het contract.

Metadata wordt eenmaal bij bezoek/rondestart vastgelegd. Finish en scoreopslag bevatten geen nieuwe metadata.

## 8. Fouten, retries en grenzen

| Status | Betekenis en afhandeling |
| --- | --- |
| 400 | Ongeldige invoer, contactvereiste, verlopen/verbruikte sessie, verkeerde versie of afwijkend eerder opgeslagen resultaat. Toon een passende fout; geen blinde retry. |
| 403 | Token ontbreekt/is fout of Django heeft geen token geconfigureerd. Corrigeer serverconfiguratie. Een firewall kan ook verkeer weigeren. |
| 404 | Game ontbreekt/is inactief, sessie ontbreekt/hoort bij een andere game, of route bestaat niet. Controleer configuratie en sessie. |
| 405 | Methode niet beschikbaar. |
| 413 | JSON-body groter dan 16 KiB. |
| 415 | Niet-ondersteund contenttype; stuur JSON. |
| 429 | Rate limit of 500 actieve sessies bereikt. Respecteer `Retry-After` wanneer aanwezig. Bij capaciteitsgebrek kan deze header ontbreken. |
| 503 | Tijdelijke databasefout. Een beperkte retry met dezelfde identiteit/payload is toegestaan. |

Fouten hebben niet allemaal dezelfde JSON-vorm. Ondersteun een `detail`-object, veldfouten en een lijst met algemene meldingen. Bijvoorbeeld:

```json
{"detail": "Not found."}
```

```json
{"contact": {"email": "This field is required to submit a leaderboard score."}}
```

```json
{"contact": {"email": ["Enter a valid email address."]}}
```

```json
["This game session has expired."]
```

Bij een netwerkfout, timeout of `503` weet de gameserver mogelijk niet of Django al heeft opgeslagen. Herhaal daarom dezelfde bewerking met dezelfde ID, versie en resultaatwaarden. Gebruik een beperkt aantal pogingen met oplopende wachttijd en jitter; stop bij sessieverval. Laat HTTP-status, foutbody en eventuele `Retry-After` beschikbaar voor de publieke route. Een proxy/firewall kan een niet-JSON-fout geven; behandel dat ook zonder de geheime token of contactbody te loggen.

Voor bezoek/start wordt de UUID eenmaal per logische bewerking gemaakt, buiten de retry-lus. Ook een herhaald browserverzoek voor dezelfde start moet waar mogelijk dezelfde logische start gebruiken, zodat de gameserver geen tweede sessie maakt. Een score-retry gebruikt altijd het bestaande sessie-ID. Genereer nooit een nieuwe ronde om een onzekere scoreopslag opnieuw te proberen.

De gameserver mag bij uitval niet stilzwijgend terugvallen op SQLite, D1 of lokale JSON-opslag. Dat zou uiteenlopende scores en statistieken opleveren. Laat de speler pas weten dat de score bewaard is nadat Django succes bevestigt.

`GAMES_API_RATE` staat standaard op `600/min`, gedeeld over alle Cascade Command-calls. Behoud daarnaast de bestaande publieke limieten en oorsprongcontroles, rekening houdend met veel beursbezoekers achter hetzelfde IP. Gebruik voor de bestaande publieke gamebody's de bestaande limiet van 160.000 bytes en voor replay maximaal 1.000 geldige acties; de kleinere Django-limiet geldt omdat de acties daar niet heen gaan.

## 9. Koppeling van de bestaande publieke routes

De onderstaande publieke routes komen uit de oorspronkelijke game-overdracht. Controleer hun actuele implementatie in de game-repository en behoud hun browsercontract waar mogelijk.

| Publieke route | Werk op de gameserver |
| --- | --- |
| `GET /api/meta` | Django `meta/` ophalen; `hosting`/`mobileUrls` uit eigen configuratie toevoegen; contactbeleid doorgeven. |
| `POST /api/visit` | Bezoek-ID valideren, metadata opbouwen, actieve engineversie toevoegen, Django `visits/` aanroepen. |
| `POST /api/session` | Eén UUID v4 maken, metadata opbouwen, Django `sessions/` aanroepen en de ontvangen seed/ID/versie gebruiken. |
| `POST /api/finish` | `{session, actions}` ontvangen; sessie uit Django ophalen; acties met de juiste engine/seed controleren; berekend resultaat naar `finish/`. |
| `POST /api/score` | `{session, name, actions, contact}` ontvangen; sessie ophalen en resultaat verifiëren; expliciete scorepayload naar `score/`; fouten/score-response vertalen voor de browser. |
| `GET /api/leaderboard` | Django `leaderboard/` aanroepen; standaard vandaag, zo nodig expliciete dag/versie voor het resultaatenscherm. |

Behoud de bestaande controles op dezelfde Origin, geaccepteerde actietypes, ticks/volgorde, coördinaten, energie, cooldown en acties na het einde. De gedeelde engine blijft leidend. Laat de game-admin vervallen volgens de productafspraak; leaderboardbeheer, contactinzage, exports en statistieken verlopen via Django admin met eigen medewerkersrechten.

## 10. Beheer, retentie en nog openstaande inrichting

Django admin biedt games, scores, contacts, sessions, analytics events en daily statistics onder het menu `👾 Games`. Bij een game zijn statistieken, exports en een reset voor één dag/versie beschikbaar. Scores kunnen worden bewerkt/verwijderd met controle op intussen gewijzigde waarden. Dit verandert de oorspronkelijke analytics niet. Reset verwijdert de betreffende scores en contacten, maakt de bijbehorende sessies onbruikbaar en behoudt historische dagtotalen.

Privécontacten verlopen standaard na 90 dagen; de termijn is niet instelbaar in admin. Metadata-details worden na 90 dagen afgeschermd, IP-overzichten na 30 dagen. De functie `cleanup_game_data()` kan verlopen sessies/contacten verwijderen, oude IP's wissen en oude detailrecords verwijderen. **Deze functie wordt nog nergens automatisch aangeroepen.** Fysieke verwijdering is dus nog een open backend-/beheeractie; er is geen cleanup-API voor de gameserver. Permanente scores en dagtotalen worden niet door retentie verwijderd.

De backend is getest, maar de echte gameserveradapter is in deze Django-repository niet aanwezig. Een volledige praktijktest van de koppeling moet nog plaatsvinden. Oude SQLite/D1-/JSON-records worden niet automatisch geïmporteerd. Stem af of de beurs met een leeg klassement start of dat een afzonderlijke import nodig is; laat bestaande live sessies bij omschakelen eerst aflopen. Een oude score-opslagdatum is niet altijd voldoende om de juiste startdag te reconstrueren.

## 11. Uitvoerbaar plan voor de AI van de game

1. Lees dit bestand en inspecteer de bestaande publieke routes, opslagadapters, replay-engine en analytics-normalisatie. Behoud de bestaande gameplay en enginecontroles.
2. Voeg serverconfiguratie en één kleine HTTP-client toe voor de Django-basis-URL/token, JSON, timeouts en doorgeven van foutstatus/body. Bevestig netwerktoegang en een geslaagde `meta/`-call.
3. Vervang sessie-opslag en sessieopvraging door Django. Genereer een UUID vóór iedere nieuwe logische start en behoud die bij retries; gebruik de seed/tijden uit de response.
4. Koppel bezoekregistratie, finish en scoreopslag volgens de tabellen. Bewaar resultaten en statistieken uitsluitend centraal; stuur uitsluitend gevalideerde resultaten en gesaneerde metadata.
5. Bouw het scoreformulier op basis van `contact_requirements`. Houd de publieke alias en privénaam gescheiden. Laat iedereen starten/afronden zonder privégegevens.
6. Maak het leaderboard en het resultaatenscherm bewust van de Amsterdamse startdag. Behoud het sessie-ID voor retries en gebruik het aparte score-ID alleen als score-identiteit.
7. Verwijder de afhankelijkheid van de oude game-admin/opslag volgens de productafspraak. Bouw geen vervangende beheerendpoints met deze token.
8. Test onderstaande scenario's tegen een testomgeving en documenteer de vereiste gameserverconfiguratie. Rapporteer blokkades rond firewall, ontbrekende Game-configuratie of versiemismatch expliciet. Deployments worden door de beheerder uitgevoerd via de gebruikelijke procedure.

## 12. Acceptatiecontrole voor de koppeling

- [ ] De token staat uitsluitend op de gameserver; alle zeven interne routes weigeren toegang zonder geldige token.
- [ ] `meta.version` komt overeen met de werkelijke replay-engine; de Game is actief.
- [ ] Een bezoek-retry telt één bezoek; een start-retry behoudt dezelfde seed/sessie en telt één start.
- [ ] Een echte speelronde wordt op de gameserver opnieuw gecontroleerd; een vervalst browserresultaat wordt niet als waarheid doorgestuurd.
- [ ] Finish werkt zonder alias/contactgegevens en maakt geen leaderboardscore.
- [ ] Scoreopslag werkt ook wanneer de aparte finish-call ontbreekt en telt afronding/opslag elk eenmaal.
- [ ] Een dubbele score-call geeft dezelfde score-ID; een afwijkend geverifieerd resultaat wordt geweigerd.
- [ ] Ontbrekende verplichte contactgegevens geven een bruikbare veldfout; na correctie kan dezelfde nog geldige sessie worden ingediend.
- [ ] Disabled/optional/required werken afzonderlijk voor naam, e-mail en telefoon; dezelfde persoon kan meerdere rondes indienen.
- [ ] Een score buiten de top tien is opgeslagen en heeft een juiste rang, ondanks afwezigheid in `scores`.
- [ ] Een ronde over middernacht blijft bij haar Amsterdamse startdag; de volgende dag begint met een eigen klassement.
- [ ] Verlopen sessies, gewijzigde spelversies en geresette/verwijderde scores worden correct afgehandeld.
- [ ] Bij timeout/retry ontstaan geen nieuwe ronde-identiteiten of lokale fallbackrecords.
- [ ] Contactgegevens verschijnen alleen waar bedoeld in Django admin, nooit in openbare responses of logs.
- [ ] De ronde, tellingen, score en eventuele contacten zijn terug te vinden in Django admin.
- [ ] De backendbeheerder heeft de fysieke opruiming en eventuele historische import vóór livegang afgehandeld of expliciet gepland.

Voor onderhoud in de Django-repository zijn `games/urls.py`, `games/views/`, `games/serializers/` en `games/services.py` de concrete implementatie van dit contract. De Django-checks zijn vanuit `django/` uit te voeren met `make test TEST="games.tests users.tests.test_authentication_separation"`. De gameserver moet daarnaast zijn eigen integratietests uitvoeren.
