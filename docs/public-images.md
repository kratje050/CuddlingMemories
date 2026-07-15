# Openbare websiteafbeeldingen

Vaste openbare website- en portfolioafbeeldingen staan in `public/images` en worden samen met de website naar Netlify gedeployed. De gemigreerde beelden gebruiken WebP, meerdere breedtes en een contenthash in de bestandsnaam.

## Nieuwe lokale portfoliofoto toevoegen

1. Exporteer de foto zonder GPS- of overige EXIF-gegevens als WebP met ongeveer kwaliteit 80.
2. Maak bij voorkeur varianten van 480, 960 en 1600 pixels breed. Gebruik maximaal 2000-2400 pixels voor een grote hero.
3. Plaats de bestanden in een passende map onder `public/images/portfolio`.
4. Voeg de grootste lokale URL, bijvoorbeeld `/images/portfolio/gezin/gezin-abc123-1600.webp`, toe aan `portfolio_photos.image_url`.
5. Voeg de varianten en afmetingen toe aan `src/data/localPublicImages.js` voor `srcset`, `sizes`, `width` en `height`.
6. Commit de bestanden en voer een nieuwe Netlify-deploy uit.

Nieuwe openbare portfolio- en vaste websiteafbeeldingen worden vanuit het adminpaneel via een beveiligde Netlify Function verwerkt en in GitHub geplaatst. GitHub start vervolgens de Netlify-deploy. Het databasepad wordt pas aangepast nadat alle varianten daadwerkelijk via de ingestelde website-URL bereikbaar zijn.

Zie `docs/github-public-image-publishing.md` voor configuratie, foutafhandeling en de tijdelijke Supabase-fallback.

## Wat in Supabase Storage blijft

- Beveiligde klantgalerijen in de bucket `client-galleries`.
- De oude openbare uploadcode als uitgeschakelde noodfallback totdat de nieuwe route in productie is bewezen.
- De oude bronbestanden van deze migratie als tijdelijke back-up; de migratie verwijdert niets.
