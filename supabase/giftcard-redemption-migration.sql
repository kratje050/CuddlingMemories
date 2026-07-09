-- Cuddling Memories Fotografie — Cadeaubon-inwisseling
-- Bevat ALLEEN het nieuwe deel: koppelt een cadeaubon-code aan een echte
-- boeking. Voer dit één keer volledig uit in de Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- giftcards: koppeling naar de boeking waarvoor de bon verzilverd is.
-- ---------------------------------------------------------------------------
alter table giftcards
  add column if not exists redeemed_booking_id uuid references bookings(id) on delete set null;

-- ---------------------------------------------------------------------------
-- book_slot(): uitgebreid met optionele cadeaubon-verzilvering. Rij wordt
-- vergrendeld (for update) zodat twee gelijktijdige boekingen dezelfde code
-- nooit allebei kunnen verzilveren. Bij succes wordt de cadeaubon direct op
-- 'Gebruikt' gezet en aan de nieuwe boeking gekoppeld.
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
begin
  select * into v_shoot from shoot_type_settings where shoot_type = v_shoot_type;
  if not found or (not v_shoot.is_bookable and not v_is_admin) then
    raise exception 'NOT_BOOKABLE';
  end if;

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

  if v_giftcard_code is not null then
    update giftcards
      set status = 'Gebruikt', used_at = now(), redeemed_booking_id = v_new_row.id
      where id = v_giftcard.id;
  end if;

  insert into booking_status_history (booking_id, old_status, new_status, changed_by)
  values (v_new_row.id, null, v_new_row.status, v_source);

  return to_jsonb(v_new_row);
end;
$$;

grant execute on function book_slot(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- check_giftcard_code(): publieke, alleen-lezen check (geen verzilvering) —
-- gebruikt door de boekingswizard voor live feedback.
-- ---------------------------------------------------------------------------
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
