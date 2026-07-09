-- Cuddling Memories Fotografie — Supabase schema
-- Voer dit als eerste uit in de Supabase SQL Editor (Project > SQL Editor > New query).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Herbruikbare trigger die updated_at automatisch bijwerkt bij elke UPDATE.
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. site_settings — één rij met algemene website-instellingen.
-- ---------------------------------------------------------------------------
create table site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'Cuddling Memories Fotografie',
  logo_text text not null default 'Cuddling Memories',
  subtitle text not null default 'Fotografie',
  primary_email text,
  instagram_url text,
  facebook_url text,
  hero_title text,
  hero_subtitle text,
  footer_text text,
  default_seo_title text,
  default_seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_site_settings_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. pages — hoofdtekst + SEO per pagina (slug is de sleutel, bv. 'home').
-- ---------------------------------------------------------------------------
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text,
  subtitle text,
  content text,
  meta_title text,
  meta_description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_pages_updated_at
  before update on pages
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. page_sections — losse blokken binnen een pagina (bv. werkwijze-stappen).
-- ---------------------------------------------------------------------------
create table page_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null references pages(slug) on update cascade on delete cascade,
  section_key text not null,
  title text,
  subtitle text,
  content text,
  button_text text,
  button_url text,
  image_url text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_slug, section_key)
);

create trigger trg_page_sections_updated_at
  before update on page_sections
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. portfolio_albums
-- ---------------------------------------------------------------------------
create table portfolio_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  category text not null,
  cover_image_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_portfolio_albums_updated_at
  before update on portfolio_albums
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. portfolio_photos
-- ---------------------------------------------------------------------------
create table portfolio_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references portfolio_albums(id) on delete cascade,
  title text,
  alt_text text not null,
  image_url text not null,
  thumbnail_url text,
  category text,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_portfolio_photos_updated_at
  before update on portfolio_photos
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 6. packages
-- price_unit/shoot_type zijn toegevoegd t.o.v. de basislijst: nodig zodat de
-- prijscalculator en het boekingsformulier "Extra beeld"/"Reiskosten" (per
-- stuk/per km) kunnen onderscheiden van echte shoot-pakketten.
-- ---------------------------------------------------------------------------
create table packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  price numeric(10,2) not null,
  price_unit text not null default 'shoot' check (price_unit in ('shoot', 'item', 'km')),
  shoot_type text,
  description text,
  included_images int,
  extra_info text,
  button_text text not null default 'Boek dit pakket',
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_packages_updated_at
  before update on packages
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. bookings
-- is_important is toegevoegd t.o.v. de basislijst: nodig voor de expliciet
-- gevraagde "markeer als belangrijk"-functie in de boekingen-admin.
-- ---------------------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  shoot_type text not null,
  preferred_date date,
  preferred_period text,
  location text,
  message text,
  status text not null default 'Nieuw' check (status in (
    'Nieuw', 'Gelezen', 'Contact opgenomen', 'Wacht op reactie',
    'Datum ingepland', 'Aanbetaling gevraagd', 'Aanbetaling ontvangen',
    'Shoot geweest', 'Galerij verstuurd', 'Afgerond', 'Geannuleerd', 'Gearchiveerd'
  )),
  source text not null default 'website',
  budget numeric(10,2),
  package_id uuid references packages(id) on delete set null,
  model_discount boolean not null default false,
  privacy_accepted boolean not null default false,
  is_important boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

create index idx_bookings_status on bookings (status);
create index idx_bookings_created_at on bookings (created_at desc);

-- ---------------------------------------------------------------------------
-- 8. booking_notes
-- ---------------------------------------------------------------------------
create table booking_notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  note text not null,
  created_by text,
  created_at timestamptz not null default now()
);

create index idx_booking_notes_booking_id on booking_notes (booking_id);

-- ---------------------------------------------------------------------------
-- 9. booking_status_history
-- ---------------------------------------------------------------------------
create table booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by text,
  created_at timestamptz not null default now()
);

create index idx_booking_status_history_booking_id on booking_status_history (booking_id);

-- ---------------------------------------------------------------------------
-- 10. testimonials
-- ---------------------------------------------------------------------------
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text text not null,
  rating int not null default 5 check (rating between 1 and 5),
  shoot_type text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_testimonials_updated_at
  before update on testimonials
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 11. faq
-- ---------------------------------------------------------------------------
create table faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  is_visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_faq_updated_at
  before update on faq
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. admin_profiles — koppelt Supabase Auth-gebruikers aan adminrechten.
-- Er is bewust geen publieke registratie: rijen worden alleen handmatig
-- aangemaakt door de sitebeheerder (zie README, sectie "Admin-gebruiker
-- toevoegen").
-- ---------------------------------------------------------------------------
create table admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_admin_profiles_updated_at
  before update on admin_profiles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- View voor het dashboard-kaartje "laatste 5 aangepaste onderdelen".
-- ---------------------------------------------------------------------------
create view recent_content_changes as
  select id, 'pages'::text as table_name, coalesce(title, slug) as label, updated_at from pages
  union all
  select id, 'page_sections'::text, coalesce(title, section_key), updated_at from page_sections
  union all
  select id, 'portfolio_albums'::text, title, updated_at from portfolio_albums
  union all
  select id, 'packages'::text, title, updated_at from packages
  union all
  select id, 'testimonials'::text, name, updated_at from testimonials
  union all
  select id, 'faq'::text, question, updated_at from faq;

-- ---------------------------------------------------------------------------
-- Storage bucket voor portfolio-foto's (publiek leesbaar).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 13. availability_rules — vast weekrooster: exact 7 rijen (day_of_week 0-6,
-- 0 = zondag). Rijen worden nooit toegevoegd/verwijderd, alleen bewerkt.
-- ---------------------------------------------------------------------------
create table availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null unique check (day_of_week between 0 and 6),
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  break_start_time time,
  break_end_time time,
  is_available boolean not null default true,
  max_bookings_per_day int not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_availability_rules_updated_at
  before update on availability_rules
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 14. shoot_type_settings — beschikbaarheid per shoot-type: 9 rijen, één per
-- waarde uit shootTypeOptions (src/lib/constants.js). Nooit toegevoegd/
-- verwijderd, alleen bewerkt.
-- ---------------------------------------------------------------------------
create table shoot_type_settings (
  id uuid primary key default gen_random_uuid(),
  shoot_type text not null unique,
  duration_minutes int not null default 60,
  buffer_before_minutes int not null default 15,
  buffer_after_minutes int not null default 15,
  max_per_day int not null default 2,
  is_bookable boolean not null default true,
  allowed_days int[] not null default '{0,1,2,3,4,5,6}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_shoot_type_settings_updated_at
  before update on shoot_type_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 15. blocked_periods — geblokkeerde dagen/tijden (vakantie, privé, feestdag).
-- recurring_rule ondersteunt bewust alleen het praktische geval 'yearly'
-- (terugkerende feestdagen), geen volledige RRULE-parser.
-- ---------------------------------------------------------------------------
create table blocked_periods (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  reason text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  all_day boolean not null default true,
  is_recurring boolean not null default false,
  recurring_rule text check (recurring_rule is null or recurring_rule in ('yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_blocked_periods_updated_at
  before update on blocked_periods
  for each row execute function set_updated_at();

create index idx_blocked_periods_range on blocked_periods (start_datetime, end_datetime);

-- ---------------------------------------------------------------------------
-- 16. manual_slots — handmatig geopende tijdslots. Dit is ook het mechanisme
-- voor uitzonderingen die extra ruimte openen (bv. één zondag wél
-- beschikbaar) op een dag die volgens availability_rules gesloten is.
-- ---------------------------------------------------------------------------
create table manual_slots (
  id uuid primary key default gen_random_uuid(),
  title text,
  shoot_type text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  max_bookings int not null default 1,
  current_bookings int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_manual_slots_updated_at
  before update on manual_slots
  for each row execute function set_updated_at();

create index idx_manual_slots_range on manual_slots (start_datetime, end_datetime);

-- ---------------------------------------------------------------------------
-- 17. booking_settings — één rij met algemene boekingsregels.
-- ---------------------------------------------------------------------------
create table booking_settings (
  id uuid primary key default gen_random_uuid(),
  min_days_notice int not null default 2,
  max_months_ahead int not null default 6,
  default_buffer_minutes int not null default 15,
  default_duration_minutes int not null default 60,
  allow_same_day_booking boolean not null default false,
  booking_mode text not null default 'request_only'
    check (booking_mode in ('request_only', 'direct_booking', 'admin_confirmation_required')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_booking_settings_updated_at
  before update on booking_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings — uitbreiding met gestructureerde datum/tijd-velden voor het
-- echte boekingssysteem. preferred_date/preferred_period blijven bestaan
-- (achterwaartse compatibiliteit) en worden voortaan automatisch gevuld door
-- book_slot() als leesbare samenvatting van booking_date/start_time.
-- ---------------------------------------------------------------------------
alter table bookings
  add column booking_date date,
  add column start_time time,
  add column end_time time,
  add column duration_minutes int,
  add column buffer_before_minutes int,
  add column buffer_after_minutes int,
  add column selected_slot_id uuid references manual_slots(id) on delete set null,
  add column confirmed_at timestamptz,
  add column cancelled_at timestamptz,
  add column admin_notes text;

create index idx_bookings_booking_date on bookings (booking_date);

-- ---------------------------------------------------------------------------
-- Beschikbaarheids-/boekingslogica
-- ---------------------------------------------------------------------------

-- Statussen die een tijdslot NIET meer bezet houden.
create or replace function fn_is_slot_freeing_status(p_status text)
returns boolean
language sql
immutable
as $$
  select p_status in ('Geannuleerd', 'Gearchiveerd');
$$;

-- Is een datum (volledig of deels) geblokkeerd? Houdt rekening met
-- eenmalige én jaarlijks terugkerende blokkades (recurring_rule = 'yearly'
-- matcht dan alleen op maand+dag, ongeacht het jaar van start_datetime).
create or replace function fn_range_blocked(p_range_start timestamptz, p_range_end timestamptz)
returns boolean
language sql
stable
as $$
  -- Bij jaarlijks terugkerende blokkades wordt de opgeslagen periode
  -- (start én eind, met dezelfde offset) verschoven naar het jaar van de
  -- opgevraagde reeks, zodat alleen maand/dag effectief vergeleken worden.
  select exists (
    select 1 from blocked_periods b
    where
      case
        when b.is_recurring and b.recurring_rule = 'yearly' then
          tstzrange(
            b.start_datetime + (date_trunc('year', p_range_start) - date_trunc('year', b.start_datetime)),
            b.end_datetime + (date_trunc('year', p_range_start) - date_trunc('year', b.start_datetime))
          ) && tstzrange(p_range_start, p_range_end)
        else
          tstzrange(b.start_datetime, b.end_datetime) && tstzrange(p_range_start, p_range_end)
      end
  );
$$;

-- Genereert de vrije tijdslots voor één specifieke datum + shoot-type,
-- rekening houdend met weekrooster/pauze, shoot-type-instellingen, actieve
-- handmatige tijdslots (die een normaal gesloten dag kunnen openen),
-- blokkades, en bestaande niet-geannuleerde boekingen (incl. buffers).
-- Kandidaat-starttijden lopen in stappen van 15 minuten.
create or replace function fn_generate_day_slots(p_date date, p_shoot_type text)
returns table(slot_start time, slot_end time)
language plpgsql
stable
as $$
declare
  v_dow int := extract(dow from p_date)::int;
  v_rule availability_rules%rowtype;
  v_rule_found boolean;
  v_shoot shoot_type_settings%rowtype;
  v_day_max int;
  v_shoot_max int;
  v_day_count int;
  v_shoot_count int;
  v_candidate time;
  v_window_start time;
  v_window_end time;
  v_cand_start timestamptz;
  v_cand_end timestamptz;
  v_has_manual boolean;
begin
  select * into v_shoot from shoot_type_settings where shoot_type = p_shoot_type;
  if not found or not v_shoot.is_bookable then
    return;
  end if;

  select * into v_rule from availability_rules where day_of_week = v_dow;
  v_rule_found := found;

  -- Is er een actieve handmatige opening op deze dag voor dit shoot-type?
  -- (EXISTS geeft altijd true/false terug, nooit NULL, ook als er geen rij is.)
  select exists (
    select 1 from manual_slots m
    where m.is_active
      and m.current_bookings < m.max_bookings
      and (m.shoot_type is null or m.shoot_type = p_shoot_type)
      and m.start_datetime::date <= p_date and m.end_datetime::date >= p_date
  ) into v_has_manual;

  if not (
    v_has_manual
    or (v_rule_found and v_rule.is_available and v_dow = any(v_shoot.allowed_days))
  ) then
    return; -- dag volledig gesloten voor dit shoot-type
  end if;

  v_day_max := coalesce(v_rule.max_bookings_per_day, 3);
  v_shoot_max := v_shoot.max_per_day;

  select count(*) into v_day_count
  from bookings
  where booking_date = p_date and not fn_is_slot_freeing_status(status);

  select count(*) into v_shoot_count
  from bookings
  where booking_date = p_date and shoot_type = p_shoot_type and not fn_is_slot_freeing_status(status);

  if v_day_count >= v_day_max or v_shoot_count >= v_shoot_max then
    return; -- dag/shoot-type al vol
  end if;

  if fn_range_blocked(p_date::timestamptz, (p_date + 1)::timestamptz) then
    return; -- hele dag geblokkeerd
  end if;

  -- Bepaal het te doorzoeken tijdvenster: reguliere openingstijd, of anders
  -- (als de dag alleen via een manual_slot open is) 07:00-21:00 als ruime
  -- buitengrens — de manual_slot- en blokkade-checks per kandidaat filteren
  -- de echte grenzen alsnog scherp.
  if v_rule_found and v_rule.is_available then
    v_window_start := v_rule.start_time;
    v_window_end := v_rule.end_time;
  else
    v_window_start := '07:00';
    v_window_end := '21:00';
  end if;

  v_candidate := v_window_start;
  while v_candidate + make_interval(mins => v_shoot.duration_minutes) <= v_window_end loop
    -- Sla de pauze over.
    if v_rule.break_start_time is not null and v_rule.break_end_time is not null
       and v_candidate < v_rule.break_end_time
       and (v_candidate + make_interval(mins => v_shoot.duration_minutes)) > v_rule.break_start_time
    then
      v_candidate := v_candidate + interval '15 min';
      continue;
    end if;

    v_cand_start := (p_date + v_candidate) - make_interval(mins => v_shoot.buffer_before_minutes);
    v_cand_end := (p_date + v_candidate + make_interval(mins => v_shoot.duration_minutes))
                  + make_interval(mins => v_shoot.buffer_after_minutes);

    if not fn_range_blocked(v_cand_start, v_cand_end)
       and not exists (
         select 1 from bookings b
         where b.booking_date = p_date
           and not fn_is_slot_freeing_status(b.status)
           and b.start_time is not null
           and tstzrange(
                 (b.booking_date + b.start_time) - make_interval(mins => coalesce(b.buffer_before_minutes, 0)),
                 (b.booking_date + b.end_time) + make_interval(mins => coalesce(b.buffer_after_minutes, 0))
               ) && tstzrange(v_cand_start, v_cand_end)
       )
    then
      -- Als de dag alleen via een manual_slot open is, moet de kandidaat
      -- ook echt binnen zo'n slot vallen.
      if v_has_manual or (v_rule_found and v_rule.is_available and v_dow = any(v_shoot.allowed_days)) then
        if (v_rule_found and v_rule.is_available and v_dow = any(v_shoot.allowed_days))
           or exists (
             select 1 from manual_slots m
             where m.is_active and m.current_bookings < m.max_bookings
               and (m.shoot_type is null or m.shoot_type = p_shoot_type)
               and tstzrange(m.start_datetime, m.end_datetime)
                   @> tstzrange(p_date + v_candidate, p_date + v_candidate + make_interval(mins => v_shoot.duration_minutes))
           )
        then
          slot_start := v_candidate;
          slot_end := v_candidate + make_interval(mins => v_shoot.duration_minutes);
          return next;
        end if;
      end if;
    end if;

    v_candidate := v_candidate + interval '15 min';
  end loop;
end;
$$;

-- Publieke leesfunctie: maand-overzicht (per dag status) of dag-overzicht
-- (concrete vrije tijdslots). Wordt alleen aangeroepen vanuit
-- netlify/functions/get-available-slots.ts met de service-role key, nooit
-- rechtstreeks met de anon-key (de onderliggende tabellen zijn admin-only).
create or replace function get_available_slots(
  p_mode text,
  p_shoot_type text,
  p_year int default null,
  p_month int default null,
  p_date date default null
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_settings booking_settings%rowtype;
  v_min_date date;
  v_max_date date;
  v_result jsonb;
  v_day date;
  v_last_day date;
  v_slot_count int;
begin
  select * into v_settings from booking_settings limit 1;
  v_min_date := current_date + coalesce(v_settings.min_days_notice, 2)
                * case when coalesce(v_settings.allow_same_day_booking, false) then 0 else 1 end;
  if coalesce(v_settings.allow_same_day_booking, false) then
    v_min_date := least(v_min_date, current_date);
  end if;
  v_max_date := current_date + make_interval(months => coalesce(v_settings.max_months_ahead, 6));

  if p_mode = 'day' then
    if p_date < v_min_date or p_date > v_max_date then
      return jsonb_build_object('slots', '[]'::jsonb);
    end if;
    select coalesce(jsonb_agg(jsonb_build_object(
             'start', to_char(slot_start, 'HH24:MI'),
             'end', to_char(slot_end, 'HH24:MI')
           ) order by slot_start), '[]'::jsonb)
      into v_result
      from fn_generate_day_slots(p_date, p_shoot_type);
    return jsonb_build_object('slots', v_result);
  end if;

  if p_mode = 'month' then
    v_day := make_date(p_year, p_month, 1);
    v_last_day := (v_day + interval '1 month' - interval '1 day')::date;
    v_result := '{}'::jsonb;
    while v_day <= v_last_day loop
      if v_day < v_min_date or v_day > v_max_date then
        v_result := v_result || jsonb_build_object(v_day::text, 'closed');
      else
        select count(*) into v_slot_count from fn_generate_day_slots(v_day, p_shoot_type);
        if v_slot_count = 0 then
          if fn_range_blocked(v_day::timestamptz, (v_day + 1)::timestamptz) then
            v_result := v_result || jsonb_build_object(v_day::text, 'blocked');
          else
            v_result := v_result || jsonb_build_object(v_day::text, 'closed');
          end if;
        else
          v_result := v_result || jsonb_build_object(v_day::text, 'available');
        end if;
      end if;
      v_day := v_day + 1;
    end loop;
    return jsonb_build_object('days', v_result);
  end if;

  raise exception 'INVALID_MODE';
end;
$$;

-- Schrijffunctie: valideert + boekt in één transactie (row-level lock op de
-- boekingen van die dag) zodat dubbele boekingen echt niet kunnen ontstaan,
-- ook niet bij gelijktijdige aanvragen. Callable door zowel anon (publieke
-- aanvraag, geforceerd status/source) als een ingelogde admin (vrije status).
create or replace function book_slot(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := is_admin();
  v_shoot_type text := p_payload->>'shoot_type';
  v_booking_date date := (p_payload->>'booking_date')::date;
  v_start_time time := (p_payload->>'start_time')::time;
  v_shoot shoot_type_settings%rowtype;
  v_settings booking_settings%rowtype;
  v_end_time time;
  v_cand_start timestamptz;
  v_cand_end timestamptz;
  v_day_count int;
  v_shoot_count int;
  v_manual_slot_id uuid;
  v_status text;
  v_source text;
  v_new_row bookings%rowtype;
  v_giftcard_code text := upper(nullif(trim(p_payload->>'giftcard_code'), ''));
  v_giftcard giftcards%rowtype;
begin
  select * into v_shoot from shoot_type_settings where shoot_type = v_shoot_type;
  if not found or (not v_shoot.is_bookable and not v_is_admin) then
    raise exception 'NOT_BOOKABLE';
  end if;

  -- Cadeaubon (optioneel): rij vergrendelen zodat twee gelijktijdige
  -- boekingen dezelfde code nooit allebei kunnen verzilveren.
  if v_giftcard_code is not null then
    select * into v_giftcard from giftcards where code = v_giftcard_code for update;
    if not found then
      raise exception 'GIFTCARD_INVALID';
    end if;
    if v_giftcard.status not in ('Betaald', 'Verzonden') then
      raise exception 'GIFTCARD_NOT_REDEEMABLE';
    end if;
    if v_giftcard.expires_at is not null and v_giftcard.expires_at < current_date then
      raise exception 'GIFTCARD_EXPIRED';
    end if;
  end if;

  select * into v_settings from booking_settings limit 1;
  v_end_time := v_start_time + make_interval(mins => v_shoot.duration_minutes);

  if not v_is_admin then
    if v_booking_date < current_date + coalesce(v_settings.min_days_notice, 2)
       and not (coalesce(v_settings.allow_same_day_booking, false) and v_booking_date = current_date)
    then
      raise exception 'MIN_NOTICE';
    end if;
    if v_booking_date > current_date + make_interval(months => coalesce(v_settings.max_months_ahead, 6)) then
      raise exception 'MAX_AHEAD';
    end if;
  end if;

  -- Advisory lock per kalenderdag (transactie-scope, automatisch vrij bij
  -- commit/rollback): een gewone "select ... for update" vergrendelt alleen
  -- bestaande rijen, en biedt dus geen bescherming als twee aanvragen
  -- tegelijk de EERSTE boeking van een nog lege dag proberen te plaatsen.
  -- Deze lock dwingt af dat gelijktijdige aanvragen voor dezelfde dag altijd
  -- na elkaar (nooit tegelijk) worden beoordeeld.
  perform pg_advisory_xact_lock(hashtext(v_booking_date::text));

  if not exists (select 1 from fn_generate_day_slots(v_booking_date, v_shoot_type) s where s.slot_start = v_start_time)
     and not v_is_admin
  then
    raise exception 'SLOT_TAKEN';
  end if;

  -- Extra check, ook voor admin-handmatige boekingen: harde overlap-toets
  -- (fn_generate_day_slots dekt dit voor publieke aanvragen al, maar een
  -- admin mag buiten de normale kandidaat-tijden om boeken zolang er geen
  -- daadwerkelijke overlap is).
  v_cand_start := (v_booking_date + v_start_time) - make_interval(mins => v_shoot.buffer_before_minutes);
  v_cand_end := (v_booking_date + v_end_time) + make_interval(mins => v_shoot.buffer_after_minutes);

  if exists (
    select 1 from bookings b
    where b.booking_date = v_booking_date
      and not fn_is_slot_freeing_status(b.status)
      and b.start_time is not null
      and tstzrange(
            (b.booking_date + b.start_time) - make_interval(mins => coalesce(b.buffer_before_minutes, 0)),
            (b.booking_date + b.end_time) + make_interval(mins => coalesce(b.buffer_after_minutes, 0))
          ) && tstzrange(v_cand_start, v_cand_end)
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  select count(*) into v_day_count from bookings
    where booking_date = v_booking_date and not fn_is_slot_freeing_status(status);
  select count(*) into v_shoot_count from bookings
    where booking_date = v_booking_date and shoot_type = v_shoot_type and not fn_is_slot_freeing_status(status);

  if not v_is_admin and (
    v_day_count >= coalesce((select max_bookings_per_day from availability_rules where day_of_week = extract(dow from v_booking_date)::int), 3)
    or v_shoot_count >= v_shoot.max_per_day
  ) then
    raise exception 'DATE_UNAVAILABLE';
  end if;

  -- Is dit tijdslot alleen mogelijk dankzij een handmatige opening?
  select m.id into v_manual_slot_id
  from manual_slots m
  where m.is_active and m.current_bookings < m.max_bookings
    and (m.shoot_type is null or m.shoot_type = v_shoot_type)
    and tstzrange(m.start_datetime, m.end_datetime) @> tstzrange(v_booking_date + v_start_time, v_booking_date + v_end_time)
  limit 1;

  if v_is_admin and p_payload ? 'status' then
    v_status := p_payload->>'status';
  else
    v_status := 'Nieuw';
  end if;
  v_source := case when v_is_admin then coalesce(p_payload->>'source', 'admin') else 'website' end;

  insert into bookings (
    customer_name, customer_email, shoot_type, package_id, location, message,
    privacy_accepted, model_discount, status, source,
    booking_date, start_time, end_time, duration_minutes,
    buffer_before_minutes, buffer_after_minutes, selected_slot_id,
    preferred_date, preferred_period, admin_notes
  ) values (
    p_payload->>'customer_name',
    p_payload->>'customer_email',
    v_shoot_type,
    nullif(p_payload->>'package_id', '')::uuid,
    p_payload->>'location',
    p_payload->>'message',
    coalesce((p_payload->>'privacy_accepted')::boolean, v_is_admin),
    v_shoot_type = 'Model staan met 50% korting',
    v_status,
    v_source,
    v_booking_date,
    v_start_time,
    v_end_time,
    v_shoot.duration_minutes,
    v_shoot.buffer_before_minutes,
    v_shoot.buffer_after_minutes,
    v_manual_slot_id,
    v_booking_date,
    to_char(v_booking_date, 'DD-MM-YYYY') || ', ' || to_char(v_start_time, 'HH24:MI'),
    nullif(p_payload->>'admin_notes', '')
  )
  returning * into v_new_row;

  if v_manual_slot_id is not null then
    update manual_slots set current_bookings = current_bookings + 1 where id = v_manual_slot_id;
  end if;

  if v_giftcard_code is not null then
    update giftcards
      set status = 'Gebruikt', used_at = now(), redeemed_booking_id = v_new_row.id
      where id = v_giftcard.id;
  end if;

  insert into booking_status_history (booking_id, old_status, new_status, changed_by)
  values (v_new_row.id, null, v_new_row.status, v_source);

  -- giftcard_amount/giftcard_type worden meegegeven zodat de aanroepende
  -- Netlify Function (create-booking.ts) dit direct in de bevestigingsmail
  -- aan klant én admin kan vermelden, zonder een tweede round-trip.
  if v_giftcard_code is not null then
    return to_jsonb(v_new_row) || jsonb_build_object(
      'giftcard_amount', v_giftcard.amount,
      'giftcard_type', v_giftcard.giftcard_type,
      'giftcard_code', v_giftcard.code
    );
  end if;

  return to_jsonb(v_new_row);
end;
$$;

grant execute on function book_slot(jsonb) to anon, authenticated;
grant execute on function get_available_slots(text, text, int, int, date) to service_role;

-- Publieke, alleen-lezen check of een cadeaubon-code geldig en inwisselbaar
-- is (zonder 'm te verzilveren) — gebruikt door de boekingswizard voor
-- live feedback vóórdat de klant daadwerkelijk boekt. giftcards zelf is
-- admin-only (RLS), vandaar security definer, en er wordt bewust alleen het
-- strikt noodzakelijke teruggegeven (geen koperinformatie).
create or replace function check_giftcard_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_giftcard giftcards%rowtype;
  v_code text := upper(nullif(trim(p_code), ''));
begin
  if v_code is null then
    return jsonb_build_object('valid', false, 'reason', 'GIFTCARD_INVALID');
  end if;

  select * into v_giftcard from giftcards where code = v_code;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'GIFTCARD_INVALID');
  end if;
  if v_giftcard.status not in ('Betaald', 'Verzonden') then
    return jsonb_build_object('valid', false, 'reason', 'GIFTCARD_NOT_REDEEMABLE');
  end if;
  if v_giftcard.expires_at is not null and v_giftcard.expires_at < current_date then
    return jsonb_build_object('valid', false, 'reason', 'GIFTCARD_EXPIRED');
  end if;

  return jsonb_build_object(
    'valid', true,
    'giftcard_type', v_giftcard.giftcard_type,
    'amount', v_giftcard.amount
  );
end;
$$;

grant execute on function check_giftcard_code(text) to anon, authenticated;

-- Herplannen (admin-kalender, slepen): hergebruikt dezelfde overlap-toets,
-- alleen bereikbaar voor admins.
create or replace function reschedule_booking(p_booking_id uuid, p_new_date date, p_new_start_time time)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking bookings%rowtype;
  v_shoot shoot_type_settings%rowtype;
  v_new_end time;
  v_cand_start timestamptz;
  v_cand_end timestamptz;
  v_old_status text;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then
    raise exception 'BOOKING_NOT_FOUND';
  end if;

  select * into v_shoot from shoot_type_settings where shoot_type = v_booking.shoot_type;
  v_new_end := p_new_start_time + make_interval(mins => coalesce(v_booking.duration_minutes, v_shoot.duration_minutes));

  -- Zelfde advisory-lock-strategie als book_slot() — zie toelichting daar.
  perform pg_advisory_xact_lock(hashtext(p_new_date::text));

  v_cand_start := (p_new_date + p_new_start_time) - make_interval(mins => coalesce(v_booking.buffer_before_minutes, 0));
  v_cand_end := (p_new_date + v_new_end) + make_interval(mins => coalesce(v_booking.buffer_after_minutes, 0));

  if exists (
    select 1 from bookings b
    where b.id <> p_booking_id
      and b.booking_date = p_new_date
      and not fn_is_slot_freeing_status(b.status)
      and b.start_time is not null
      and tstzrange(
            (b.booking_date + b.start_time) - make_interval(mins => coalesce(b.buffer_before_minutes, 0)),
            (b.booking_date + b.end_time) + make_interval(mins => coalesce(b.buffer_after_minutes, 0))
          ) && tstzrange(v_cand_start, v_cand_end)
  ) then
    raise exception 'SLOT_TAKEN';
  end if;

  v_old_status := v_booking.status;

  update bookings set
    booking_date = p_new_date,
    start_time = p_new_start_time,
    end_time = v_new_end,
    preferred_date = p_new_date,
    preferred_period = to_char(p_new_date, 'DD-MM-YYYY') || ', ' || to_char(p_new_start_time, 'HH24:MI')
  where id = p_booking_id
  returning * into v_booking;

  insert into booking_status_history (booking_id, old_status, new_status, changed_by)
  values (p_booking_id, v_old_status, v_old_status, 'admin (herpland)');

  return to_jsonb(v_booking);
end;
$$;

grant execute on function reschedule_booking(uuid, date, time) to authenticated;

-- Publieke helperfunctie: welke shoot-types zijn op dit moment boekbaar op de
-- site? shoot_type_settings zelf is admin-only (RLS); deze functie is
-- security definer zodat anon 'm toch mag aanroepen, en geeft bewust alleen
-- de namen terug (geen duur/buffers/etc.) — dezelfde least-privilege-aanpak
-- als book_slot()/get_available_slots().
create or replace function get_bookable_shoot_types()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(shoot_type order by shoot_type), '{}'::text[])
  from shoot_type_settings
  where is_bookable = true;
$$;

grant execute on function get_bookable_shoot_types() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 18. monthly_availability_settings — optionele handmatige overrides per
-- maand (sluiten, status overschrijven, eigen drempel/max, notities). Geen
-- rij voor een maand = volledig automatisch berekende status. Wordt bewust
-- niet vooraf geseed, alleen aangemaakt zodra een admin 'm daadwerkelijk zet.
-- ---------------------------------------------------------------------------
create table monthly_availability_settings (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  month int not null check (month between 1 and 12),
  manual_status text not null default 'automatic'
    check (manual_status in ('automatic', 'no_bookings', 'available', 'limited', 'almost_full', 'full', 'unavailable')),
  is_closed boolean not null default false,
  max_bookings int,
  warning_threshold_slots int,
  warning_threshold_percentage int,
  public_message text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year, month)
);

create trigger trg_monthly_availability_settings_updated_at
  before update on monthly_availability_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 19. booking_display_settings — één rij, globale instellingen voor het
-- publieke "beschikbaarheid per maand"-overzicht.
-- ---------------------------------------------------------------------------
create table booking_display_settings (
  id uuid primary key default gen_random_uuid(),
  months_ahead_to_show int not null default 12,
  show_booking_counts_publicly boolean not null default false,
  show_exact_available_slots_publicly boolean not null default false,
  reserve_pending_bookings boolean not null default true,
  almost_full_threshold_slots int not null default 3,
  almost_full_threshold_percentage int not null default 20,
  limited_threshold_percentage int not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_booking_display_settings_updated_at
  before update on booking_display_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Maandbeschikbaarheid-logica
-- ---------------------------------------------------------------------------

-- Telt een boekingsstatus mee als "bezet" voor de maand-WEERGAVE? Dit is een
-- apart, zachter begrip dan fn_is_slot_freeing_status hierboven (die regelt
-- de daadwerkelijke dubbele-boekingen-preventie en blijft ongewijzigd) —
-- reserve_pending_bookings bepaalt alleen hoe druk een maand oogt op de site.
create or replace function fn_is_slot_occupying_status(p_status text, p_reserve_pending boolean)
returns boolean
language sql
immutable
as $$
  select case
    when p_status in ('Geannuleerd', 'Gearchiveerd') then false
    when p_status in ('Datum ingepland', 'Aanbetaling gevraagd', 'Aanbetaling ontvangen',
                       'Shoot geweest', 'Galerij verstuurd', 'Afgerond') then true
    else p_reserve_pending
  end;
$$;

-- Berekent de volledige status + details voor één maand. security definer
-- zodat zowel een ingelogde admin (rechtstreekse RPC, volledige details) als
-- de service-role vanuit netlify/functions/get-month-availability.ts (die
-- vervolgens filtert wat er publiek getoond mag worden) 'm kunnen aanroepen.
-- Capaciteit wordt op DAGNIVEAU berekend (som van max_bookings_per_day over
-- boekbare, niet-geblokkeerde dagen binnen het boekbare venster) — bewust
-- shoot-type-onafhankelijk en dezelfde rekenwijze als de bestaande
-- monthCapacity()-helper in AdminDashboard.jsx, i.p.v. een dure exacte
-- tijdslot-telling per shoot-type.
create or replace function calculate_month_status(p_year int, p_month int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings booking_settings%rowtype;
  v_display booking_display_settings%rowtype;
  v_override monthly_availability_settings%rowtype;
  v_has_override boolean;
  v_min_date date;
  v_max_date date;
  v_month_start date := make_date(p_year, p_month, 1);
  v_month_end date := (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date;
  v_window_start date;
  v_window_end date;
  v_day date;
  v_rule availability_rules%rowtype;
  v_capacity int := 0;
  v_blocked_days int := 0;
  v_occupied int := 0;
  v_total_requests int := 0;
  v_confirmed int := 0;
  v_pending int := 0;
  v_remaining int;
  v_pct numeric;
  v_almost_slots int;
  v_almost_pct int;
  v_status text;
  v_message text;
begin
  select * into v_settings from booking_settings limit 1;
  select * into v_display from booking_display_settings limit 1;
  select * into v_override from monthly_availability_settings where year = p_year and month = p_month;
  v_has_override := found;

  v_min_date := current_date + coalesce(v_settings.min_days_notice, 2)
                * case when coalesce(v_settings.allow_same_day_booking, false) then 0 else 1 end;
  if coalesce(v_settings.allow_same_day_booking, false) then
    v_min_date := least(v_min_date, current_date);
  end if;
  v_max_date := current_date + make_interval(months => coalesce(v_settings.max_months_ahead, 6));

  v_window_start := greatest(v_month_start, v_min_date);
  v_window_end := least(v_month_end, v_max_date);

  -- Capaciteit: som van max_bookings_per_day over boekbare dagen binnen het
  -- boekbare venster die niet (deels) geblokkeerd zijn.
  if v_window_start <= v_window_end then
    v_day := v_window_start;
    while v_day <= v_window_end loop
      select * into v_rule from availability_rules where day_of_week = extract(dow from v_day)::int;
      if found and v_rule.is_available and not fn_range_blocked(v_day::timestamptz, (v_day + 1)::timestamptz) then
        v_capacity := v_capacity + v_rule.max_bookings_per_day;
      end if;
      v_day := v_day + 1;
    end loop;
  end if;

  -- Aantal geblokkeerde dagen deze kalendermaand (los van het boekbare
  -- venster, puur informatief voor de admin).
  v_day := v_month_start;
  while v_day <= v_month_end loop
    if fn_range_blocked(v_day::timestamptz, (v_day + 1)::timestamptz) then
      v_blocked_days := v_blocked_days + 1;
    end if;
    v_day := v_day + 1;
  end loop;

  select
    count(*) filter (where not fn_is_slot_freeing_status(status)),
    count(*) filter (where fn_is_slot_occupying_status(status, coalesce(v_display.reserve_pending_bookings, true))),
    count(*) filter (where status in ('Datum ingepland', 'Aanbetaling gevraagd', 'Aanbetaling ontvangen',
                                       'Shoot geweest', 'Galerij verstuurd', 'Afgerond')),
    count(*) filter (where status in ('Nieuw', 'Gelezen', 'Contact opgenomen', 'Wacht op reactie'))
    into v_total_requests, v_occupied, v_confirmed, v_pending
  from bookings
  where booking_date between v_month_start and v_month_end;

  if v_has_override and v_override.max_bookings is not null then
    v_capacity := v_override.max_bookings;
  end if;

  v_remaining := greatest(v_capacity - v_occupied, 0);
  v_pct := case when v_capacity <= 0 then 0 else round(v_remaining::numeric / v_capacity * 100) end;

  if v_has_override and v_override.warning_threshold_slots is not null then
    v_almost_slots := v_override.warning_threshold_slots;
  else
    v_almost_slots := coalesce(v_display.almost_full_threshold_slots, 3);
  end if;
  if v_has_override and v_override.warning_threshold_percentage is not null then
    v_almost_pct := v_override.warning_threshold_percentage;
  else
    v_almost_pct := coalesce(v_display.almost_full_threshold_percentage, 20);
  end if;

  -- Statusbepaling: handmatige sluiting/override wint altijd. Anders
  -- automatisch, in exact deze volgorde (meest restrictief eerst).
  if v_has_override and v_override.is_closed then
    v_status := 'unavailable';
  elsif v_has_override and v_override.manual_status <> 'automatic' then
    v_status := v_override.manual_status;
  elsif v_capacity = 0 then
    v_status := 'unavailable';
  elsif v_remaining <= 0 or (v_has_override and v_override.max_bookings is not null and v_occupied >= v_override.max_bookings) then
    v_status := 'full';
  elsif v_remaining <= v_almost_slots or v_pct <= v_almost_pct then
    v_status := 'almost_full';
  elsif v_pct <= coalesce(v_display.limited_threshold_percentage, 50) then
    v_status := 'limited';
  elsif v_total_requests = 0 then
    v_status := 'no_bookings';
  else
    v_status := 'available';
  end if;

  v_message := case v_status
    when 'no_bookings' then 'Deze maand is nog helemaal open. Er is nog veel keuze.'
    when 'available' then 'Er zijn nog meerdere momenten beschikbaar.'
    when 'limited' then 'Er zijn al wat aanvragen, maar boeken kan nog.'
    when 'almost_full' then 'Deze maand zit bijna vol. Wacht niet te lang met aanvragen.'
    when 'full' then 'Deze maand is helaas volgeboekt.'
    else 'Deze maand is niet beschikbaar voor boekingen.'
  end;
  if v_has_override and v_override.public_message is not null and length(trim(v_override.public_message)) > 0 then
    v_message := v_override.public_message;
  end if;

  return jsonb_build_object(
    'year', p_year,
    'month', p_month,
    'status', v_status,
    'message', v_message,
    'capacity', v_capacity,
    'occupied', v_occupied,
    'remaining', v_remaining,
    'percentageRemaining', v_pct,
    'blockedDays', v_blocked_days,
    'totalRequests', v_total_requests,
    'confirmedCount', v_confirmed,
    'pendingCount', v_pending,
    'isClosed', coalesce(v_has_override and v_override.is_closed, false),
    'manualStatus', case when v_has_override then v_override.manual_status else 'automatic' end,
    'maxBookings', v_override.max_bookings,
    'internalNote', v_override.internal_note
  );
end;
$$;

-- Verzamelt calculate_month_status() voor p_count opeenvolgende maanden
-- vanaf (p_start_year, p_start_month). Wordt aangeroepen door zowel de
-- publieke Netlify Function als de admin-maandplanningpagina.
create or replace function get_months_status(p_start_year int, p_start_month int, p_count int default 12)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year int := p_start_year;
  v_month int := p_start_month;
  v_result jsonb := '[]'::jsonb;
  v_i int := 0;
begin
  while v_i < p_count loop
    v_result := v_result || jsonb_build_array(calculate_month_status(v_year, v_month));
    v_month := v_month + 1;
    if v_month > 12 then
      v_month := 1;
      v_year := v_year + 1;
    end if;
    v_i := v_i + 1;
  end loop;
  return jsonb_build_object('months', v_result);
end;
$$;

grant execute on function calculate_month_status(int, int) to authenticated, service_role;
grant execute on function get_months_status(int, int, int) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 20. Klantgalerijen / online selectie
-- ---------------------------------------------------------------------------
create table client_galleries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_name text not null,
  client_email text not null,
  secure_token text not null unique,
  status text not null default 'Concept' check (status in (
    'Concept', 'Gepubliceerd', 'Wacht op keuze klant', 'Keuze ontvangen',
    'Extra beelden aangevraagd', 'Afgerond', 'Verlopen', 'Verborgen'
  )),
  included_images int not null default 0,
  is_published boolean not null default false,
  expires_at date,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_client_galleries_updated_at
  before update on client_galleries
  for each row execute function set_updated_at();

create table gallery_photos (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references client_galleries(id) on delete cascade,
  title text,
  filename text,
  image_url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_favorite boolean not null default false,
  is_extra_requested boolean not null default false,
  client_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_gallery_photos_updated_at
  before update on gallery_photos
  for each row execute function set_updated_at();

create index idx_client_galleries_token on client_galleries (secure_token);
create index idx_gallery_photos_gallery on gallery_photos (gallery_id);

insert into storage.buckets (id, name, public)
values ('client-galleries', 'client-galleries', true)
on conflict (id) do nothing;

create or replace function get_gallery_access(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gallery client_galleries%rowtype;
  v_photos jsonb;
begin
  select * into v_gallery
  from client_galleries
  where secure_token = p_token
    and is_published = true
    and status not in ('Concept', 'Verborgen', 'Verlopen')
    and (expires_at is null or expires_at >= current_date);

  if not found then
    return jsonb_build_object('gallery', null, 'photos', '[]'::jsonb);
  end if;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.sort_order, p.created_at), '[]'::jsonb)
    into v_photos
  from gallery_photos p
  where p.gallery_id = v_gallery.id;

  return jsonb_build_object('gallery', to_jsonb(v_gallery), 'photos', v_photos);
end;
$$;

create or replace function save_gallery_selection(p_token text, p_selections jsonb, p_request_extra boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gallery client_galleries%rowtype;
  v_item jsonb;
  v_selected_count int := 0;
begin
  select * into v_gallery
  from client_galleries
  where secure_token = p_token
    and is_published = true
    and status not in ('Concept', 'Verborgen', 'Verlopen')
    and (expires_at is null or expires_at >= current_date);

  if not found then
    raise exception 'GALLERY_NOT_FOUND';
  end if;

  update gallery_photos
    set is_favorite = false, is_extra_requested = false
  where gallery_id = v_gallery.id;

  for v_item in select * from jsonb_array_elements(p_selections)
  loop
    update gallery_photos
      set
        is_favorite = coalesce((v_item->>'is_favorite')::boolean, false),
        client_note = nullif(v_item->>'client_note', ''),
        is_extra_requested = false
      where id = nullif(v_item->>'photo_id', '')::uuid
        and gallery_id = v_gallery.id;
  end loop;

  select count(*) into v_selected_count
  from gallery_photos
  where gallery_id = v_gallery.id and is_favorite = true;

  if v_selected_count > coalesce(v_gallery.included_images, 0) or p_request_extra then
    update gallery_photos
      set is_extra_requested = true
      where gallery_id = v_gallery.id
        and is_favorite = true
        and id in (
          select id from gallery_photos
          where gallery_id = v_gallery.id and is_favorite = true
          order by sort_order, created_at
          offset greatest(coalesce(v_gallery.included_images, 0), 0)
        );
    update client_galleries set status = 'Extra beelden aangevraagd' where id = v_gallery.id;
  else
    update client_galleries set status = 'Keuze ontvangen' where id = v_gallery.id;
  end if;

  return jsonb_build_object('ok', true, 'selected_count', v_selected_count);
end;
$$;

grant execute on function get_gallery_access(text) to anon, authenticated;
grant execute on function save_gallery_selection(text, jsonb, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 21. E-mailtemplates en logs
-- ---------------------------------------------------------------------------
create table email_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  label text not null,
  subject text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_email_templates_updated_at
  before update on email_templates
  for each row execute function set_updated_at();

create table email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  template_key text not null,
  subject text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  error_message text,
  related_booking_id uuid references bookings(id) on delete set null,
  related_gallery_id uuid references client_galleries(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_email_logs_created_at on email_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- 22. Wachtlijst
-- ---------------------------------------------------------------------------
create table waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  shoot_type text not null,
  preferred_date date,
  preferred_month text,
  flexibility text,
  message text,
  status text not null default 'Nieuw' check (status in (
    'Nieuw', 'Bekeken', 'Benaderd', 'Wacht op reactie',
    'Omgezet naar boeking', 'Niet meer nodig', 'Gearchiveerd'
  )),
  internal_note text,
  converted_booking_id uuid references bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_waitlist_entries_updated_at
  before update on waitlist_entries
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 23. Cadeaubonnen
-- ---------------------------------------------------------------------------
create table giftcards (
  id uuid primary key default gen_random_uuid(),
  purchaser_name text not null,
  purchaser_email text not null,
  recipient_name text,
  giftcard_type text not null,
  amount numeric(10,2),
  package_id uuid references packages(id) on delete set null,
  personal_message text,
  delivery_method text,
  code text unique,
  status text not null default 'Nieuw' check (status in (
    'Nieuw', 'Wacht op betaling', 'Betaald', 'Verzonden', 'Gebruikt', 'Verlopen', 'Geannuleerd'
  )),
  paid_at timestamptz,
  sent_at timestamptz,
  used_at timestamptz,
  expires_at date,
  internal_note text,
  redeemed_booking_id uuid references bookings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_giftcards_updated_at
  before update on giftcards
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 24. Mini-shoot dagen
-- ---------------------------------------------------------------------------
create table mini_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  date date not null,
  location text,
  price numeric(10,2),
  included_images int not null default 0,
  duration_minutes int not null default 20,
  is_published boolean not null default false,
  status text not null default 'Concept' check (status in ('Concept', 'Gepubliceerd', 'Vol', 'Gesloten', 'Afgerond', 'Verborgen')),
  cover_image_url text,
  terms text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_mini_sessions_updated_at
  before update on mini_sessions
  for each row execute function set_updated_at();

create table mini_session_slots (
  id uuid primary key default gen_random_uuid(),
  mini_session_id uuid not null references mini_sessions(id) on delete cascade,
  start_time time not null,
  end_time time not null,
  max_bookings int not null default 1,
  current_bookings int not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_mini_session_slots_updated_at
  before update on mini_session_slots
  for each row execute function set_updated_at();

create table mini_session_bookings (
  id uuid primary key default gen_random_uuid(),
  mini_session_id uuid not null references mini_sessions(id) on delete cascade,
  slot_id uuid references mini_session_slots(id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  message text,
  status text not null default 'Nieuw' check (status in ('Nieuw', 'Bevestigd', 'Wacht op betaling', 'Betaald', 'Geannuleerd', 'Afgerond')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_mini_session_bookings_updated_at
  before update on mini_session_bookings
  for each row execute function set_updated_at();
