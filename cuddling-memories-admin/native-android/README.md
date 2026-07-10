# Cuddling Memories Admin Native Android

Echte native Android app voor het Cuddling Memories boekingsysteem.

Deze app gebruikt:

- Kotlin
- Jetpack Compose
- MVVM-structuur
- Supabase Auth + PostgREST
- Firebase Cloud Messaging placeholders
- Handmatige APK-installatie

Geen Expo, geen React Native, geen PWA en geen WebView-wrapper.

## Status

MVP basis staat klaar:

- Admin login via Supabase Auth
- Admin-check via `admin_profiles`
- Dashboard basis
- Boekingen lezen en zoeken
- Boeking detail openen
- Status aanpassen
- Interne notitie toevoegen
- Push-token registreren in `push_tokens`
- Tabs: Dashboard, Kalender, Boekingen, Meldingen, Meer
- Placeholders voor de rest van het complete boekingsysteem

## Project openen

Open deze map in Android Studio:

```text
C:\Users\stava\Documents\Cuddling memories\cuddling-memories-admin\native-android
```

Android Studio downloadt zelf Gradle en Android dependencies.

## Supabase config

Maak een bestand:

```text
native-android/local.properties
```

Met:

```properties
SUPABASE_URL=https://jzmddavtmwdhriwwerux.supabase.co
SUPABASE_ANON_KEY=VUL_HIER_DE_ANON_KEY_IN
```

Gebruik de anon key, niet de service role key.

## Firebase push

Voor echte pushmeldingen:

1. Maak een Firebase project.
2. Voeg Android app toe met package:

```text
nl.cuddlingmemories.admin
```

3. Download `google-services.json`.
4. Zet dit bestand in:

```text
native-android/app/google-services.json
```

5. Voeg daarna de Google Services plugin toe in Gradle wanneer Firebase echt gekoppeld is.

De app registreert alvast FCM tokens in Supabase. Het server-side verzenden moet via een Netlify Function of Supabase Edge Function, omdat Firebase server credentials nooit in de app mogen staan.

## Supabase SQL

Voer nu uit (dekt korting-velden op boekingen + repareert/vult `notifications`/`push_tokens` aan, ongeacht of `admin_app_phase1.sql` of `native_android_push.sql` al eens gedraaid is — alles is idempotent):

```text
cuddling-memories-admin/supabase/android-app-migration.sql
```

Dit bestand zet ook meteen de complete pushmeldingen-pijplijn op (Postgres-trigger + `pg_net` → `netlify/functions/send-push-notification.ts` in het hoofdproject). Onderaan dat bestand staat één losse `select vault.create_secret(...)`-regel die je met je **eigen** geheime waarde moet draaien — zet diezelfde waarde ook als `INTERNAL_WEBHOOK_SECRET` in de Netlify-omgevingsvariabelen van het hoofdproject (zie de hoofd-README, sectie "Pushmeldingen").

Zonder deze migratie registreert de app wel push-tokens, maar verstuurt er nooit echt een melding — dat serverstukje bestond nog niet.

## APK bouwen

In Android Studio:

1. Open `native-android`.
2. Wacht tot Gradle klaar is.
3. Kies bovenin `app`.
4. Ga naar `Build`.
5. Kies `Build Bundle(s) / APK(s)`.
6. Kies `Build APK(s)`.

De APK staat daarna meestal hier:

```text
native-android/app/build/outputs/apk/debug/app-debug.apk
```

Die APK kun je handmatig op je Android telefoon installeren.

## Volgende modules

De basis is bewust modulair opgezet. De volgende schermen kunnen nu per module worden ingevuld:

- Beschikbaarheid
- Maandplanning
- Tijdslots
- Pakketten
- Portfolio
- Klantgalerijen
- Reviews
- FAQ
- Model gezocht
- Cadeaubonnen
- Mini-shoots
- Wachtlijst
- Instellingen

## Belangrijk

- Zet nooit SMTP wachtwoorden, Firebase server keys of Supabase service role keys in de app.
- Alles wat admin-only is moet door Supabase RLS beschermd blijven.
- Server-acties zoals e-mail verzenden en pushmeldingen versturen horen in Netlify Functions of Supabase Edge Functions.
