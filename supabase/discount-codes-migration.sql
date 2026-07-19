-- Cuddling Memories Fotografie — Kortingscodes
-- Bevat ALLEEN het nieuwe deel: een herbruikbare, door de klant zelf in te
-- voeren kortingscode die de aanbetaling en het totaalbedrag van een boeking
-- verlaagt. Voer dit één keer volledig uit in de Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- discount_codes: door de admin beheerde kortingscodes.
-- ---------------------------------------------------------------------------
create table if not exists discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'vast_bedrag')),
  discount_value numeric(10,2) not null,
  usage_limit integer,
  times_used integer not null default 0,
  is_active boolean not null default true,
  expires_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Hergebruikt de bestaande set_updated_at()-trigger-functie uit schema.sql
-- (ook gebruikt door o.a. giftcards).
drop trigger if exists trg_discount_codes_updated_at on discount_codes;
create trigger trg_discount_codes_updated_at
  before update on discount_codes
  for each row execute function set_updated_at();

alter table discount_codes enable row level security;

drop policy if exists "discount_codes_admin_all" on discount_codes;
create policy "discount_codes_admin_all" on discount_codes
  for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- bookings: koppeling naar de toegepaste kortingscode + het bedrag dat
-- daadwerkelijk is afgetrokken van budget/aanbetaling (berekend server-side
-- in create-booking.ts zodra pakket + add-ons bekend zijn).
-- ---------------------------------------------------------------------------
alter table bookings
  add column if not exists discount_code_id uuid references discount_codes(id) on delete set null,
  add column if not exists discount_code text,
  add column if not exists discount_amount numeric(10,2);

-- ---------------------------------------------------------------------------
-- book_slot(): uitgebreid met optionele kortingscode-verzilvering, naast de
-- bestaande cadeaubon-logica. Rij wordt vergrendeld (for update) zodat twee
-- gelijktijdige boekingen een usage_limit nooit allebei nog net kunnen
-- halen. Het daadwerkelijke kortingsbedrag (afhankelijk van pakket + addons)
-- wordt pas ná deze functie server-side berekend in create-booking.ts.
-- ---------------------------------------------------------------------------
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
  v_discount_code text := nullif(trim(p_payload->>'discount_code'), '');
  v_discount discount_codes%rowtype;
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

  -- Kortingscode (optioneel): zelfde vergrendel-patroon, zodat een
  -- usage_limit nooit door twee gelijktijdige boekingen tegelijk overschreden
  -- kan worden.
  if v_discount_code is not null then
    select * into v_discount from discount_codes where code = v_discount_code for update;
    if not found then
      raise exception 'DISCOUNT_INVALID';
    end if;
    if not v_discount.is_active then
      raise exception 'DISCOUNT_NOT_ACTIVE';
    end if;
    if v_discount.expires_at is not null and v_discount.expires_at < current_date then
      raise exception 'DISCOUNT_EXPIRED';
    end if;
    if v_discount.usage_limit is not null and v_discount.times_used >= v_discount.usage_limit then
      raise exception 'DISCOUNT_LIMIT_REACHED';
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
    preferred_date, preferred_period, admin_notes,
    discount_code_id, discount_code
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
    nullif(p_payload->>'admin_notes', ''),
    v_discount.id,
    v_discount_code
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

  if v_discount_code is not null then
    update discount_codes
      set times_used = times_used + 1, updated_at = now()
      where id = v_discount.id;
  end if;

  insert into booking_status_history (booking_id, old_status, new_status, changed_by)
  values (v_new_row.id, null, v_new_row.status, v_source);

  -- giftcard_amount/giftcard_type worden meegegeven zodat de aanroepende
  -- Netlify Function (create-booking.ts) dit direct in de bevestigingsmail
  -- aan klant én admin kan vermelden, zonder een tweede round-trip. Voor de
  -- kortingscode is dat niet nodig: discount_code_id/discount_code staan al
  -- als gewone kolommen op v_new_row, en het daadwerkelijke bedrag wordt pas
  -- bekend zodra create-booking.ts het pakket + de add-ons heeft opgehaald.
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

-- ---------------------------------------------------------------------------
-- check_discount_code(): publieke, alleen-lezen check (geen verzilvering) —
-- gebruikt door de boekingswizard voor live feedback vóórdat de klant
-- daadwerkelijk boekt. discount_codes zelf is admin-only (RLS), vandaar
-- security definer, en er wordt bewust alleen het strikt noodzakelijke
-- teruggegeven.
-- ---------------------------------------------------------------------------
create or replace function check_discount_code(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_discount discount_codes%rowtype;
  v_code text := nullif(trim(p_code), '');
begin
  if v_code is null then
    return jsonb_build_object('valid', false, 'reason', 'DISCOUNT_INVALID');
  end if;

  select * into v_discount from discount_codes where code = v_code;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'DISCOUNT_INVALID');
  end if;
  if not v_discount.is_active then
    return jsonb_build_object('valid', false, 'reason', 'DISCOUNT_NOT_ACTIVE');
  end if;
  if v_discount.expires_at is not null and v_discount.expires_at < current_date then
    return jsonb_build_object('valid', false, 'reason', 'DISCOUNT_EXPIRED');
  end if;
  if v_discount.usage_limit is not null and v_discount.times_used >= v_discount.usage_limit then
    return jsonb_build_object('valid', false, 'reason', 'DISCOUNT_LIMIT_REACHED');
  end if;

  return jsonb_build_object(
    'valid', true,
    'discount_type', v_discount.discount_type,
    'discount_value', v_discount.discount_value
  );
end;
$$;

grant execute on function check_discount_code(text) to anon, authenticated;
