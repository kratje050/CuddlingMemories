# Cuddling Memories Admin Apps

Deze map bevat de nieuwe admin-oplossing in fases.

- `android-app/`: echte native Android app met Expo React Native, geen WebView.
- `iphone-pwa/`: aparte installbare iPhone PWA admin-app, bereikbaar met base path `/admin-app`.
- `shared/`: gedeelde Supabase helpers, types, statuslijsten en admin queries.
- `supabase/`: extra SQL voor app-meldingen en devices.

De publieke fotografie-website blijft apart staan in de root van het project.

## Fase 1 Status

Gebouwd:

- Gedeelde Supabase setup
- Admin role check via `admin_profiles`
- Android Expo basis
- iPhone PWA basis
- Login
- Dashboard
- Boekingenlijst
- Boeking detail
- Status aanpassen
- Interne notitie toevoegen
- PWA manifest
- Service worker met offline fallback
- iPhone installatiepagina op `/admin-app/install`

Nog voor volgende fases:

- Kalender/beschikbaarheid/maandplanning volledig bedienen
- Pushmeldingen
- Meldingenoverzicht koppelen
- Wachtlijst, cadeaubonnen, mini-shoots, galerijen en klanten volledig mobiel beheren
- EAS project-id en echte app icons/splash afronden

## Backend

Beide apps gebruiken dezelfde bestaande Supabase database:

- `bookings`
- `booking_notes`
- `booking_status_history`
- `admin_profiles`
- bestaande tabellen voor pakketten, galerijen, mini-shoots, wachtlijst en cadeaubonnen

Voer extra tabellen uit via:

```sql
-- Supabase SQL Editor
-- Eerst bestaande schema.sql en policies.sql uitvoeren
-- Daarna:
-- cuddling-memories-admin/supabase/admin_app_phase1.sql
```

Nieuwe tabellen:

- `notifications`
- `push_tokens`
- `web_push_subscriptions`
- `admin_device_sessions`

Service role keys blijven alleen server-side. De Android app en PWA gebruiken alleen anon key + RLS/admin policies.

## Android App

Map:

```powershell
cd "C:\Users\stava\Documents\Cuddling memories\cuddling-memories-admin\android-app"
```

Environment:

```powershell
copy .env.example .env
```

Vul:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_APP_NAME=Cuddling Memories Admin
```

Installeren/starten:

```powershell
npm install
npx expo start
```

APK bouwen:

```powershell
eas build --platform android --profile preview
```

Het preview-profiel in `eas.json` bouwt een APK.

### Android updates zonder APK opnieuw installeren

De Android app gebruikt Expo Updates. Dat betekent:

- De eerste keer installeer je de APK handmatig.
- Daarna kunnen normale app-aanpassingen automatisch binnenkomen via OTA updates.
- De app checkt bij openen en bij terugkeren naar de app automatisch op updates.
- Als er een update klaarstaat, haalt de app die op en herstart hij zichzelf.

Een update publiceren zonder nieuwe APK:

```powershell
cd "C:\Users\stava\Documents\Cuddling memories\cuddling-memories-admin\android-app"
npx eas-cli update --branch preview --message "Korte omschrijving van de update"
```

Alleen bij native wijzigingen moet je nog een nieuwe APK bouwen. Voorbeelden:

- Nieuwe native dependency
- Nieuwe Android-permissie
- Nieuwe Expo plugin
- Wijziging van `android.package`
- Wijziging van `runtimeVersion` of app-versie

Voor gewone schermen, teksten, styling, Supabase queries en React Native code is meestal alleen `eas update` genoeg.

## iPhone PWA

Map:

```powershell
cd "C:\Users\stava\Documents\Cuddling memories\cuddling-memories-admin\iphone-pwa"
```

Environment:

```powershell
copy .env.example .env
```

Vul:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_VAPID_PUBLIC_KEY=
```

Lokaal starten:

```powershell
npm install
npm run dev
```

Build:

```powershell
npm run build
```

Installeren op iPhone:

1. Open `/admin-app/install` in Safari.
2. Tik op de deelknop.
3. Kies `Zet op beginscherm`.
4. Open `CM Admin` vanaf het beginscherm.
5. Log in als admin.

Push op iPhone PWA wordt in Fase 3 aangesloten. De PWA blijft ook zonder push bruikbaar.

## Netlify

De iPhone PWA heeft `base: "/admin-app/"`. Je kunt hem als aparte app builden en onder `/admin-app` publiceren, of later in de root build pipeline laten kopiëren naar `dist/admin-app`.

Server-side variabelen voor latere fases:

```env
SUPABASE_SERVICE_ROLE_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

## Controle Fase 1

Android:

- `npm install`
- `npx expo start`
- Login met Supabase Auth
- Dashboard laadt data
- Boekingen laden
- Status aanpassen werkt
- Interne notitie toevoegen werkt
- Geen WebView

iPhone PWA:

- `npm install`
- `npm run dev`
- `npm run build`
- Manifest bestaat
- Service worker bestaat
- `/admin-app/install` toont installatie-uitleg
- Login met Supabase Auth
- Dashboard laadt data
- Boekingen laden
- Status aanpassen werkt
