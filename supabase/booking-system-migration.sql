-- Cuddling Memories Fotografie — Boekingssysteem-migratie
-- Bevat ALLEEN het nieuwe deel t.o.v. de eerder al uitgevoerde schema.sql/
-- policies.sql/seed.sql: de 5 nieuwe tabellen, de bookings-uitbreiding, de
-- beschikbaarheids-/boekingsfuncties, de bijbehorende RLS-policies en de
-- seed-data (weekrooster + shoot-type-instellingen + booking_settings).
-- Voer dit één keer volledig uit in de Supabase SQL Editor (Project > SQL
-- Editor > New query > plak dit hele bestand > Run).

-- =============================================================================
-- Deel 1 — nieuwe tabellen, bookings-uitbreiding en functies (uit schema.sql)
-- =============================================================================

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

create or replace function fn_is_slot_freeing_status(p_status text)
returns boolean
language sql
immutable
as $$
  select p_status in ('Geannuleerd', 'Gearchiveerd');
$$;

create or replace function fn_range_blocked(p_range_start timestamptz, p_range_end timestamptz)
returns boolean
language sql
stable
as $$
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
    return;
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
    return;
  end if;

  if fn_range_blocked(p_date::timestamptz, (p_date + 1)::timestamptz) then
    return;
  end if;

  if v_rule_found and v_rule.is_available then
    v_window_start := v_rule.start_time;
    v_window_end := v_rule.end_time;
  else
    v_window_start := '07:00';
    v_window_end := '21:00';
  end if;

  v_candidate := v_window_start;
  while v_candidate + make_interval(mins => v_shoot.duration_minutes) <= v_window_end loop
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
begin
  select * into v_shoot from shoot_type_settings where shoot_type = v_shoot_type;
  if not found or (not v_shoot.is_bookable and not v_is_admin) then
    raise exception 'NOT_BOOKABLE';
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

  perform pg_advisory_xact_lock(hashtext(v_booking_date::text));

  if not exists (select 1 from fn_generate_day_slots(v_booking_date, v_shoot_type) s where s.slot_start = v_start_time)
     and not v_is_admin
  then
    raise exception 'SLOT_TAKEN';
  end if;

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

  insert into booking_status_history (booking_id, old_status, new_status, changed_by)
  values (v_new_row.id, null, v_new_row.status, v_source);

  return to_jsonb(v_new_row);
end;
$$;

grant execute on function book_slot(jsonb) to anon, authenticated;
grant execute on function get_available_slots(text, text, int, int, date) to service_role;

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

-- =============================================================================
-- Deel 2 — RLS-policies voor de 5 nieuwe tabellen (uit policies.sql)
-- =============================================================================

alter table availability_rules enable row level security;
create policy "availability_rules_admin_all" on availability_rules
  for all using (is_admin()) with check (is_admin());

alter table shoot_type_settings enable row level security;
create policy "shoot_type_settings_admin_all" on shoot_type_settings
  for all using (is_admin()) with check (is_admin());

alter table blocked_periods enable row level security;
create policy "blocked_periods_admin_all" on blocked_periods
  for all using (is_admin()) with check (is_admin());

alter table manual_slots enable row level security;
create policy "manual_slots_admin_all" on manual_slots
  for all using (is_admin()) with check (is_admin());

alter table booking_settings enable row level security;
create policy "booking_settings_admin_all" on booking_settings
  for all using (is_admin()) with check (is_admin());

-- =============================================================================
-- Deel 3 — seed-data (uit seed.sql)
-- =============================================================================

insert into availability_rules (day_of_week, start_time, end_time, break_start_time, break_end_time, is_available, max_bookings_per_day) values
(0, '09:00', '17:00', null, null, false, 3),
(1, '09:00', '17:00', null, null, false, 3),
(2, '09:00', '17:00', '12:30', '13:00', true, 3),
(3, '09:00', '17:00', '12:30', '13:00', true, 3),
(4, '09:00', '17:00', '12:30', '13:00', true, 3),
(5, '09:00', '17:00', '12:30', '13:00', true, 3),
(6, '09:00', '17:00', '12:30', '13:00', true, 3);

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

insert into booking_settings (min_days_notice, max_months_ahead, default_buffer_minutes, default_duration_minutes, allow_same_day_booking, booking_mode) values
(2, 6, 15, 60, false, 'request_only');
