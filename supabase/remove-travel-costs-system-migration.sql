-- Reiskosten worden niet meer apart berekend. De bestaande kolommen en
-- historische waarden blijven bewust staan om oude boekingen niet te wijzigen.

update public.packages
set is_published = false,
    updated_at = now()
where lower(coalesce(slug, '')) = 'reiskosten'
   or lower(coalesce(title, '')) = 'reiskosten'
   or price_unit = 'km';

-- Deze instellingen worden nergens meer gebruikt. Historische bedragen op
-- bestaande boekingen blijven wel bewaard.
drop table if exists public.travel_settings;

update public.faq
set question = 'Is een shoot op locatie bij de pakketprijs inbegrepen?',
    answer = 'Ja. Een afspraak op locatie is inbegrepen in de pakketprijs; er worden hiervoor geen losse kosten toegevoegd.',
    category = 'Locatie',
    is_visible = true,
    updated_at = now()
where lower(question) like '%reiskosten%';

update public.faq
set answer = 'Per pakket staat vermeld hoeveel digitale beelden zijn inbegrepen en wat de vanaf-prijs is. Extra beelden komen er alleen bij als je na de shoot zelf meer foto''s kiest dan in het pakket zijn inbegrepen.',
    updated_at = now()
where lower(question) = 'wat zit er in een pakket?';
