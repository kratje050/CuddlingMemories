# Openbare afbeeldingen publiceren via GitHub en Netlify

Deze workflow geldt uitsluitend voor openbare portfoliofoto's en vaste websiteafbeeldingen. Beveiligde klantgalerijen en privéfoto's blijven volledig in de Supabase-bucket `client-galleries`.

## Werking

1. De beheerder kiest een JPG, PNG of WebP van maximaal 5 MB.
2. `/api/public-image-publish` controleert de Supabase-sessie en het bijbehorende `admin_profiles`-record.
3. Sharp draait de foto volgens de EXIF-oriëntatie, verwijdert metadata en maakt WebP-varianten van 480, 960 en 1600 pixels breed.
4. De Function maakt contenthash-bestandsnamen en schrijft alle varianten in één atomaire GitHub-commit.
5. GitHub/een optionele build-hook start een Netlify-deploy.
6. Een achtergrondtaak controleert de publieke bestanden. Pas wanneer alle bestanden een geldige afbeelding teruggeven, wordt het portfolio- of pagina-record aangepast.
7. Bij een fout blijft het bestaande databasepad intact. Oude repositorybestanden worden niet automatisch verwijderd.

## Eenmalige SQL-migratie

Voer `supabase/github-public-image-publishing-migration.sql` uit in de Supabase SQL Editor. De migratie voegt responsive metadata en de beveiligde publicatiewachtrij toe.

## Netlify environment variables

Voeg deze toe via **Netlify > Site configuration > Environment variables**. Geef geheimen alleen de scopes **Functions** en **Runtime**; zet ze nooit in een `VITE_`-variabele.

| Variabele | Voorbeeld | Geheim |
| --- | --- | --- |
| `GITHUB_PUBLIC_IMAGES_TOKEN` | GitHub fine-grained token | Ja |
| `GITHUB_PUBLIC_IMAGES_OWNER` | `kratje050` | Nee |
| `GITHUB_PUBLIC_IMAGES_REPO` | `CuddlingMemories` | Nee |
| `GITHUB_PUBLIC_IMAGES_BRANCH` | `main` | Nee |
| `PUBLIC_IMAGE_BASE_URL` | `https://cuddlingmemories.nl` | Nee |
| `PUBLIC_IMAGE_FINALIZE_SECRET` | willekeurige lange tekenreeks | Ja |
| `PUBLIC_IMAGE_MAX_BYTES` | `5000000` | Nee, optioneel |
| `NETLIFY_PUBLIC_IMAGES_BUILD_HOOK` | beveiligde Netlify build-hook | Ja, alleen nodig zonder automatische Git-deploy |

`VITE_SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` bestaan al voor de serverfuncties. De service-role key blijft uitsluitend server-side.

### Previewconfiguratie

Gebruik voor een branch-preview tijdelijk:

- `GITHUB_PUBLIC_IMAGES_BRANCH=codex/github-public-image-upload`
- `PUBLIC_IMAGE_BASE_URL` als de stabiele Netlify branch-deploy-URL, niet als unieke onveranderlijke deploy-URL.
- Een branch-specifieke build-hook wanneer de GitHub-koppeling branch-deploys niet automatisch bouwt.

Zet deze waarden pas na de previewtest voor Production om naar `main` en `https://cuddlingmemories.nl`.

## GitHub-token veilig aanmaken

1. Open GitHub **Settings > Developer settings > Personal access tokens > Fine-grained tokens**.
2. Kies alleen repository `kratje050/CuddlingMemories`.
3. Geef **Repository permissions > Contents: Read and write**. Metadata blijft automatisch read-only.
4. Kies een korte vervaldatum en maak het token aan.
5. Sla het token direct als `GITHUB_PUBLIC_IMAGES_TOKEN` in Netlify op. Plaats het nooit in Git, `.env`, frontendcode of een `VITE_`-variabele.

## Noodfallback

De oude openbare Supabase-uploadcode blijft tijdelijk aanwezig maar staat standaard uit. Alleen voor een gecontroleerde terugval kan tijdens een build `VITE_PUBLIC_IMAGE_UPLOAD_MODE=supabase` worden ingesteld. Dit is geen geheim. Zet deze variabele weer uit zodra de storing voorbij is.

## Testcontrole

Bij een handmatige previewdeploy vanaf Windows installeer je eerst ook de Linux-runtime die Netlify Functions gebruikt:

```powershell
npm.cmd install --include=optional --os=linux --cpu=x64
```

Een normale Git-gestuurde Netlify-build draait al op Linux en installeert deze dependencies vanzelf.

- Upload via een Netlify branch-preview, niet via productie.
- Controleer de statussen `Upload verwerken`, `Website wordt bijgewerkt` en `Gereed`.
- Open de nieuwe `/images/...`-URL en controleer alle drie varianten.
- Controleer in de browser dat deze foto geen `supabase.co/storage/v1` gebruikt.
- Upload apart een klantgalerijfoto en bevestig dat die nog uit `client-galleries` komt.
- Controleer pas daarna de productievariabelen en voer een productiedeploy uit.
