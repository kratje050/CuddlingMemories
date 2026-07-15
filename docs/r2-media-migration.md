# R2-mediamigratie

## Waarom deze opzet

Supabase Storage gebruikt weinig opslag, maar leverde grote originele galerijbestanden herhaaldelijk uit. In de gemeten periode was Cached Egress 6,345 GB van 5 GB, terwijl Storage ongeveer 152 MB en de database ongeveer 28 MB gebruikten.

Openbare portfolio- en websitebeelden worden al als geoptimaliseerde WebP-bestanden via GitHub en Netlify gepubliceerd. Dat pad blijft behouden: het is publiek, snel en veroorzaakt geen Supabase Storage-egress. Prive-klantgalerijen krijgen optioneel R2-opslag met kort geldige downloadlinks.

## Beveiliging

- De R2-bucket blijft prive. Schakel geen publieke bucket-URL in voor klantgalerijen.
- Uploads worden alleen voorbereid na controle van een ingelogde `admin_profiles`-gebruiker.
- De browser krijgt uitsluitend een tien minuten geldige upload-URL.
- De Netlify Function controleert type en grootte, verwijdert metadata door opnieuw naar WebP te encoderen en maakt 480, 960 en 1600 pixels brede varianten.
- Een klantfoto wordt alleen via `/api/gallery-media` geopend na controle van de lange galerijtoken, publicatiestatus en vervaldatum.
- Bestaande Supabase-objecten worden tijdens deze fase niet verwijderd.

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
CLIENT_GALLERY_STORAGE_PROVIDER=supabase
```

Gebruik geen `VITE_`-prefix. Zet de provider pas in een Deploy Preview op `r2` nadat `supabase/r2-gallery-storage-migration.sql` is uitgevoerd. Productie blijft `supabase` tot de volledige previewtest is goedgekeurd.

## Testvolgorde

1. Voer `supabase/r2-gallery-storage-migration.sql` uit.
2. Configureer de R2-variabelen alleen voor een Netlify Deploy Preview.
3. Zet in de preview `CLIENT_GALLERY_STORAGE_PROVIDER=r2`.
4. Upload een nieuwe testfoto via desktop-admin en via de iPhone-PWA.
5. Controleer in R2 de mappen `galleries/<gallery-id>/...` en de drie WebP-formaten.
6. Open de klantgalerij, thumbnail, normale foto en lightbox.
7. Controleer in DevTools dat de foto via `/api/gallery-media` naar R2 gaat en niet via `supabase.co/storage/v1`.
8. Controleer een bestaande Supabase-galerij; die moet ongewijzigd blijven werken.
9. Pas na schriftelijke goedkeuring kan een aparte migratie van bestaande objecten worden uitgevoerd.

## Terugval

Zet `CLIENT_GALLERY_STORAGE_PROVIDER` terug op `supabase`. Nieuwe uploads gebruiken dan direct weer het bestaande Supabase-pad; bestaande R2-records blijven leesbaar zolang de R2-variabelen aanwezig zijn.
