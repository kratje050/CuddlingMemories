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
('over-demy', 'Over Demy', 'Foto''s die later steeds meer gaan betekenen',
  E'Demy legt echte, liefdevolle en pure momenten vast. Ze fotografeert gezinnen, moeders, kinderen, newborns en bijzondere mijlpalen in een warme, zachte en tijdloze stijl.\n\nHaar aandacht gaat uit naar kleine details, warme blikken en momenten die vaak voorbij lijken te vliegen. Juist die beelden worden later steeds waardevoller.\n\nVoor de camera mag alles rustig en natuurlijk voelen. Er is ruimte om te wennen, te lachen, te knuffelen en gewoon jezelf te zijn, zonder dat het geforceerd wordt.',
  'Over Demy',
  'Maak kennis met Demy van Cuddling Memories Fotografie: warme, zachte en tijdloze fotografie voor gezinnen, moeders, kinderen en newborns.',
  true),
('werkwijze', 'Werkwijze', 'Van aanvraag tot jouw favoriete beelden',
  'Een duidelijke route, met rust vooraf en ruimte tijdens de shoot.',
  'Werkwijze',
  'Lees hoe een fotoshoot bij Cuddling Memories verloopt, van aanvraag tot online galerij en favoriete beelden kiezen.',
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
-- page_sections — werkwijze-stappen (badge "Binnenkort beschikbaar" blijft in
-- de code gekoppeld aan section_key = 'step-5', niet aan een losse kolom)
-- ---------------------------------------------------------------------------
insert into page_sections (page_slug, section_key, title, content, sort_order, is_visible) values
('werkwijze', 'step-1', 'Aanvraag via het formulier', 'Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.', 1, true),
('werkwijze', 'step-2', 'Samen datum en soort shoot afstemmen', 'Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.', 2, true),
('werkwijze', 'step-3', 'Tips voor kleding en voorbereiding', 'Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.', 3, true),
('werkwijze', 'step-4', 'De fotoshoot', 'Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.', 4, true),
('werkwijze', 'step-5', 'Online galerij ontvangen', 'Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.', 5, true),
('werkwijze', 'step-6', 'Favoriete beelden kiezen', 'Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.', 6, true);

-- page_sections — model-gezocht (cta / kortingspercentage / categorieën)
insert into page_sections (page_slug, section_key, title, content, button_text, button_url, sort_order, is_visible) values
('model-gezocht', 'discount', 'Kortingspercentage', '50', null, null, 1, true),
('model-gezocht', 'categories', 'Categorieën', '["Cakesmash","Motherhood","Gezin","Portret","Newborn","Zwangerschap","Bevalling","Buiten shoots"]', null, null, 2, true),
('model-gezocht', 'cta', 'Call to action', null, 'Ik wil model staan', '/contact?shoot=Model%20staan%20met%2050%25%20korting', 3, true);

-- page_sections — privacybeleid (4 secties)
insert into page_sections (page_slug, section_key, title, content, sort_order, is_visible) values
('privacybeleid', 'gegevens', 'Welke gegevens',
  'Bij een boekingsaanvraag worden je naam, e-mailadres, gewenste shoot, gewenste periode, locatie en bericht verwerkt. Deze gegevens worden alleen gebruikt om je aanvraag te beantwoorden en een shoot met je in te plannen.',
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
('Newborn', 'newborn', 'Kleine details en rustige newbornmomenten.', 'Newborn', '/images/instagram/instagram-09.jpg', true, true, 2),
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
((select id from portfolio_albums where slug = 'gezin'), 'Zacht gezin', 'Rustige gezinsshoot met zachte kleuren', '/images/instagram/instagram-08.jpg', 'Gezin', false, 2),
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
('Reiskosten', 'reiskosten', 0.35, 'km', 'Anders', 'Per kilometer buiten de afgesproken omgeving', null, false, 7);

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
insert into testimonials (name, text, rating, sort_order) values
('Lisa', 'Demy stelt je meteen op je gemak en de foto''s zijn prachtig. We zijn zo blij met het resultaat.', 5, 1),
('Marloes', 'Een hele fijne ervaring en zulke mooie, warme foto''s. Echt een aanrader!', 5, 2),
('Kim', 'Onze newbornshoot was geweldig. Demy heeft zoveel geduld en liefde voor wat ze doet.', 5, 3);

-- ---------------------------------------------------------------------------
-- faq
-- ---------------------------------------------------------------------------
insert into faq (question, answer, sort_order) values
('Hoe boek ik een shoot?', 'Via het boekingsformulier laat je weten welke shoot je wilt. Daarna stemmen we samen een passende datum en de verdere details af.', 1),
('Wanneer ontvang ik mijn foto''s?', 'Na de shoot ontvang je een online galerij. De precieze levertijd hangt af van het seizoen en de gekozen shoot.', 2),
('Kan ik extra beelden bijkopen?', 'Ja, extra beelden kun je per stuk bijbestellen vanuit de online galerij.', 3),
('Waar vindt de shoot plaats?', 'Dat kan buiten, bij passend licht, of op een plek die bij het soort shoot past. Dit stemmen we vooraf rustig af.', 4),
('Wat trek ik aan tijdens de shoot?', 'Zachte tinten, rustige stoffen en kleding zonder drukke prints werken vaak heel mooi. Je krijgt vooraf tips voor de voorbereiding.', 5),
('Kan ik model staan met korting?', 'Ja, voor portfolio-uitbreiding zijn er regelmatig modelplekken met 50% korting.', 6),
('Hoe werkt de online galerij?', 'Je bekijkt de beelden online en kiest daar jouw favorieten. Daarna worden de gekozen foto''s zorgvuldig afgewerkt.', 7);

-- ---------------------------------------------------------------------------
-- admin_profiles: bewust leeg. Voeg je eerste admin toe via Supabase Auth +
-- een insert hier (zie README, sectie "Admin-gebruiker toevoegen").
-- ---------------------------------------------------------------------------
