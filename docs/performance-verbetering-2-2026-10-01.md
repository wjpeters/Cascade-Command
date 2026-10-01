# Cascade Command: performanceverbetering 2

Datum: 1 oktober 2026. Lokale spelversie: `cascade-3-14f91b15`.

Pauze en het eindscherm zijn lokaal stilgezet. Na de overgang naar zo’n scherm
stopt de animatieplanning. In stabiele meetvensters blijven **nul tekenrondes en
nul HUD-mutaties** over. De HUD schrijft tijdens spelen alleen gewijzigde tekst,
balken, attributen en knopstatussen. Deze tweede wijziging is nog niet gepubliceerd.

## Gemeten verschil

| Toestand | Tekenrondes/s vóór | Tekenrondes/s na | HUD-mutaties/s vóór | HUD-mutaties/s na |
|---|---:|---:|---:|---:|
| Spelen, rustig fragment zonder invoer | 59,9 | 60,0 | 254,8 | 1,0 |
| Stabiele pauze | 60,2 | **0** | 1.083,1 | **0** |
| Stabiel eindscherm | 59,9 | **0** | 1.078,5 | **0** |

Ook alle overige gemeten DOM-mutaties waren nul in de stabiele pauze- en
eindschermvensters. Tijdens het rustige spelfragment daalden alle DOM-mutaties
van 317,0 naar 3,2 per seconde. Dit spelfragment bevatte weinig zichtbare
wijzigingen. Invoer, schade, scans en energieherstel veroorzaken terecht meer
updates wanneer die gegevens veranderen.

Dit meet geplande callbacks, canvas-tekenrondes en DOM-mutaties. Het meet geen
gepresenteerde GPU-frames, batterijverbruik of thermische belasting van een telefoon.

## Wat is aangepast

- De animatielus plant alleen vervolgframes tijdens spelen, de intro en de demo.
  Pauze en het eindscherm krijgen één tekening. Een echte wijziging van de
  canvasafmetingen vraagt één nieuwe tekening; een ongewijzigde resize doet niets.
- De tijdreferentie wordt bij hervatten opnieuw gestart. De simulatie haalt geen
  gepauzeerde of verborgen tijd in. De vaste simulatiestap blijft 60 Hz.
- De HUD heeft een eigen klok van maximaal 15 reguliere controles per seconde.
  Scannen en een schermovergang werken de relevante status direct bij. Tekst,
  energiebreedtes, ARIA-waarden, classes en disabled/hidden-statussen worden
  alleen geschreven als de nieuwe waarde afwijkt.
- Het aantal operationele diensten gebruikt dezelfde tekstnode en dezelfde
  noemer. `innerHTML` bouwt die onderdelen niet meer steeds opnieuw op.
- Het verdwijnen van een tijdelijk bericht gebruikt één timer. Pauze en het
  eindscherm ruimen een bestaand bericht direct op. Er is geen verwijderactie
  voor dat bericht meer nodig in iedere animatiecallback.
- Een ongewijzigd leaderboardantwoord bouwt de lijst niet opnieuw op. Nieuwe
  scores en gewijzigde eigen-scoremarkering blijven wel zichtbaar. Bij een
  verborgen tabblad stopt automatische leaderboardpolling en stopt tekenen,
  ook in de intro en de demo. Een echte ronde gaat dan op pauze.

Spelengine, spelregels, moeilijkheid, scorecontrole en score-identiteit zijn niet
gewijzigd. De vorige afbeeldingoptimalisatie is behouden. Het huidige volledige
downloadbudget telt **414.275 van maximaal 800.000 bytes**, inclusief de optionele
QR-bibliotheek. Afbeeldingen tellen 234.587 van maximaal 650.000 bytes.

## Controle

- Alle **20 bestaande regressietests**, de build, het downloadbudget en de
  Worker-bouwcontrole slagen.
- De nieuwe browsercontroles slagen in Chrome op desktop en mobiel en in
  WebKit op mobiel. Ze controleren scannen, schade/weerbaarheid, pauzeren,
  hervatten, eindscherm, opnieuw spelen, intro en demo. Geen JavaScriptfouten
  of horizontale overflow gevonden.
- In elk van deze drie browserprofielen bleef de simulatietick onveranderd
  tijdens pauze en het eindscherm. Resize veroorzaakte één nieuwe tekening;
  daarna bleef het scherm weer stil. Bij hervatten volgden vijf tot zes ticks in circa
  122–123 ms, zonder sprong voor de voorafgaande stilstand.
- Visibility-events met een gesimuleerde hidden-waarde zijn gecontroleerd in
  intro, demo en spelen. In 16 seconden virtuele verborgen tijd waren er geen
  tekenrondes, callbacks, simulatieticks of automatische leaderboardverzoeken.
- Een vertraagde sessiestart nadat het tabblad verborgen werd, komt op pauze
  binnen. De speler hervat zelf zodra het tabblad weer zichtbaar is.
- Een normale leaderboardpoll tijdens een stabiele pauze is apart uitgevoerd.
  Bij hetzelfde antwoord bleven DOM-mutaties en tekenrondes nul.
- Met een gesimuleerde 120 Hz-klok waren er in 1,6 seconden 192 callbacks,
  95 simulatieticks en slechts 21 energie-updates, terwijl het proefveld op
  iedere simulatietick veranderde. De HUD-klok hangt niet meer af van een
  modulo op de simulatietick. Dit is geen test op een fysiek 120 Hz-scherm.

## Meetmethode en bewijs

Voor en na zijn dezelfde viersecondenvensters gemeten in Chrome op deze Mac,
1440 × 900 pixels met DPR 2, via een aparte lokale server en een apart
testklassement. Voor is de code na afbeeldingoptimalisatie; na is deze tweede
wijziging. De pauze- en eindschermmetingen starten na het uitdoven van tijdelijke
meldingen. Voor de eindschermmeting is alleen in de browserproef de ronde
versneld tot het reguliere eindpad. Er zijn geen online testscores opgeslagen.

De browserproeven van schade en korte ronde-einden gebruiken alleen testdata
in de browser. Ze wijzigen de spelbroncode niet. Screenshots zijn visueel
gecontroleerd. Een fysieke telefoon en werkelijk energieverbruik zijn niet getest.

Meetgegevens, screenshots, browserproeven en het budgetoverzicht staan in
`docs/performance-verbetering-2-evidence-2026-10-01/`. De proeven gebruiken de
op deze Mac aanwezige Codex-runtime en browsers; ze voegen geen nieuwe
afhankelijkheid aan de game toe.

De openbare game is alleen gelezen. Die levert de eerder gepubliceerde
afbeeldingsverbetering, maar nog de animatielus en HUD van vóór deze tweede
wijziging. Lokaal is geen serverherstart nodig: vernieuw de pagina op
[localhost:4317](http://localhost:4317/) om de nieuwe browsercode te laden.
