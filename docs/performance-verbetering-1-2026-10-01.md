# Cascade Command: performanceverbetering 1

Datum: 1 oktober 2026. Lokale spelversie: `cascade-3-14f91b15`.

De eerste verbetering is lokaal uitgevoerd. De spelafbeeldingen zijn 93% kleiner.
Op hetzelfde vertraagde mobiele profiel daalt de mediane tijd tot speelgereed
van **16.14 naar 2.17 seconden**. De lokale game is herstart op
[localhost:4317](http://localhost:4317/). Deze wijziging is nog niet gepubliceerd.

## Voor en na

| Onderdeel | Voor | Na | Verschil |
|---|---:|---:|---:|
| Achtergrond | 1.726.816 bytes | 50.078 bytes | −97,1% |
| Spriteblad | 1.349.760 bytes | 165.050 bytes | −87,8% |
| Logo | 272.082 bytes | 19.276 bytes | −92,9% |
| Drie spelafbeeldingen samen | 3.348.658 bytes | 234.404 bytes | **−93,0%** |
| Gemeten eerste paginalading, inclusief code en API-antwoorden | 3.471.641 bytes | 360.345 bytes | **−89,6%** |
| Speelgereed, mediaan van drie metingen | 16.14 s | 2.17 s | **−86,5%** |

Bestandsgroottes en downloads tellen alleen de inhoud, zonder HTTP-headers.
De twee doelen uit het eerdere rapport zijn gehaald in deze lokale meting:
minder dan 800 kB downloaden en binnen 5 seconden speelgereed.

## Wat is aangepast

- De drie PNG-afbeeldingen zijn vervangen door WebP. Het logo is 512 × 130 pixels.
  De achtergrond houdt dezelfde afmetingen. Het spriteblad bevat alleen de
  gebruikte node en het beschermingsveld, elk 512 × 512 pixels, naast elkaar.
  De renderer gebruikt de bijbehorende twee uitsneden.
- De originele PNG-bestanden staan in `design/source-assets/`, met hashes en
  conversie-instellingen. Ze worden niet meer in de browserbuild opgenomen.
- Het noodzakelijke spriteblad wordt vroeg geladen. De start- en demoknoppen
  wachten totdat de spelbeelden zijn gedecodeerd. De pagina toont laadvoortgang,
  gereedstatus en bij een fout een zichtbare knop **Opnieuw laden**. Een sessie
  begint pas na laden en een expliciete startactie.
- Een ontbrekend logo of achtergrond blokkeert het spel niet. De noodzakelijke
  sprites moeten wel beschikbaar zijn. Opnieuw laden hergebruikt afbeeldingen
  die al succesvol zijn gedecodeerd.
- Afbeeldingsnamen bevatten een inhoudsafdruk. Die bestanden krijgen een lange
  cacheduur. Een aangepaste afbeelding krijgt een nieuwe naam, zodat een oude
  cache de nieuwe versie niet tegenhoudt.

De berekende RGBA-pixelomvang van de drie beelden daalt van ongeveer 16,0 naar
8,3 MiB. Dit is een berekening uit de afmetingen, geen gemeten browsergeheugen.
Spelregels, moeilijkheid en score-identiteit zijn door deze wijziging niet veranderd.

## Downloadbudget

`download-budget.json` begrenst alle gepubliceerde browserbestanden samen op
**800.000 ongecomprimeerde bytes**, waarvan maximaal **650.000 bytes afbeeldingen**.
De controle telt ook de optionele QR-bibliotheek mee. Daarmee is deze telling
ruimer dan de daadwerkelijke eerste paginalading. API-antwoorden vallen buiten
de bestandscontrole en zitten wel in de bovenstaande browsermeting.

De huidige build telt **412.154 bytes**, waaronder **234.587 bytes afbeeldingen**
inclusief het favicon. De berekende omvang met gzip voor tekst is 285.300 bytes;
dit is een schatting, geen gemeten online transfer.

Controleer met `rtk proxy npm run check:budget`. Dezelfde controle draait vóór
`rtk proxy npm run build`. Een overschrijding stopt de build voordat het vorige
bouwresultaat wordt vervangen. De build bewaart het overzicht per bestand in
`dist/download-budget.json`. Zowel een te grote afbeelding als een te grote totale
download is met een aparte proef gecontroleerd en wordt geweigerd.

## Controle en meetmethode

- Alle **20 bestaande regressietests** slagen. De Worker-build en de controle van
  bestandsroutes, WebP-types, cacheheaders en afgeschermde bronbestanden slagen.
- Browsercontroles slagen in Chrome op 1440 en 320 pixels breed en in WebKit op
  390 pixels breed. Starten, touch/muisklik, node- en beschermingsveldsprites,
  scannen, pauzeren, hervatten, demonstratie en opnieuw starten werken.
- Vertraagde sprites houden de knoppen uitgeschakeld. Een geforceerde laadfout
  toont de foutmelding; opnieuw laden herstelt het spel. Uitval van decoratieve
  beelden laat de missie starten. Geen JavaScriptfouten of horizontale overflow
  gevonden in deze controles.
- Voor en na zijn elk drie koude Chrome-metingen uitgevoerd op dezelfde Mac,
  via dezelfde lokale testserver met een apart testklassement: 390 × 844 pixels,
  schermdichtheid 3, CPU-vertraging 4×, 150 ms netwerkvertraging en 200.000 bytes/s
  download. Browsercache stond uit. Voor telt de decode van de noodzakelijke
  sprites als speelgereed; na telt de zichtbare gereedstatus, die ook op de
  overige beelddecodes wacht.
- De drie tijden vóór lagen tussen 16,05 en 16,15 seconden; na tussen 2,16 en
  2,18 seconden. Dit is een vergelijking onder gecontroleerde omstandigheden,
  geen voorspelling voor iedere telefoon of het online hostingplatform.

Screenshots zijn visueel gecontroleerd. Een fysieke telefoon is nog niet getest.
Deze wijziging verbetert laden en beeldomvang; het eerder gerapporteerde werk
van de animatielus tijdens pauze valt buiten deze eerste wijziging.

## Bewijs en publicatiestatus

Meetgegevens, screenshots, gebruikte browserproeven en het budgetoverzicht staan
in `docs/performance-verbetering-1-evidence-2026-10-01/`.
De browserproeven gebruiken de op deze Mac aanwezige Codex-runtime en browsers;
ze voegen geen runtimeafhankelijkheid aan het spel toe.

De [openbare RiskStudio-game](https://riskstudio-cascade-command.codexwillem.chatgpt.site/)
is na deze lokale wijziging alleen gelezen. Die leverde HTTP 200, verwees nog
naar het PNG-logo en bevatte de nieuwe laadstatus niet. De eerdere online versie
is dus nog actief. Publiceren en opnieuw meten op de online host zijn de
resterende stappen om dit resultaat daar beschikbaar te maken.

Voor de gebruikte browserfuncties: [MDN over image decode](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode)
en [web.dev over fetch priority](https://web.dev/articles/fetch-priority).
