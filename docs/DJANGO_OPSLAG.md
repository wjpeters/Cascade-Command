# Schakelbare game-opslag

Gebouwd op 7 oktober 2026 volgens `INTEGRATION.md` van de backendcollega. De game blijft op Sites; sessies, scores en statistieken kunnen gezamenlijk naar Django. De spelregelversie en bestaande engine zijn behouden. Browservoorkeuren en Easter Egg-kaarten blijven op het apparaat.

## Keuze in de config

De serverconfig staat in `storage/config.js`: `STORAGE_CONFIG.backend` is standaard `legacy`. `CASCADE_STORAGE_BACKEND` overschrijft dit per omgeving. Geldige waarden: `legacy` en `django`. De browser ontvangt alleen de geselecteerde modus en publieke mogelijkheden. Deze configuratie verandert het spelregel-ID niet.

| Modus | Lokaal | Op Sites |
|---|---|---|
| `legacy` | Bestaande JSON-bestanden en tijdelijke sessies | Bestaande D1-database |
| `django` | Server-side HTTP-adapter naar Django | Dezelfde HTTP-adapter, zonder gebruik van D1 |

Instellingen voor Django:

```dotenv
CASCADE_STORAGE_BACKEND=django
DJANGO_GAMES_API_BASE_URL=https://riskstudio-fafnir.abibia.com/api/v1/internal/games/cascade-command/
# CASCADE_COMMAND_API_TOKEN is een geheime serverwaarde; niet in broncode invullen.
```

Fafnir is alleen de huidige testomgeving. Later verandert uitsluitend `DJANGO_GAMES_API_BASE_URL`. Gebruik de volledige URL met afsluitende slash. De omgeving overschrijft de Fafnir-default uit de serverconfig. Gebruik HTTPS, behalve bij een lokale Django-server op localhost. Geen credentials, query of fragment in de URL.

## Lokaal starten en token

De bestaande startknop gebruikt de gekozen standaardconfig; zonder overrides blijft die legacy. `Start Cascade Command API.command` kiest expliciet Django. `Configureer API-token.command` opent een beveiligd macOS-invoervenster en slaat de token op als niet-synchroniserend item in de lokale login-sleutelhanger: service `wpos.cascade-command`, account `riskstudio-fafnir.abibia.com`. De API-startknop leest die token rechtstreeks in geheugen en geeft hem alleen aan de gameserver door.

Voor een andere URL: stel `DJANGO_GAMES_API_BASE_URL` in vóór configureren/starten. Het sleutelhanger-account volgt dan de hostnaam. `CASCADE_COMMAND_API_TOKEN` kan ook door de bestaande lokale serveromgeving worden aangeleverd. Zet de echte waarde niet in chat, shellargumenten, Git of iCloud-bestanden. `.env.example` bevat uitsluitend placeholders; er wordt geen geheim bestand aangemaakt.

## Sites

Stel bovenstaande URL en opslagkeuze in als Sites-runtimevariabelen. Voeg de token toe als **secret** met sleutel `CASCADE_COMMAND_API_TOKEN`. Dit is geen browservariabele en hoort niet in `.openai/hosting.json`. Publiceer daarna een versie om de nieuwe runtimeconfig toe te passen. Legacy blijft actief zolang geen omschakeling is uitgevoerd; er is geen automatische terugval bij Django-fouten.

De backendbeheerder moet netwerktoegang vanuit Sites toestaan, de migratie toepassen en Game `cascade-command` actief configureren met exact de huidige engineversie uit `/api/meta`. Backenddeployments lopen via de bestaande beheerprocedure. Geen nieuwe Django-code of migratie is in deze game gebouwd.

## Gedrag

- De browser blijft dezelfde-origin `/api/*` gebruiken. Alleen de gameserver kent de Django-token.
- `POST /api/session-id` bereidt een server-UUID voor zonder opslag. Django-startverzoeken hergebruiken dit ID, ook na een verloren browserantwoord.
- Django bepaalt seed, starttijd, vervaltijd en Amsterdamse startdag. De gedeelde engine valideert finish en score; actielijsten gaan niet naar Django.
- De adapter maakt expliciete payloads, maximaal 16 KiB; de publieke body blijft maximaal 160.000 bytes, met maximaal 1.000 replayacties.
- Bij netwerkfouten/timeouts/503: maximaal drie identieke pogingen, timeout vijf seconden per poging, backoff 250/750 ms plus jitter. Lange `Retry-After` gaat naar de browser. Er is geen blinde retry op 400/403/404/429 en retries stoppen bij sessieverval.
- Naam is altijd een openbare alias. Privénaam/e-mail/telefoon volgen de actuele `disabled`, `optional` of `required`-instelling. Spelen en afronden vereisen geen contactgegevens. Veldfouten laten invoer en sessie behouden; succes wist de privé-invoer uit het formulier.
- Django-leaderboards zijn per dag/versie. Het resultaatenscherm houdt de sessiestartdag vast. De monitor toont vandaag en volgt middernacht via het antwoord van Django.
- Legacy behoudt zijn bestaande versieklassement, beheer en dagelijkse trekking. Django sluit alle oude beheer-API's met 410 en verwijst op `/admin` naar Django admin. Troostprijstrekkingen en deelnameclaims staan daar uit; podiumprijzen blijven zichtbaar.
- Historische gegevens worden niet geïmporteerd en worden niet verwijderd. Django begint met nieuwe rondes. Geen mix van opslag, lokale sessiecache, dubbele statistiekregistratie of verborgen fallback.
- Fysieke retentie-opruiming in Django is een afzonderlijke backendtaak. Het integratiedocument vermeldt dat deze nog niet automatisch wordt uitgevoerd.

## Controle en omschakelen

De tests omvatten legacy-regressies, adaptercontracten, verloren antwoorden na opslag, contactfouten en correctie, impliciete finish, rang 11+, middernacht, versieverschillen, malformed/proxy-errors, begrensde retries, adminafscherming en een echte lokale Node-server zonder aangemaakte legacy-bestanden. De build controleert dat serverconfig en secrets niet via browserroutes bereikbaar zijn.

Voor live omschakelen zijn een geslaagde geauthenticeerde `meta/`-call vanuit Sites en een echte ronde met terugcontrole in Django admin vereist. Een 403 zonder token bevestigt alleen bereikbaarheid en weigering, niet dat token/netwerk/configuratie goed staan. Controleer ook de gedeelde backendlimiet van 600 calls/min bij de beursbelasting; de monitor pollt iedere twee seconden en de game buiten spelen iedere vijftien seconden.

Schakel in een onderhoudsvenster zonder actieve rondes: stop nieuwe spelers tijdelijk via de bestaande hosting/toegang, wacht maximaal dertig minuten na de laatste start en publiceer met de gekozen runtimeconfig. Pas deze procedure ook bij terugschakelen toe. Terugschakelen selecteert de oude gegevens; het kopieert geen Django-records terug.
