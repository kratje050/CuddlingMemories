-- Automatische heen- en terugreis vanaf de dichtstbijzijnde ingestelde basis.
-- Veilig om opnieuw uit te voeren.

create table if not exists public.travel_settings (
  id text primary key default 'main',
  active_origin text not null default 'auto' check (active_origin in ('auto', 'zoutkamp', 'gouda')),
  origin_zoutkamp text not null default 'Zoutkamp, Nederland',
  origin_gouda text not null default 'Gouda, Nederland',
  rate_per_km numeric(10,2) not null default 0.35 check (rate_per_km >= 0),
  updated_at timestamptz not null default now()
);

insert into public.travel_settings (id) values ('main') on conflict (id) do nothing;

alter table public.travel_settings
  add column if not exists active_origin text not null default 'auto';

do $$ begin
  alter table public.travel_settings add constraint travel_settings_active_origin_check
    check (active_origin in ('auto', 'zoutkamp', 'gouda'));
exception when duplicate_object then null;
end $$;

drop trigger if exists trg_travel_settings_updated_at on public.travel_settings;
create trigger trg_travel_settings_updated_at
  before update on public.travel_settings
  for each row execute function public.set_updated_at();

alter table public.travel_settings enable row level security;
drop policy if exists "travel_settings_admin_all" on public.travel_settings;
create policy "travel_settings_admin_all" on public.travel_settings
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.bookings
  add column if not exists location_type text not null default 'studio',
  add column if not exists location_street text,
  add column if not exists location_house_number text,
  add column if not exists location_postcode text,
  add column if not exists location_city text,
  add column if not exists location_notes text,
  add column if not exists travel_origin_name text,
  add column if not exists travel_origin_address text,
  add column if not exists travel_one_way_km numeric(10,1),
  add column if not exists travel_round_trip_km numeric(10,1),
  add column if not exists travel_rate_per_km numeric(10,2),
  add column if not exists travel_cost numeric(10,2),
  add column if not exists travel_calculated_at timestamptz,
  add column if not exists travel_distance_source text;

do $$ begin
  alter table public.bookings add constraint bookings_location_type_check check (location_type in ('studio', 'location'));
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
