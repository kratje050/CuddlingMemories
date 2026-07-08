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
