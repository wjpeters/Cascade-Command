# game.riskstudio.com: gateway en browserdoorverwijzing

Diagnose op 6 oktober 2026.

## Oorzaak

`https://game.riskstudio.com/` levert HTTP 200 met `Server: Riskstudio Gateway`, zonder `Location`-header. Dit is een reverse proxy: de browser houdt het game-domein, maar `/api/meta` laat zien dat de backend de oorspronkelijke Sites-origin gebruikt.

De bestaande servercontrole vergelijkt `Origin` met de request-URL. Een start vanuit het game-domein wordt daardoor geweigerd: `https://game.riskstudio.com` verschilt van `https://riskstudio-cascade-command.codexwillem.chatgpt.site`. Productielogs tonen drie POST `/api/session` met 403 om 14:35:25, 14:35:33 en 14:35:35 UTC. Een geïsoleerde API-aanroep reproduceert 403 met ‘Open de game op deze website.’ Er is geen live testronde aangemaakt.

## Oplossing in de site

De game, het aparte leaderboard en de adminpagina controleren hun browseradres vóór initialisatie. Op exact `https://game.riskstudio.com` gaan ze via `location.replace` naar de bestaande Sites-origin, met behoud van pad, zoekparameters en fragment. Tijdens de navigatie starten ze geen game, bezoekmeting, polling of beheeraanroep. Rechtstreeks op Sites, localhost en LAN verandert niets. Er is geen redirectlus en geen ruimere server-originvrijgave.

Dit herstelt de bedoelde browserdoorverwijzing. De eerste HTML-pagina blijft technisch HTTP 200 via jullie gateway; pas het geladen script stuurt de browser door. De gatewayconfiguratie is niet gewijzigd. Een echte HTTP-redirect in jullie gateway, bijvoorbeeld 302 of 307 met `Location` naar de Sites-URL en behoud van pad/query, is de zuiverste infrastructuuroplossing.

Wanneer `game.riskstudio.com` tijdens het spelen zichtbaar moet blijven, is dit een andere keuze: koppel het domein rechtstreeks als officieel Sites-domein, of configureer de gateway en servercontroles samen voor die origin. De huidige Site heeft geen gekoppelde custom domains. Dit is niet uitgevoerd.

## Verificatie

Twee regressietests controleren alleen het bekende aliasdomein, behoud van routes/parameters/fragment, bescherming tegen onbekende hosts/open redirects, geen loop en blokkade van initialisatie tijdens navigatie. Een geïsoleerde browserproef emuleert de gateway en controleert game, leaderboard en admin zonder productie-POSTs.

De lokale bestaande wijziging `easterEggs: false` blijft behouden in de gepubliceerde bron. Spelregels en score-editie wijzigen niet.

62 regressietests en de browser-/bouwcontrole slagen. [Browserbewijs](game-domein-evidence-2026-10-06/verification.json), [diagnosebewijs](game-domein-diagnose-2026-10-06.json). Alle browserverzoeken gingen naar een tijdelijke lokale server; er is geen live testronde aangemaakt.

## Live herstelversie

Sites-versie 16 succesvol gepubliceerd op 6 oktober 2026 om 14:49:59 UTC. Native status `succeeded`; broncommit `dd61e4e7c6199bbc397235d2ad1bfceb40e7d4a6`. [Publicatiebewijs](publicatie-game-domein-2026-10-06.json). Geen extra live POST-starttest uitgevoerd; de automatische goedkeuringscontrole wees die test af omdat ze een productieronde zou kunnen aanmaken. De geïsoleerde browserproef start wel succesvol een tijdelijke ronde na de doorverwijzing.
