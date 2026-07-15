-- Aanbetalingsregels per pakket en een vaste momentopname per boeking.
-- Dit bestand is idempotent en kan in een keer in de Supabase SQL Editor.

alter table packages
  add column if not exists deposit_type text not null default 'none'
    check (deposit_type in ('none', 'fixed', 'percentage')),
  add column if not exists deposit_value numeric(10,2),
  add column if not exists deposit_due_days_before_shoot int not null default 7
    check (deposit_due_days_before_shoot >= 0),
  add column if not exists cancellation_terms text;

alter table bookings
  add column if not exists deposit_type text
    check (deposit_type is null or deposit_type in ('none', 'fixed', 'percentage')),
  add column if not exists deposit_value numeric(10,2),
  add column if not exists deposit_amount numeric(10,2),
  add column if not exists deposit_due_days_before_shoot int,
  add column if not exists deposit_due_date date,
  add column if not exists cancellation_terms text,
  add column if not exists deposit_status text not null default 'Niet gevraagd'
    check (deposit_status in ('Niet gevraagd', 'Gevraagd', 'Betaald', 'Terugbetaald', 'Vervallen')),
  add column if not exists deposit_paid_at timestamptz;

create or replace function fn_snapshot_booking_deposit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_package packages%rowtype;
begin
  if new.package_id is null then
    if tg_op = 'INSERT' or new.package_id is distinct from old.package_id then
      new.deposit_type := 'none';
      new.deposit_value := null;
      new.deposit_amount := null;
      new.deposit_due_days_before_shoot := null;
      new.deposit_due_date := null;
      new.cancellation_terms := null;
      new.deposit_status := 'Niet gevraagd';
      new.deposit_paid_at := null;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT'
     or new.package_id is distinct from old.package_id
     or old.deposit_type is null then
    select * into v_package from packages where id = new.package_id;

    if found then
      new.deposit_type := v_package.deposit_type;
      new.deposit_value := v_package.deposit_value;
      new.deposit_due_days_before_shoot := v_package.deposit_due_days_before_shoot;
      new.cancellation_terms := v_package.cancellation_terms;

      new.deposit_amount := case v_package.deposit_type
        when 'fixed' then least(coalesce(v_package.deposit_value, 0), v_package.price)
        when 'percentage' then round(v_package.price * coalesce(v_package.deposit_value, 0) / 100, 2)
        else null
      end;

      if v_package.deposit_type = 'none' then
        new.deposit_status := 'Niet gevraagd';
      end if;
    end if;
  end if;

  if new.booking_date is not null
     and new.deposit_type is distinct from 'none'
     and new.deposit_due_days_before_shoot is not null then
    -- Bij een last-minute aanvraag kan de normale pakkettermijn al verstreken
    -- zijn. De klant krijgt daarom nooit een deadline van voor de aanvraagdag.
    new.deposit_due_date := greatest(
      new.booking_date - new.deposit_due_days_before_shoot,
      coalesce(
        (new.created_at at time zone 'Europe/Amsterdam')::date,
        (now() at time zone 'Europe/Amsterdam')::date
      )
    );
  else
    new.deposit_due_date := null;
  end if;

  if new.deposit_status = 'Betaald' and new.deposit_paid_at is null then
    new.deposit_paid_at := now();
  elsif tg_op = 'UPDATE' and new.deposit_status <> 'Betaald' and old.deposit_status = 'Betaald' then
    new.deposit_paid_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_snapshot_booking_deposit on bookings;
create trigger trg_snapshot_booking_deposit
  before insert or update of package_id, booking_date, deposit_status on bookings
  for each row execute function fn_snapshot_booking_deposit();

-- Vul bestaande boekingen met pakketregels zonder handmatig herstelwerk.
update bookings
set package_id = package_id
where package_id is not null and deposit_type is null;

-- Herstel bestaande last-minute boekingen waarvan de betaaldeadline al voor
-- de aanvraagdatum terechtkwam. De taken-trigger wordt hierdoor ook bijgewerkt.
update bookings
set deposit_due_date = greatest(
  booking_date - deposit_due_days_before_shoot,
  coalesce(
    (created_at at time zone 'Europe/Amsterdam')::date,
    (now() at time zone 'Europe/Amsterdam')::date
  )
)
where booking_date is not null
  and deposit_type is distinct from 'none'
  and deposit_due_days_before_shoot is not null
  and deposit_due_date is distinct from greatest(
    booking_date - deposit_due_days_before_shoot,
    coalesce(
      (created_at at time zone 'Europe/Amsterdam')::date,
      (now() at time zone 'Europe/Amsterdam')::date
    )
  );

-- Laat de Supabase REST API de nieuwe kolommen meteen opnieuw inlezen.
notify pgrst, 'reload schema';
