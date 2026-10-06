# Winnaarsanimaties voor het leaderboard

Gebouwd op 6 oktober 2026 om voorbijgangers op de monitor te laten zien dat ze kunnen meespelen.

- Goud: een zwevende kroon bij de koploper.
- Zilver: een bewegende beker op plek twee.
- Brons: een medaille op plek drie.
- Elke twaalf seconden loopt een glans over de kaarten en verschijnt een korte confettipuls. De drie kaarten zijn 1,2 seconden versprongen.
- Bij gewijzigde score, naam of podiumpositie krijgt de betreffende award een korte entree en direct confetti. Lege podiumplekken krijgen geen winnaarssymbool.

Namen en scores bewegen niet. De versiering is puur decoratief en verborgen voor screenreaders. De bestaande top 10, QR en score-API blijven gelijk. Beide bewaarde thema’s gebruiken dezelfde podiumeffecten. De animaties zijn begrensd tot vier confettideeltjes per kaart en gebruiken CSS, zonder nieuwe animatietimer of renderlus in JavaScript.

## Pauze en leesbaarheid

Klik naast volledig scherm op **Animaties pauzeren**. De knop wordt daarna **Animaties hervatten**. Een achtergrondtab stopt de animaties; terugkeren respecteert een handmatige pauze. De systeemvoorkeur voor minder beweging toont de awards stil en verbergt glans en confetti.

De monitorindeling blijft gelijk en toont de top 10 zonder scrollen op de gecontroleerde monitormaten. Op mobiel blijven de awards kleiner en staat de QR onder het klassement.

## Controle

53 projecttests slagen. Browsercontrole met fictieve scores op 1920×1080, 1366×768, 2560×1440, 1080×1920, 390px en 320px bevestigt geen horizontale overflow, pauze/hervatten, minder beweging, doorlopende animaties bij ongewijzigde polling en de nieuwe podium-entree. Een scorewijziging verscheen binnen twee seconden. Netwerkherstel, reset, QR en volledig scherm blijven werken. Geen onverwachte browserfouten en geen echte highscores gewijzigd.

De monitorbestanden meten 24.959 van maximaal 25.000 bytes. De bestaande game meet 795.432 van maximaal 800.000 bytes; alle gepubliceerde bestanden samen 820.391 van maximaal 825.000 bytes. Geen nieuwe afbeeldingen of externe bibliotheken.

[Controlebewijs](winners-evidence-2026-10-06/verification.json), [desktopvoorbeeld](winners-evidence-2026-10-06/riskstudio-app-1920.png), [mobielvoorbeeld](winners-evidence-2026-10-06/riskstudio-app-390.png). De beelden bevatten fictieve spelers en een inmiddels gesloten testadres. Publicatie wordt afzonderlijk vastgelegd zodra Sites succes bevestigt.

## Live gepubliceerd

Sites-versie 14 is succesvol gepubliceerd op [het live leaderboard](https://riskstudio-cascade-command.codexwillem.chatgpt.site/leaderboard). Native Sites-status `succeeded`, broncommit `4b48903ca1cd78cac01cd704d57338b7b80304a7`. Bestaande openbare toegang, DB-binding, score-API en spelregels behouden. [Publicatiebewijs](publicatie-winnaars-2026-10-06.json).
