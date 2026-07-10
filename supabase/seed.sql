-- Cuddling Memories Fotografie — seed data
-- Voer dit uit ná schema.sql en policies.sql. Bevat de content die op dit
-- moment al live staat (uit src/data/*.js en de statische pagina's), zodat
-- de site na de Supabase-koppeling er precies zo uitziet als nu.
-- Bestaande foto's blijven verwijzen naar /images/instagram/*.jpg (al live
-- op Netlify); nieuwe foto's die je via de admin uploadt komen in de
-- Supabase Storage-bucket 'portfolio' met een eigen publieke URL.

-- ---------------------------------------------------------------------------
-- site_settings (1 rij)
-- ---------------------------------------------------------------------------
insert into site_settings (
  site_name, logo_text, subtitle, primary_email, instagram_url, facebook_url,
  hero_title, hero_subtitle, footer_text, default_seo_title, default_seo_description
) values (
  'Cuddling Memories Fotografie',
  'Cuddling Memories',
  'Fotografie',
  'ddytuber@gmail.com',
  'https://www.instagram.com/cuddlingmemories/',
  'https://www.facebook.com/profile.php?id=61590264604841',
  'Voor herinneringen die blijven',
  'Liefdevolle fotografie',
  'Liefdevolle, pure en tijdloze fotografie voor momenten die steeds waardevoller worden.',
  'Cuddling Memories Fotografie',
  'Cuddling Memories Fotografie voor zwangerschap, newborn, gezin, portret, cakesmash, motherhood en buiten fotoshoots in Groningen, Friesland en Zoutkamp.'
);

-- ---------------------------------------------------------------------------
-- pages
-- ---------------------------------------------------------------------------
insert into pages (slug, title, subtitle, content, meta_title, meta_description, is_published) values
('home', 'Home', 'Liefdevolle fotografie', null,
  'Cuddling Memories Fotografie',
  'Liefdevolle fotografie voor zwangerschap, newborn, gezin, portret, cakesmash en motherhood in Groningen, Friesland en Zoutkamp.',
  true),
('over-demy', 'Over mij', 'Foto''s die later steeds meer gaan betekenen',
  E'Ik leg echte, liefdevolle en pure momenten vast. Ik fotografeer gezinnen, moeders, kinderen, newborns en bijzondere mijlpalen in een warme, zachte en tijdloze stijl.\n\nMijn aandacht gaat uit naar kleine details, warme blikken en momenten die vaak voorbij lijken te vliegen. Juist die beelden worden later steeds waardevoller.\n\nVoor de camera mag alles natuurlijk voelen. Er is ruimte om te wennen, te lachen, te knuffelen en gewoon jezelf te zijn, zonder dat het geforceerd wordt.',
  'Over mij',
  'Maak kennis met mijn warme, zachte en tijdloze fotografiestijl voor gezinnen, moeders, kinderen en newborns.',
  true),
('werkwijze', 'Werkwijze', 'Zo werkt boeken bij Cuddling Memories',
  'Je kiest online je shoot, maand, datum en tijd. Daarna bevestig ik de aanvraag en volgt alles stap voor stap.',
  'Werkwijze',
  'Lees hoe boeken bij Cuddling Memories werkt: shoot kiezen, datum en tijd aanvragen, bevestiging en online galerij.',
  true),
('model-gezocht', 'Model gezocht', 'Portfolio-oproep',
  'Voor het uitbreiden van mijn portfolio ben ik regelmatig op zoek naar modellen. Je mag dan met 50% korting bij mij komen shooten.',
  'Model gezocht',
  'Model gezocht voor portfolio-uitbreiding bij Cuddling Memories Fotografie met 50% korting op geselecteerde shoots.',
  true),
('privacybeleid', 'Privacybeleid', null,
  'Cuddling Memories Fotografie gaat zorgvuldig om met de persoonsgegevens die je via het boekingsformulier deelt. Hieronder lees je welke gegevens worden verwerkt, waarom, en hoe lang ze worden bewaard.',
  'Privacybeleid',
  'Lees hoe Cuddling Memories Fotografie omgaat met jouw persoonsgegevens bij een boekingsaanvraag.',
  true),
('portfolio', 'Portfolio', null, null,
  'Portfolio',
  'Bekijk het portfolio van Cuddling Memories met zwangerschap, newborn, cakesmash, gezin, portret, motherhood en buiten fotoshoots.',
  true),
('pakketten', 'Pakketten', null, null,
  'Pakketten',
  'Bekijk de pakketten en prijzen voor portret, cakesmash, zwangerschap, gezin en newborn fotografie bij Cuddling Memories.',
  true),
('contact', 'Contact en boeken', null, null,
  'Contact en boeken',
  'Boek een fotoshoot bij Cuddling Memories via het formulier voor zwangerschap, newborn, cakesmash, gezin, portret, motherhood en buiten fotografie.',
  true);

-- ---------------------------------------------------------------------------
-- page_sections — actuele werkwijze-stappen
-- ---------------------------------------------------------------------------
insert into page_sections (page_slug, section_key, title, content, sort_order, is_visible) values
('werkwijze', 'step-1', 'Kies je shoot', 'Op de contactpagina kies je eerst het soort shoot. Zo kan de kalender meteen de juiste duur en beschikbaarheid gebruiken.', 1, true),
('werkwijze', 'step-2', 'Kies pakket, maand en datum', 'Daarna kies je eventueel een passend pakket. Kom je vanuit het maandoverzicht, dan opent de kalender direct in die maand.', 2, true),
('werkwijze', 'step-3', 'Kies een vrij tijdslot', 'Je ziet alleen beschikbare tijden. Een aanvraag is nog geen definitieve boeking; ik bevestig het moment persoonlijk.', 3, true),
('werkwijze', 'step-4', 'Vul je gegevens in', 'Je vult je naam, e-mailadres en eventueel je telefoonnummer in. Daarna kies je de locatie en kun je een optioneel bericht toevoegen.', 4, true),
('werkwijze', 'step-5', 'De fotoshoot', 'Na bevestiging stemmen we de laatste details af. Tijdens de shoot is er ruimte en aandacht voor echte momenten.', 5, true),
('werkwijze', 'step-6', 'Online galerij en favorieten', 'Na de shoot ontvang je een beveiligde online galerij. Daar kies je jouw favoriete beelden en kun je extra beelden aanvragen.', 6, true);

-- page_sections — model-gezocht (cta / kortingspercentage / categorieën)
insert into page_sections (page_slug, section_key, title, content, button_text, button_url, sort_order, is_visible) values
('model-gezocht', 'discount', 'Kortingspercentage', '50', null, null, 1, true),
('model-gezocht', 'categories', 'Categorieën', '["Cakesmash","Motherhood","Gezin","Portret","Newborn","Zwangerschap","Bevalling","Buiten shoots"]', null, null, 2, true),
('model-gezocht', 'cta', 'Call to action', null, 'Ik wil model staan', '/contact?shoot=Model%20staan%20met%2050%25%20korting', 3, true);

-- page_sections — privacybeleid (4 secties)
insert into page_sections (page_slug, section_key, title, content, sort_order, is_visible) values
('privacybeleid', 'gegevens', 'Welke gegevens',
  'Bij een boekingsaanvraag worden je naam, e-mailadres, eventueel telefoonnummer, gewenste shoot, gewenste periode, locatie en bericht verwerkt. Deze gegevens worden alleen gebruikt om je aanvraag te beantwoorden en een shoot met je in te plannen.',
  1, true),
('privacybeleid', 'bewaartermijn', 'Bewaartermijn',
  'Gegevens worden niet langer bewaard dan nodig is om je aanvraag af te handelen en, bij een geboekte shoot, de administratie rondom die boeking af te ronden.',
  2, true),
('privacybeleid', 'delen', 'Delen met derden',
  'Je gegevens worden niet verkocht of gedeeld met derden voor marketingdoeleinden. Ze worden uitsluitend gebruikt voor het verzenden van de boekingsaanvraag naar Cuddling Memories Fotografie.',
  3, true),
('privacybeleid', 'rechten', 'Jouw rechten',
  'Je hebt het recht om inzage, correctie of verwijdering van je gegevens te vragen. Neem hiervoor contact op via het contactformulier.',
  4, true);

-- ---------------------------------------------------------------------------
-- portfolio_albums (1 per categorie) + portfolio_photos
-- ---------------------------------------------------------------------------
insert into portfolio_albums (title, slug, description, category, cover_image_url, is_featured, is_published, sort_order) values
('Zwangerschap', 'zwangerschap', 'Zachte, tijdloze zwangerschapsfotografie.', 'Zwangerschap', '/images/instagram/instagram-07.jpg', true, true, 1),
('Newborn', 'newborn', 'Kleine details en zachte newbornmomenten.', 'Newborn', '/images/instagram/instagram-09.jpg', true, true, 2),
('Gezin', 'gezin', 'Warme gezinsmomenten, thuis of buiten.', 'Gezin', '/images/instagram/instagram-01.jpg', true, true, 3),
('Cakesmash', 'cakesmash', 'Vrolijke eerste-verjaardag cakesmash-shoots.', 'Cakesmash', '/images/instagram/instagram-02.jpg', true, true, 4),
('Portret', 'portret', 'Tijdloze portretten met oog voor detail.', 'Portret', '/images/instagram/instagram-06.jpg', true, true, 5),
('Motherhood', 'motherhood', 'De band tussen moeder en kind vastgelegd.', 'Motherhood', '/images/instagram/instagram-12.jpg', true, true, 6),
('Buiten shoots', 'buiten-shoots', 'Natuurlijk licht en buitenlocaties.', 'Buiten shoots', '/images/instagram/instagram-11.jpg', true, true, 7);

insert into portfolio_photos (album_id, title, alt_text, image_url, category, is_featured, sort_order) values
((select id from portfolio_albums where slug = 'zwangerschap'), 'Zachte verwachting', 'Zachte zwangerschapsfotografie in warm licht', '/images/instagram/instagram-07.jpg', 'Zwangerschap', true, 1),
((select id from portfolio_albums where slug = 'zwangerschap'), 'Gouden uur', 'Zwangerschapsshoot tijdens het gouden uur', '/images/instagram/instagram-07.jpg', 'Zwangerschap', false, 2),
((select id from portfolio_albums where slug = 'newborn'), 'Kleine details', 'Close-up van newborn handjes en voetjes', '/images/instagram/instagram-09.jpg', 'Newborn', true, 1),
((select id from portfolio_albums where slug = 'gezin'), 'Samen thuis', 'Gezinsfoto in een warme thuisomgeving', '/images/instagram/instagram-01.jpg', 'Gezin', true, 1),
((select id from portfolio_albums where slug = 'gezin'), 'Zacht gezin', 'Gezinsshoot met zachte kleuren', '/images/instagram/instagram-08.jpg', 'Gezin', false, 2),
((select id from portfolio_albums where slug = 'cakesmash'), 'Eerste taartje', 'Vrolijke cakesmash-fotoshoot', '/images/instagram/instagram-02.jpg', 'Cakesmash', true, 1),
((select id from portfolio_albums where slug = 'cakesmash'), 'Lieve mijlpaal', 'Cakesmash-shoot voor de eerste verjaardag', '/images/instagram/instagram-10.jpg', 'Cakesmash', false, 2),
((select id from portfolio_albums where slug = 'portret'), 'Warme blik', 'Tijdloos portret met warme uitstraling', '/images/instagram/instagram-06.jpg', 'Portret', true, 1),
((select id from portfolio_albums where slug = 'portret'), 'Kleine lach', 'Speels portret met een lach', '/images/instagram/instagram-04.jpg', 'Portret', false, 2),
((select id from portfolio_albums where slug = 'motherhood'), 'Moederliefde', 'Motherhood-shoot vol liefde en verbinding', '/images/instagram/instagram-12.jpg', 'Motherhood', true, 1),
((select id from portfolio_albums where slug = 'motherhood'), 'Tijdloos detail', 'Zacht detail uit een motherhood-shoot', '/images/instagram/instagram-05.jpg', 'Motherhood', false, 2),
((select id from portfolio_albums where slug = 'buiten-shoots'), 'Buitenlicht', 'Buiten fotoshoot met natuurlijk licht', '/images/instagram/instagram-11.jpg', 'Buiten shoots', true, 1);

-- ---------------------------------------------------------------------------
-- packages
-- ---------------------------------------------------------------------------
insert into packages (title, slug, price, price_unit, shoot_type, description, included_images, is_featured, sort_order) values
('Portretshoot', 'portretshoot', 80.00, 'shoot', 'Portretshoot', 'Inclusief 3 digitale beelden', 3, false, 1),
('Cakesmash', 'cakesmash', 150.00, 'shoot', 'Cakesmash', 'Inclusief 7 digitale beelden + taart', 7, true, 2),
('Zwangerschapsshoot', 'zwangerschapsshoot', 200.00, 'shoot', 'Zwangerschapsshoot', 'Inclusief 7 digitale beelden', 7, false, 3),
('Gezinsshoot', 'gezinsshoot', 200.00, 'shoot', 'Gezinsshoot', 'Inclusief 7 digitale beelden', 7, false, 4),
('Newbornshoot', 'newbornshoot', 175.00, 'shoot', 'Newbornshoot', 'Inclusief 7 digitale beelden', 7, false, 5),
('Extra beeld', 'extra-beeld', 7.50, 'item', 'Anders', 'Per stuk bij te bestellen uit jouw online galerij', null, false, 6),
('Reiskosten', 'reiskosten', 0.35, 'km', 'Anders', 'Per kilometer, standaard als heen- en terugreis berekend vanaf mijn huis in Zoutkamp', null, false, 7);

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
insert into testimonials (name, text, rating, sort_order) values
('Lisa', 'Je voelt je meteen op je gemak en de foto''s zijn prachtig. We zijn zo blij met het resultaat.', 5, 1),
('Marloes', 'Een hele fijne ervaring en zulke mooie, warme foto''s. Echt een aanrader!', 5, 2),
('Kim', 'Onze newbornshoot was geweldig. Er was zoveel geduld en liefde voor wat ze doet.', 5, 3);

-- ---------------------------------------------------------------------------
-- faq
-- ---------------------------------------------------------------------------
insert into faq (question, answer, sort_order) values
('Hoe boek ik een shoot?', 'Via het boekingsformulier laat je weten welke shoot je wilt. Daarna stemmen we samen een passende datum en de verdere details af.', 1),
('Wanneer ontvang ik mijn foto''s?', 'Na de shoot ontvang je een online galerij. De precieze levertijd hangt af van het seizoen en de gekozen shoot.', 2),
('Kan ik extra beelden bijkopen?', 'Ja, extra beelden kun je per stuk bijbestellen vanuit de online galerij.', 3),
('Waar vindt de shoot plaats?', 'Dat kan buiten, bij passend licht, of op een plek die bij het soort shoot past. Dit stemmen we vooraf samen af.', 4),
('Wat trek ik aan tijdens de shoot?', 'Zachte tinten, fijne stoffen en kleding zonder drukke prints werken vaak heel mooi. Je krijgt vooraf tips voor de voorbereiding.', 5),
('Kan ik model staan met korting?', 'Ja, voor portfolio-uitbreiding zijn er regelmatig modelplekken met 50% korting.', 6),
('Hoe werkt de online galerij?', 'Je bekijkt de beelden online en kiest daar jouw favorieten. Daarna worden de gekozen foto''s zorgvuldig afgewerkt.', 7);

-- ---------------------------------------------------------------------------
-- availability_rules (7 rijen, day_of_week 0=zondag .. 6=zaterdag)
-- Standaard: di–za 09:00–17:00 met pauze 12:30–13:00, zo+ma dicht.
-- Direct aanpasbaar via /admin/beschikbaarheid na livegang.
-- ---------------------------------------------------------------------------
insert into availability_rules (day_of_week, start_time, end_time, break_start_time, break_end_time, is_available, max_bookings_per_day) values
(0, '09:00', '17:00', null, null, false, 3),
(1, '09:00', '17:00', null, null, false, 3),
(2, '09:00', '17:00', '12:30', '13:00', true, 3),
(3, '09:00', '17:00', '12:30', '13:00', true, 3),
(4, '09:00', '17:00', '12:30', '13:00', true, 3),
(5, '09:00', '17:00', '12:30', '13:00', true, 3),
(6, '09:00', '17:00', '12:30', '13:00', true, 3);

-- ---------------------------------------------------------------------------
-- shoot_type_settings (9 rijen, één per shootTypeOptions-waarde)
-- Duren zoals aangeleverd (Newborn 120, Cakesmash 90, Portret 45, Gezin 60,
-- Zwangerschap 60); overige shoot-types op een redelijke default van 60 min.
-- ---------------------------------------------------------------------------
insert into shoot_type_settings (shoot_type, duration_minutes, buffer_before_minutes, buffer_after_minutes, max_per_day, is_bookable, allowed_days) values
('Portretshoot', 45, 15, 15, 2, true, '{0,1,2,3,4,5,6}'),
('Cakesmash', 90, 15, 15, 2, true, '{0,1,2,3,4,5,6}'),
('Zwangerschapsshoot', 60, 15, 15, 2, true, '{0,1,2,3,4,5,6}'),
('Gezinsshoot', 60, 15, 15, 2, true, '{0,1,2,3,4,5,6}'),
('Newbornshoot', 120, 15, 15, 2, true, '{0,1,2,3,4,5,6}'),
('Motherhood', 60, 15, 15, 2, true, '{0,1,2,3,4,5,6}'),
('Buiten shoot', 60, 15, 15, 2, true, '{0,1,2,3,4,5,6}'),
('Model staan met 50% korting', 60, 15, 15, 2, true, '{0,1,2,3,4,5,6}'),
('Anders', 60, 15, 15, 2, true, '{0,1,2,3,4,5,6}');

-- ---------------------------------------------------------------------------
-- booking_settings (1 rij)
-- ---------------------------------------------------------------------------
insert into booking_settings (min_days_notice, max_months_ahead, default_buffer_minutes, default_duration_minutes, allow_same_day_booking, booking_mode) values
(2, 6, 15, 60, false, 'request_only');

-- ---------------------------------------------------------------------------
-- booking_display_settings (1 rij)
-- ---------------------------------------------------------------------------
insert into booking_display_settings (
  months_ahead_to_show, show_booking_counts_publicly, show_exact_available_slots_publicly,
  reserve_pending_bookings, almost_full_threshold_slots, almost_full_threshold_percentage, limited_threshold_percentage
) values (12, false, false, true, 3, 20, 50);

-- monthly_availability_settings: bewust leeg. Er komt alleen een rij zodra
-- een admin een maand handmatig sluit/overschrijft via /admin/maandplanning.

-- ---------------------------------------------------------------------------
-- admin_profiles: bewust leeg. Voeg je eerste admin toe via Supabase Auth +
-- een insert hier (zie README, sectie "Admin-gebruiker toevoegen").
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- E-mailtemplates voor automatische mails
-- ---------------------------------------------------------------------------
insert into email_templates (template_key, label, subject, body, is_active) values
('booking_received', 'Nieuwe aanvraag ontvangen', 'We hebben je aanvraag ontvangen', E'Hoi {{customer_name}},\n\nWat leuk dat je een aanvraag hebt gedaan voor {{shoot_type}}. Ik heb je gegevens ontvangen en kijk met liefde met je mee naar een passend moment.\n\nJe hoeft nu niets extra''s te doen. Ik neem snel contact met je op om de datum, locatie en eventuele wensen samen af te stemmen.{{giftcard_line}}', true),
('booking_confirmed', 'Boeking bevestigd', 'Je fotoshoot is bevestigd', E'Hoi {{customer_name}},\n\nJe {{shoot_type}} staat gepland op {{booking_date}} om {{booking_time}}. Fijn dat de afspraak vaststaat.\n\nAls er vooraf nog iets handig is om te weten, laat ik dat op tijd aan je weten. Ik kijk ernaar uit om jullie vast te leggen.', true),
('shoot_reminder', 'Reminder voor de shoot', 'Reminder voor je fotoshoot', E'Hoi {{customer_name}},\n\nNog even en dan is je {{shoot_type}}. Denk alvast aan kleding waarin jullie je fijn voelen en neem vooral genoeg tijd om ontspannen te starten.\n\nHeb je nog vragen of wil je iets doorgeven? Stuur gerust een berichtje.', true),
('preparation_tips', 'Voorbereidingstips per shoot type', 'Tips voor je {{shoot_type}}', E'Hoi {{customer_name}},\n\nVoor je {{shoot_type}} zijn zachte tinten, fijne stoffen en kleding zonder drukke prints vaak het mooist. Kies vooral iets waarin jullie jezelf herkennen.\n\nVoor kinderen helpt het om iets te drinken, een klein tussendoortje en eventueel een vertrouwd knuffeltje mee te nemen.', true),
('gallery_ready', 'Galerij is klaar', 'Je galerij staat klaar', E'Hoi {{customer_name}},\n\nJe galerij staat klaar. Via deze link kun je de beelden bekijken en je favorieten kiezen:\n{{gallery_link}}\n\nJe pakket bevat {{included_images}} beelden. Extra beelden kun je later los bijbestellen als je meer favorieten hebt.', true),
('gallery_selection_received', 'Galerijkeuze ontvangen klant', 'Je fotokeuze is ontvangen', E'Hoi {{customer_name}},\n\nDank je wel, je keuze uit de galerij is ontvangen.\n\nJe hebt {{selected_count}} beeld(en) gekozen. Je pakket bevat {{included_images}} beeld(en).{{extra_line}}\n\nIk ga met je selectie aan de slag. Als er extra beelden zijn gekozen, stem ik de betaling eerst nog met je af.', true),
('admin_gallery_selection_received', 'Galerijkeuze ontvangen admin', 'Nieuwe fotokeuze ontvangen: {{gallery_title}}', E'Er is een nieuwe fotokeuze ingestuurd.\n\nKlant: {{customer_name}}\nGalerij: {{gallery_title}}\nGekozen beelden: {{selected_count}}\nExtra beelden: {{extra_count}}\n\nGekozen foto''s:\n{{selected_photos}}\n\nOpen admin om de keuze te verwerken: {{admin_link}}', true),
('extra_images_selected', 'Extra beelden gekozen', 'Extra beelden gekozen', E'{{customer_name}} heeft {{extra_images}} extra beelden gekozen in de galerij:\n{{gallery_link}}', true),
('waitlist_confirmed', 'Wachtlijst bevestiging', 'Je staat op de wachtlijst', E'Hoi {{customer_name}},\n\nJe staat op de wachtlijst voor {{shoot_type}}. Als er een passende plek vrijkomt, neem ik contact met je op.\n\nDank je wel voor je geduld.', true),
('giftcard_received', 'Cadeaubon aanvraag ontvangen', 'Je cadeaubon aanvraag is ontvangen', E'Hoi {{customer_name}},\n\nDank je wel voor je cadeaubon aanvraag van {{giftcard_amount}}. Ik neem contact met je op om de gegevens, betaling en verzending netjes af te stemmen.\n\nJe kunt het bedrag alvast overmaken naar:\nR Stavasius\nNL25 RABO 0316 0597 49\nOnder vermelding van: cadeaubon + je naam\n\nZodra de betaling binnen is, ontvang je de unieke cadeaubon-code. Na bevestiging en betaling is de cadeaubon geldig.', true),
('mini_session_confirmed', 'Mini-shoot aanvraag ontvangen', 'Je mini-shoot aanvraag is ontvangen', E'Hoi {{customer_name}},\n\nJe aanvraag voor {{mini_session_title}} is ontvangen. Ik neem contact met je op voor de definitieve bevestiging en eventuele praktische informatie.\n\nLeuk dat je erbij wilt zijn.', true);

-- Voorbeeld mini-shoot dag, verborgen tot deze wordt gepubliceerd.
insert into mini_sessions (
  title, slug, description, date, location, price, included_images, duration_minutes,
  is_published, status, cover_image_url, terms
) values (
  'Lente mini-shoots',
  'lente-mini-shoots',
  'Korte warme mini-shoots met zachte styling en een duidelijke planning.',
  current_date + interval '45 days',
  'Omgeving Zoutkamp',
  75.00,
  5,
  20,
  false,
  'Concept',
  '/images/home-hero-cakesmash.png',
  'Een mini-shoot is definitief na bevestiging en betaling.'
);
