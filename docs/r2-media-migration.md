# Galerijoptimalisatie en optionele R2-migratie

## Waarom deze opzet

Supabase Storage gebruikt weinig opslag, maar leverde grote originele galerijbestanden herhaaldelijk uit. In de gemeten periode was Cached Egress 6,345 GB van 5 GB, terwijl Storage ongeveer 152 MB en de database ongeveer 28 MB gebruikten.

Openbare portfolio- en websitebeelden worden al als geoptimaliseerde WebP-bestanden via GitHub en Netlify gepubliceerd. Dat pad blijft behouden: het is publiek, snel en veroorzaakt geen Supabase Storage-egress.

Zolang R2 nog niet is geactiveerd gebruikt de site `supabase-optimized`. Nieuwe klantfoto's worden eerst tijdelijk naar Supabase geupload en daarna server-side omgezet naar WebP-formaten van 480, 960 en 1600 pixels. De galerij levert vervolgens het passende formaat uit via een gecontroleerde media-URL. Bestaande galerijfoto's blijven ongewijzigd werken. R2 blijft een optionele vervolgstap.

## Beveiliging

- Bij `supabase-optimized` worden alleen tijdelijke stagingbestanden en nieuw aangemaakte varianten verwerkt; bestaande foto's worden niet verwijderd.
- Uploads worden alleen voorbereid na controle van een ingelogde `admin_profiles`-gebruiker.
- De browser krijgt uitsluitend een tijdelijk uploadtoken.
- De Netlify Function controleert type en grootte, verwijdert metadata door opnieuw naar WebP te encoderen en maakt 480, 960 en 1600 pixels brede varianten.
- Een klantfoto wordt alleen via `/api/gallery-media` geopend na controle van de lange galerijtoken, publicatiestatus en vervaldatum.
- Bestaande Supabase-objecten worden tijdens deze fase niet verwijderd.

## Nu gebruiken zonder R2

1. Voer de additieve migratie `supabase/r2-gallery-storage-migration.sql` uit. Deze voegt alleen variantvelden toe en verwijdert niets.
2. Stel in Netlify voor een Deploy Preview in:

```text
CLIENT_GALLERY_STORAGE_PROVIDER=supabase-optimized
```

3. Upload een nieuwe testfoto via desktop-admin en via de iPhone-PWA.
4. Controleer in Supabase Storage dat onder `optimized/<gallery-id>/...` drie WebP-bestanden zijn gemaakt.
5. Open thumbnail, normale foto en lightbox in de klantgalerij.
6. Controleer dat een bestaande galerijfoto nog via de oude URL opent.
7. Publiceer pas naar productie nadat de previewtest is goedgekeurd.

## Cloudflare R2 instellen

1. Maak bucket `cuddling-memories-media`.
2. Laat de bucket prive; zet `r2.dev` public access uit.
3. Voeg CORS toe voor de echte productie- en Netlify-previeworigins:

```json
[
  {
    "AllowedOrigins": [
      "https://cuddlingmemories.nl",
      "https://cuddling-memories-fotografie.netlify.app"
    ],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Voeg voor een previewtest tijdelijk ook de exacte preview-origin toe. Een wildcard is voor deze priveworkflow niet wenselijk.

4. Maak bij **R2 > Manage R2 API Tokens** een token met alleen Object Read & Write voor deze ene bucket. Vul de sleutel zelf in Netlify in; plaats hem niet in GitHub of een lokaal `.env`-bestand dat gedeeld wordt.

## Netlify-variabelen

Stel deze in via **Site configuration > Environment variables** voor Functions/Runtime:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME=cuddling-memories-media
CLIENT_GALLERY_STORAGE_PROVIDER=supabase-optimized
```

Gebruik geen `VITE_`-prefix. De R2-variabelen mogen leeg blijven zolang de provider `supabase-optimized` is. Zet de provider pas later in een Deploy Preview op `r2` nadat R2 handmatig is geactiveerd. Productie blijft op de laatst geteste provider tot de volledige previewtest is goedgekeurd.

## Testvolgorde

De R2-testvolgorde blijft hetzelfde wanneer R2 later wordt geactiveerd: configureer de geheimen alleen server-side, zet de provider eerst op `r2` in een Deploy Preview, controleer uploads en mediaweergave en migreer of verwijder geen bestaande objecten zonder afzonderlijke toestemming.

## Terugval

Zet `CLIENT_GALLERY_STORAGE_PROVIDER` terug op `supabase`. Nieuwe uploads gebruiken dan direct weer het bestaande Supabase-pad. Reeds geoptimaliseerde Supabase-records blijven leesbaar. Bestaande R2-records blijven leesbaar zolang de R2-variabelen aanwezig zijn.
