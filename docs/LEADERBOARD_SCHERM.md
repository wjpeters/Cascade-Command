# Leaderboard op een aparte monitor

Gebouwd op 6 oktober 2026. De pagina staat op `/leaderboard` en gebruikt het huidige top 10-klassement van dezelfde gameserver. Deze uitbreiding is op verzoek als Sites-versie 13 gepubliceerd op 6 oktober 2026: https://riskstudio-cascade-command.codexwillem.chatgpt.site/leaderboard. Bestaande scores en spelregels blijven behouden.

## Openen en gebruiken

1. Dubbelklik in de projectmap op **Toon Lokaal Leaderboard.command**. Deze start de lokale server wanneer nodig en opent `http://localhost:4317/leaderboard`.
2. Verplaats het browservenster naar de tweede monitor en klik rechtsboven op **Volledig scherm**. Gebruik Escape om die stand te verlaten.
3. De QR-code opent de game, niet de leaderboardpagina. Lokaal gebruiken spelers dezelfde wifi en blijft de Mac aan. Na publicatie gebruikt de online pagina automatisch haar eigen openbare gameadres.

In de game staat bij het leaderboard ook **Apart scherm ↗**. Dit opent een eigen tabblad. Oudere lokale servers moeten eerst worden gestopt en opnieuw gestart om de nieuwe route te leveren; de startknop meldt dit.

## Thema

De pagina volgt `theme` in `src/game-config.js`; bij oplevering staat die lokale instelling op **Classic**. Een monitor mag afzonderlijk een ander bewaard thema gebruiken:

- `/leaderboard?theme=classic`: donker, cyaan en warm oranje.
- `/leaderboard?theme=riskstudio-app`: licht, RiskStudio-blauw en een gouden koploperskaart.

Deze paginakeuze verandert de game of het klassement niet. Onbekende namen vallen terug op Classic. Elke geregistreerde themadefinitie heeft een `leaderboardStylesheet`; de gedeelde monitorindeling staat in `public/leaderboard.css`. Er wordt geen spelrenderer, Galaxy-achtergrond of Easter Egg-plugin geladen.

## Automatische updates

De pagina haalt `/api/leaderboard` elke twee seconden na het vorige antwoord opnieuw op. Dit is polling, geen pushverbinding. Nieuwe scores, naams-/puntenwijzigingen, verwijderingen en resets verschijnen zonder handmatig herladen. De volgorde komt van dezelfde API als de game: punten, operationele diensten, vervolgens oorspronkelijke speeldatum.

Er is maximaal één verzoek tegelijk. Ongewijzigde scores bouwen het scherm niet opnieuw op. Een veranderde score krijgt kort een accent, met respect voor verminderde animatie. Achtergrondtabbladen stoppen de scoreverzoeken; terugkeren haalt direct verse gegevens op. Verzoeken hebben een timeout van acht seconden. Bij fouten blijven de laatst opgehaalde scores zichtbaar, wordt de status offline en volgt na vijf seconden een nieuwe poging. Een ontbrekend gameadres/QR wordt na vijftien seconden opnieuw geprobeerd.

De QR-bibliotheek is de bestaande lokale module, met een witte achtergrond en vier vrije modules rondom de code. De getoonde link en QR gebruiken dezelfde game-URL. De adreskopieerknop biedt een tekstalternatief als de browser het klembord weigert. Een ontbrekend lokaal wifi-adres wordt zichtbaar gemeld.

## Controle en grenzen

- Alle **53 projecttests** slagen, waaronder vijf nieuwe controles voor polling, bewaren bij verbindingsfouten, oude antwoorden na pauze, QR-adressen en lokale routes.
- Build en Worker-controle slagen, inclusief `/leaderboard`, trailing slash, beide thema’s en afgeschermde server-/gegevensbestanden.
- Browsercontrole: 1366×768, 1920×1080, 2560×1440 en 1080×1920; top 10 zichtbaar zonder scrollen op de gecontroleerde monitors. Op 320/390px geen horizontale overflow; de QR staat onder het klassement.
- Een gewijzigde score verscheen in de laatste geïsoleerde browsercontrole binnen **1,83 seconden**. Verbindingsverlies, automatisch herstel, reset en volledig scherm zijn gecontroleerd. Geen onverwachte browserfouten. De QR is met macOS Vision uit de schermafbeelding gedecodeerd naar dezelfde game-URL.
- Alle writes en scores in die controles waren fictief en tijdelijk. Geen bestaande highscores gewijzigd. Geen echte telefoon of actuele online publicatie getest.

Het bouwpakket meet **815.875 bytes** voor alle gepubliceerde bestanden. De bestaande game blijft binnen haar oorspronkelijke **800.000-byte** limiet: 795.425 bytes. De aparte monitorbestanden krijgen een eigen limiet van 25.000 bytes en gebruiken 20.450 bytes. Het totale pakket heeft daardoor een limiet van 825.000 bytes; de beeldlimiet van 650.000 blijft gelijk. Dit is een bovengrens over alle pagina’s en thema’s, geen gemeten download van één bezoek.

[Controlebewijs en screenshots](leaderboard-display-evidence-2026-10-06/verification.json). De screenshots gebruiken fictieve spelers en een inmiddels gesloten testadres. Online en lokaal houden elk hun eigen bestaande scores. De online pagina staat op https://riskstudio-cascade-command.codexwillem.chatgpt.site/leaderboard. De gepubliceerde bron gebruikt RiskStudio App; Classic is afzonderlijk via `?theme=classic` te kiezen.

## Publicatie, 6 oktober 2026

Sites bevestigt succesvolle productiepublicatie van versie 13 met broncommit `4107c1b5b68ece190033bfd11e7d5498e71e91fa`. De bestaande openbare toegang en DB-binding zijn behouden. De bron gebruikt RiskStudio App. De leaderboard haalt dezelfde scores op als de online game; de QR gebruikt hetzelfde openbare gameadres. De oorspronkelijke lokale bouwcontrole met Classic hierboven is historische context. Geen extra online browsertest uitgevoerd. [Publicatiebewijs](publicatie-leaderboard-2026-10-06.json).

## Bewegende winnaarskaartjes

De top 3 heeft een kroon, beker en medaille, met glans en terugkerende confetti. Een nieuwe podiumplek krijgt een kort entree-effect. De knop naast volledig scherm pauzeert de animaties; minder beweging wordt gerespecteerd. [Werking en controle](WINNAARSANIMATIES.md).

## Prijzenkaart en trekking, versie 15

De missiekaart draait nu naar configureerbare podiumprijzen en een dagelijkse troostprijs. De beheerder trekt eenmaal per kalenderdag; de uitslag verschijnt live onder het klassement. De top 3 op het trekkingsmoment is uitgesloten. Het monitorbudget is uitgebreid naar 40.000 bytes; het spelbudget blijft 800.000 bytes. Zie [prijzen en trekking](PRIJZEN_EN_TREKKING.md) voor de actuele instellingen en regels.
