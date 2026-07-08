# Cuddling Memories Fotografie

Complete React, Vite en Tailwind CSS website voor Cuddling Memories Fotografie.

## Lokaal starten

```bash
npm install
npm run dev
```

Open daarna de lokale Vite-link die in de terminal verschijnt.

## Build maken

```bash
npm run build
```

De productieversie komt in de map `dist`.

## Naar GitHub zetten

Aanbevolen repositorynaam: `cuddling-memories-website`.

```bash
git init
git add .
git commit -m "Initial Cuddling Memories website"
git branch -M main
git remote add origin https://github.com/jouw-gebruiker/cuddling-memories-website.git
git push -u origin main
```

## GitHub koppelen aan Netlify

1. Log in bij Netlify.
2. Kies `Add new site` en daarna `Import an existing project`.
3. Selecteer GitHub en kies de repository `cuddling-memories-website`.
4. Gebruik deze instellingen:
   - Branch: `main`
   - Build command: `npm run build`
   - Publish directory: `dist`

Dezelfde instellingen staan ook in `netlify.toml`.

## Foto's en teksten vervangen

Sinds de Supabase-koppeling (zie hieronder) beheer je portfolio, pakketten, FAQ, reviews en teksten via het admin-dashboard op `/admin`. De bestanden in `src/data/*.js` zijn de oorspronkelijke seed-content en worden niet meer live gebruikt zodra Supabase is aangesloten.

## Netlify Forms

Het boekingsformulier staat op `/contact`. Voor Netlify Forms is er ook een verborgen detectieformulier toegevoegd in `public/__forms.html`. Laat de veldnamen in beide formulieren gelijk wanneer je later velden wijzigt.

## Gmail SMTP voor het contactformulier

Het formulier verstuurt via de Netlify Function `/api/create-booking` (die de boeking zowel in Supabase opslaat als deze e-mail verstuurt). Zet deze omgevingsvariabelen in Netlify bij Site configuration > Environment variables:

```txt
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=ddytuber@gmail.com
SMTP_PASS=je-gmail-app-wachtwoord
EMAIL_FROM=Cuddling Memories Fotografie <ddytuber@gmail.com>
ADMIN_NOTIFICATION_EMAIL=ddytuber@gmail.com
```

Zet `SMTP_PASS` nooit in GitHub. Gebruik hiervoor een Gmail app-wachtwoord.

## Supabase instellen (admin-dashboard)

De website heeft een beveiligd admin-gedeelte op `/admin` waarmee je vrijwel alle content (teksten, portfolio, pakketten, FAQ, reviews, model-gezocht) en boekingen beheert zonder code aan te raken. Dat draait op [Supabase](https://supabase.com) (database, login, foto-opslag). Doorloop deze stappen éénmalig:

### 1. Supabase-project aanmaken

Maak op [supabase.com](https://supabase.com) een nieuw project aan (kies een regio dicht bij je bezoekers, bv. Frankfurt/West-Europa). Noteer na het aanmaken bij **Project settings > API**:
- **Project URL**
- **anon public key**
- **service_role key** (geheim, nooit delen of committen)

### 2. SQL-schema uitvoeren

Ga naar **SQL Editor** in het Supabase-dashboard en voer, in deze volgorde, de inhoud uit van:
1. `supabase/schema.sql` — alle tabellen, triggers en de storage-bucket.
2. `supabase/policies.sql` — Row Level Security (wie mag wat lezen/schrijven).
3. `supabase/seed.sql` — vult de tabellen met de content die nu al op de site staat.

### 3. Storage-bucket controleren

`schema.sql` maakt zelf al een publieke bucket genaamd `portfolio` aan (voor door de admin geüploade foto's). Controleer dit bij **Storage** in het Supabase-dashboard — er hoeft niets handmatig te worden aangemaakt.

### 4. Row Level Security controleren

Na stap 2 staat RLS al aan op alle tabellen (zie `supabase/policies.sql`): bezoekers kunnen alleen gepubliceerde content lezen en zelf een boeking aanmaken; alleen ingelogde admins kunnen content beheren en boekingen inzien. Niets extra te doen, tenzij je de policies later wilt aanpassen.

### 5. Admin-gebruiker aanmaken

Er is bewust geen openbare registratie. Voeg jezelf zo toe:
1. **Authentication > Users > Add user** in Supabase — vul je e-mail en een wachtwoord in.
2. Kopieer de **User UID** van die nieuwe gebruiker.
3. Voer in de SQL Editor uit (vervang de waarden):
   ```sql
   insert into admin_profiles (user_id, email, name)
   values ('geplakte-user-uid', 'jouw@email.nl', 'Demy');
   ```
4. Log in op `https://jouw-site.nl/admin/login` met dat e-mailadres en wachtwoord.

### 6. Environment variables instellen

**Lokaal:** kopieer `.env.example` naar `.env` en vul de Project URL en anon key in (het `.env`-bestand wordt genegeerd door git).

**Netlify** (Site configuration > Environment variables):
```txt
VITE_SUPABASE_URL=https://jouw-project.supabase.co
VITE_SUPABASE_ANON_KEY=jouw-anon-key
SUPABASE_SERVICE_ROLE_KEY=jouw-service-role-key
```
`SUPABASE_SERVICE_ROLE_KEY` wordt uitsluitend gebruikt in `netlify/functions/create-booking.ts` (server-side) — nooit in frontend-code of met een `VITE_`-prefix.

### 7. Lokaal testen

```bash
npm install
npm run dev
```
Test het boekingsformulier op `/contact` en log in op `/admin/login`.

### 8. Build testen

```bash
npm run build
```

### 9. Deployen via GitHub en Netlify

Commit en push naar `main` zoals gebruikelijk; Netlify bouwt automatisch met de environment variables uit stap 6.

### 10. Foto's toevoegen via admin

Log in op `/admin/portfolio` (en `/admin/albums`), maak een album aan of kies een bestaand album, upload foto's (alt-tekst is verplicht voor SEO) en markeer eventueel als uitgelicht.

### 11. Boekingen beheren via admin

Nieuwe boekingsaanvragen verschijnen direct in `/admin/bookings`. Open een boeking om de status te wijzigen, een interne notitie toe te voegen, de klant te mailen, te archiveren of te verwijderen. De statusgeschiedenis wordt automatisch bijgehouden.
