-- Cuddling Memories Fotografie — Maandbeschikbaarheid-migratie
-- Bevat ALLEEN het nieuwe deel t.o.v. de al eerder uitgevoerde schema.sql/
-- policies.sql/seed.sql/booking-system-migration.sql: de 2 nieuwe tabellen,
-- de statuslogica-functies, de bijbehorende RLS-policies en de seed-rij voor
-- booking_display_settings. Voer dit één keer volledig uit in de Supabase
-- SQL Editor (Project > SQL Editor > New query > plak dit hele bestand > Run).

-- =============================================================================
-- Deel 1 — nieuwe tabellen en functies (uit schema.sql)
-- =============================================================================

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

-- =============================================================================
-- Deel 2 — RLS-policies voor de 2 nieuwe tabellen (uit policies.sql)
-- =============================================================================

alter table monthly_availability_settings enable row level security;
create policy "monthly_availability_settings_admin_all" on monthly_availability_settings
  for all using (is_admin()) with check (is_admin());

alter table booking_display_settings enable row level security;
create policy "booking_display_settings_admin_all" on booking_display_settings
  for all using (is_admin()) with check (is_admin());

-- =============================================================================
-- Deel 3 — seed-data (uit seed.sql)
-- =============================================================================

insert into booking_display_settings (
  months_ahead_to_show, show_booking_counts_publicly, show_exact_available_slots_publicly,
  reserve_pending_bookings, almost_full_threshold_slots, almost_full_threshold_percentage, limited_threshold_percentage
) values (12, false, false, true, 3, 20, 50);

-- monthly_availability_settings: bewust leeg. Er komt alleen een rij zodra
-- een admin een maand handmatig sluit/overschrijft via /admin/maandplanning.
