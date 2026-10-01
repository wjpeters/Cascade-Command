# The Force Behind the Galaxy

Zelfstandige presentatieplugin voor Cascade Command. Alle code, portretten, styling en aanvullende geluiden staan in deze map. Geen externe bibliotheken of requests.

## Aan of uit

Stel `easterEggs: true` of `easterEggs: false` in `src/game-config.js` in. Momenteel aan (`true`); zet op `false` om uit te schakelen. Lokaal de server herstarten en de pagina vernieuwen; online opnieuw bouwen en publiceren. Geen aparte .env, queryparameter of live-configuratiemonitor.

Bij `false`:

- Geen dynamische import, CSS, portretdownloads, listeners, timers of observers.
- De lokale server weigert pluginroutes met 404.
- De Worker-build en downloadbudgetcontrole sluiten deze map uit.
- De main-module houdt alleen een startupcontrole en een verwisselbare gamefactory over; er staan geen pluginchecks in de animatie-/simulatielus.

Bij `true` heeft elke extra functie kleine kosten. De plugin claimt daarom geen letterlijk nul overhead terwijl hij actief is. Er is geen extra renderlus, continue polling, framework of trackingdienst.

## Tien ontdekkingen

| Collega | Personage | Trigger | Tekst |
|---|---|---|---|
| Marcel | Obi-Wan Kenobi | Open de speluitleg drie keer op het startscherm | Ik voel een verstoring in de supply chain. |
| Niels | Mace Windu | Overleef de eerste golf zonder schade aan diensten | Sprint voltooid. Deze Galaxy heeft geen ruimte voor blockers. |
| Jelle | Yoda | Voorkom drie kettingreacties in één ronde | Sterk in deze code, de Force is. |
| Kevin | R2-D2 | Scan alle drie de leverancierstiers in één ronde | Kevin heeft de afhankelijkheden doorgerekend. |
| Robin | Poe Dameron | Onderschep drie dreigingen elk binnen drie seconden na hun ontstaan | Robin houdt de Galaxy op koers. |
| Stefan | Chewbacca | Haal een combo van vijf | Stefan’s Wookiee Solo. |
| Nick | Qui-Gon Jinn | Laat drie LOW-signalen veilig aankomen in één ronde | Dit zijn niet de risico’s die je zoekt. |
| Murray | Din Djarin | Tik drie keer op de rondetijd op het startscherm | This is the way. Naar productie. |
| Luuk | Han Solo | Onderschep de eerste dreiging vóór je eerste scan | Luuk schoot eerst. |
| Willem | Darth Sidious / Emperor Palpatine | Houd het centrum van de Galaxy op het startscherm drie seconden vast | Unlimited visibility! |

Willems toetsenbordalternatief: focus het speelveld en houd W drie seconden vast. Loslaten, bewegen, een andere toestand of een verborgen venster annuleert het vasthouden. De rondetijd is ook met Tab en Enter/Spatie te bedienen.

Marcel en Murray tellen tijdens deze pagina-sessie. De andere speltriggers tellen binnen een echte ronde; de attract/demo maakt geen ontdekkingen. Niels volgt de huidige eerste-golfgrens in de centrale instellingen. Lage risico’s tellen pas bij veilige aankomst, niet bij ontstaan. Robin volgt dezelfde 180 simulatieticks als de reactietijdbonus. Een al gevonden collega wordt niet herhaald. Alle tien gevonden geeft een gezamenlijke troonzaalfinale.

## Isolatie

`index.js` beheert uitsluitend de plugin-UI, lokale collectie en kortlopende timers. `detector.js` bevat de pure triggerregels. `observe.js` plaatst verwijderbare observers op de drie methodes van de huidige **browserinstance**, uitsluitend voor een echte ronde. Intro- en demorondes houden hun originele methodes. De originele methode draait altijd eerst. De pure detector krijgt kopieën van cijfers en een gekopieerde health-array. Er wordt niets aan `Game.prototype`, de enginebron, de server-replay of bestaande spelgebeurtenissen toegevoegd.

De gamefactory wordt pas vervangen na een geslaagde opt-in import. Een laat geladen plugin begint niet halverwege een echte ronde te tellen. De eerstvolgende nieuwe ronde wordt dan gevolgd. Bij een fout worden de observers en plugin-UI verwijderd en blijven de originele methodes beschikbaar. Ook het koppelen van een nieuwe ronde valt onder deze foutafhandeling. Ontdekkingen uit een vorige ronde worden bewaard zonder late pop-up op het startscherm.

De configuratievingerafdruk negeert alleen de presentatieschakelaar. Aan- en uitzetten verandert dus geen klassementidentiteit of gameplay. Triggers worden niet naar de server gestuurd. De plugin heeft geen scores, accounts of klantgegevens nodig.

Portretbeelden verschijnen alleen bij ontdekte kaarten die worden bekeken. Groot beeld, geluid en CSS-animaties worden buiten actief spel getoond; tijdens spel is er op desktop maximaal één korte tekstmelding naast het speelveld. Op mobiel wordt deze melding weggelaten. De collectieknop is tijdens spelen/demo verborgen. Als je vanuit pauze de collectie opent, blijft de ronde gepauzeerd. Geluid volgt de bestaande mute-instelling. `prefers-reduced-motion` schakelt de extra animaties uit. Opslag- of beeldfouten blokkeren het spel niet.

## Beelden en herkomst

De tien portretten zijn afgeleid van de al gemaakte en besproken reviewbeelden met de openbare RiskStudio-teamillustraties als gezichtsreferentie. Bron: https://riskstudio.com/en/blog/meet-riskstudio/

De plugin bevat transparante WebP’s van 384 × 384, samen circa 302 KiB. `portraits.js` verwijst naar de bestandsvingerafdrukken; gewijzigde beelden krijgen een nieuwe URL. De grote PNG-reviewbeelden zijn niet meegenomen. Geluid bestaat uit korte eigen synthesizertonen; er zijn geen filmopnames of soundtracks toegevoegd.

## Controle

`npm test` controleert de pure triggers, herhaling, demo-uitsluiting, foutisolatie en identieke simulatie/replay met observatie aan/uit. `npm run build` bewaakt het bestaande downloadbudget. `node scripts/validate-build.mjs` controleert de pluginroutes en alle tien portretten volgens de ingestelde vlag.

Controle op 1 oktober 2026:

- Alle 31 tests slagen, waaronder een volledige ronde met vergelijking na iedere simulatietick en gelijke server-replay.
- Aan: 36 bouwassets, 757.725 bytes totaal; beelden 543.399 bytes, binnen het bestaande budget van 800.000/650.000 bytes. Alle tien portretten en pluginroutes zijn gecontroleerd.
- Uit: geen plugin in de Worker-build, pluginroutes geven 404 en de browser doet geen pluginrequests.
- Lokale browsercontrole: desktop, een mobiele viewport van 390 × 844, regels/drievoudige kloktrigger, Willems centrumtrigger, aanwijzingen, opslag, tien geladen portretten, Council/troonzaal, toetsenbordfocus, Escape zonder hervatten en minder beweging. De volledige collectie is met tijdelijke testgegevens bekeken.
- Fysieke telefoon, hoorbare weergave op een apparaat en een live-performanceprofiel zijn niet gecontroleerd. De actieve plugin heeft beperkte maar niet nul kosten.
- Beide standen zijn gecontroleerd. De vlag is daarna op `true` gezet; die tussentijdse wijziging is behouden en de definitieve build bevat de plugin. Geen nieuwe Sites-publicatie.

Deze module kan apart worden aangepast of verwijderd. Zet de vlag uit vóór verwijderen en bouw opnieuw.
