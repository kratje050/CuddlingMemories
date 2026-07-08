# Cuddling Memories Fotografie

Complete React, Vite en Tailwind CSS website voor Cuddling Memories Fotografie.

Live site: https://cuddling-memories-website.netlify.app

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

## Netlify instellingen

Gebruik deze instellingen:

- Branch: `main`
- Build command: `npm run build`
- Publish directory: `dist`

Dezelfde instellingen staan ook in `netlify.toml`.

## Foto's en teksten vervangen

- Portfolio en categoriebeelden: `src/data/portfolio.js`
- Pakketten en prijzen: `src/data/packages.js`
- Veelgestelde vragen: `src/data/faq.js`
- Testafbeeldingen: `public/images/test-*.svg`

Vervang de testafbeeldingen door echte foto's en pas de image-paden in `src/data/portfolio.js` aan.

## Netlify Forms

Het boekingsformulier staat op `/contact`. Voor Netlify Forms is er ook een verborgen detectieformulier toegevoegd in `public/__forms.html`. Laat de veldnamen in beide formulieren gelijk wanneer je later velden wijzigt.

## Gmail SMTP voor het contactformulier

Het formulier verstuurt via de Netlify Function `/api/send-booking`. Zet deze omgevingsvariabelen in Netlify bij Site configuration > Environment variables:

```txt
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=ddytuber@gmail.com
SMTP_PASS=je-gmail-app-wachtwoord
EMAIL_FROM=Cuddling Memories Fotografie <ddytuber@gmail.com>
ADMIN_NOTIFICATION_EMAIL=ddytuber@gmail.com
```

Zet `SMTP_PASS` nooit in GitHub. Gebruik hiervoor een Gmail app-wachtwoord.
