# Prijzen en dagelijkse troostprijs

Gebouwd op 6 oktober 2026 voor het aparte `/leaderboard`-scherm.

## Instellen

Alles staat in `GAME_CONFIG.leaderboard` in [de centrale config](../src/game-config.js):

- `flipIntervalSeconds`: seconden per kaartzijde. Standaard 12. `0` schakelt automatisch draaien uit. Anders 3 tot 3600 seconden.
- `demo`: `true` toont het demo-label. Kies `false` en vervang teksten en afbeeldingen bij echte prijzen.
- `timeZone`: standaard `Europe/Amsterdam`. Bepaalt de kalenderdag van een trekking, inclusief zomer- en wintertijd.
- `prizes.podium`: precies drie objecten, in de volgorde eerste, tweede en derde plek.
- `prizes.consolation`: de dagelijkse troostprijs.
- Iedere prijs heeft `title`, `description` en `image`. Gebruik voor `image` een lokaal pad zoals `/assets/prizes/headphones.svg` of een volledige HTTPS-afbeeldingslink zonder inloggegevens. Geen afbeelding-service of sleutel nodig. Externe afbeeldingen worden rechtstreeks geladen zonder referrer; de bron ontvangt wel een afbeeldingsverzoek. Een ontbrekende afbeelding krijgt een ster als vervanging.

Demo: Galaxy koptelefoon, Orbit speaker, Cascade thermos en Mission snackbox. Vier originele lichte SVG-illustraties staan onder `public/assets/prizes/`. De prijzen zijn fictief; er wordt niets uitgekeerd.

Configwijzigingen veranderen de spelregels of het bestaande klassement niet. Lokaal server herstarten en pagina vernieuwen. Online opnieuw bouwen en publiceren.

## Scherm

De hele missiekaart draait tussen QR/uitnodiging en prijzen. Beide zijden nemen dezelfde ruimte in. Met de knop onder de kaart kun je handmatig wisselen. De bestaande animatiepauzeknop stopt ook automatisch draaien. Minder-bewegingvoorkeur schakelt automatisch draaien en de 3D-overgang uit; handmatig wisselen blijft mogelijk. Achtergrondtabbladen pauzeren. Toetsenbordfocus in de kaart voorkomt onverwacht wisselen. Een verborgen kant is inert en verborgen voor schermlezers.

De troostprijsuitslag blijft onder het klassement zichtbaar, ook wanneer de kaart de QR-kant toont. Het meest recente resultaat van het huidige klassement blijft staan met de trekkingsdatum, tot een nieuw resultaat volgt. Updates gebruiken dezelfde twee-secondenpolling als de scores.

## Trekking in beheer

Open `/admin`. Onder het huidige klassement staat **Kies willekeurige winnaar**. De knop verloot meteen en wordt daarna **Vandaag al verloot**. Geen automatische nachtelijke taak: de beheerder voert de dagelijkse trekking uit. Vernieuw beheer wanneer een nieuwe dag begint.

- Alle opgeslagen scores uit het huidige spelklassement tellen mee, ook buiten de zichtbare top 10 en de eerste beheerpagina. Geen beperking tot scores van die dag.
- Rangorde: score, beschermde diensten, oudste speeldatum, score-ID. De top 3 op het moment van trekken is uitgesloten.
- Spelersnamen worden genormaliseerd en zonder verschil tussen hoofd- en kleine letters vergeleken. Alle scores van een podiumnaam zijn uitgesloten. Iedere overige naam krijgt één kans; de beste score vertegenwoordigt die naam.
- Zonder deelnemers buiten het podium blijft de dag beschikbaar voor een latere trekking.
- Eén resultaat per kalenderdag per huidig spelklassement. Cryptografisch willekeurige selectie met rejection sampling. Gelijktijdige klikken en retries leveren dezelfde opgeslagen winnaar op.
- De online opslag controleert opnieuw het podium en de gekozen score voordat ze het resultaat opslaat. Bij een gelijktijdige podiumwijziging moet beheer eerst worden vernieuwd.
- Voer de trekking uit na afsluiting van de speeldag. Latere scorewijzigingen veranderen een opgeslagen uitslag niet. Een troostprijswinnaar kan door later spelen alsnog het podium bereiken; de trekking kijkt naar het podium op het trekkingsmoment.
- De game identificeert spelers met hun ingevulde naam, zonder spelersaccount. Verschillende schrijfwijzen kunnen dezelfde persoon voorstellen; gelijke namen kunnen verschillende personen zijn. Gebruik daarom consequent dezelfde unieke spelersnaam op de beurs.

De bestaande beheerautorisatie blijft gelden. Alleen de bevoegde Sites-beheerder kan online trekken. Lokaal kan dit vanaf deze Mac via localhost. Cross-site verzoeken, een oud klassement en een verlopen dag worden geweigerd.

## Opslag en API

Online: nieuwe schema-only Drizzle-migratie `0002_concerned_namorita.sql` maakt `prize_draws` met `version`, `day`, `result` en een unieke index op versie/dag. Bestaande scoretabellen blijven behouden. `result` bevat de winnaar als snapshot: naam, score-ID, score, diensten, datum/tijd, deelnemersaantal en prijsomschrijving/afbeeldingspad. Geen IP- of analyticsgegevens in de trekking.

Lokaal: `data/prize-draws.json`, met atomair opslaan en hergebruik na herstart. Nieuwe lokale scores worden niet langer op 100 afgekapt, zodat het hele opgeslagen klassement kan meedoen. Historisch al afgekapt lokaal materiaal kan hiermee niet worden teruggehaald.

- `GET /api/admin/prize-draw`: huidige dag, laatste uitslag en aantal namen buiten het podium.
- `POST /api/admin/prize-draw`: JSON `{ "version": "huidige spelversie", "day": "YYYY-MM-DD" }`. `201` voor nieuwe uitslag, `200` voor bestaande uitslag, `409` wanneer geen geldige selectie mogelijk is.
- `GET /api/leaderboard`: behoudt `scores` en voegt `consolation: { day, winner }` toe. `winner` is `null` vóór de eerste trekking.

Bewerken, verwijderen en resetten van scores behouden uitgevoerde trekkingen. De openbare gebruiksgegevenspagina legt dit uit. Er is in deze uitbreiding geen reset-/herlotingknop voor opgeslagen uitslagen.

## Controle

60 regressietests. Inclusief top-3-uitsluiting bij herhaalde namen, Unicode-normalisatie, één kans per naam, selectie van positie 120, volledige online lijst, gelijktijdige klikken, podiumwijziging, zonder kandidaten, stale dag/versie, toegang, zomer-/wintertijd en opslag na lokale herstart.

Geïsoleerde browsercontrole met fictieve namen: beide thema’s, beide kaartzijden, 1920×1080, 1366×768, 1080×1920, 390×844 en 320×740. Geen horizontale overloop; monitorweergaven passen zonder scrollen. Automatisch draaien op ingestelde tijd, pauze, handmatig draaien, minder beweging, vier afbeeldingen en foutfallback gecontroleerd. Via de echte lokale admin-knop gekozen winnaar komt binnen circa twee seconden op het leaderboard en blijft na herladen staan. Geen echte score of live trekking gewijzigd.

Het oorspronkelijke spelbudget blijft 800.000 bytes. Het aparte monitorscherm krijgt 40.000 bytes voor pagina, animaties, prijzen en demo-afbeeldingen, dus 840.000 bytes totaal. Afbeeldingsplafond blijft 650.000 bytes. De build controleert alle grenzen.

## Live gepubliceerd

Sites-versie 15 is succesvol gepubliceerd op [het leaderboard](https://riskstudio-cascade-command.codexwillem.chatgpt.site/leaderboard). Native status `succeeded`, broncommit `7b5c2844aee60ef57538058b47c25784de4e6945`. Bestaande openbare toegang, beheeraccount en databasebinding behouden. [Publicatiebewijs](publicatie-prijzen-2026-10-06.json), [browserbewijs](prijzen-evidence-2026-10-06/verification.json). Downloadbudget: 833.381/840.000 bytes totaal; game 798.158/800.000, leaderboard 35.223/40.000, afbeeldingen 551.328/650.000. Geen aanvullende online browsertest of echte trekking uitgevoerd.
