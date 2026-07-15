-- Betaalmoment van de aanbetaling en vervaldatum van het volledige bedrag.
-- Dit bestand is idempotent en kan in een keer in de Supabase SQL Editor.

alter table packages
  add column if not exists deposit_due_mode text not null default 'before_shoot'
    check (deposit_due_mode in ('booking', 'before_shoot')),
  add column if not exists full_payment_due_days_before_shoot int not null default 0
    check (full_payment_due_days_before_shoot >= 0);

alter table bookings
  add column if not exists deposit_due_mode text
    check (deposit_due_mode is null or deposit_due_mode in ('booking', 'before_shoot')),
  add column if not exists full_payment_due_days_before_shoot int,
  add column if not exists full_payment_due_date date;

create or replace function fn_snapshot_booking_deposit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_package packages%rowtype;
  v_request_date date;
begin
  v_request_date := coalesce(
    (new.created_at at time zone 'Europe/Amsterdam')::date,
    (now() at time zone 'Europe/Amsterdam')::date
  );
  if new.package_id is null then
    if tg_op = 'INSERT' or new.package_id is distinct from old.package_id then
      new.deposit_type := 'none';
      new.deposit_value := null;
      new.deposit_amount := null;
      new.deposit_due_mode := null;
      new.deposit_due_days_before_shoot := null;
      new.deposit_due_date := null;
      new.full_payment_due_days_before_shoot := null;
      new.full_payment_due_date := null;
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
      new.deposit_due_mode := v_package.deposit_due_mode;
      new.deposit_due_days_before_shoot := v_package.deposit_due_days_before_shoot;
      new.full_payment_due_days_before_shoot := v_package.full_payment_due_days_before_shoot;
      new.cancellation_terms := v_package.cancellation_terms;
      new.deposit_amount := case v_package.deposit_type
        when 'fixed' then least(coalesce(v_package.deposit_value, 0), v_package.price)
        when 'percentage' then round(v_package.price * coalesce(v_package.deposit_value, 0) / 100, 2)
        else null
      end;
      if v_package.deposit_type = 'none' then
        new.deposit_status := 'Niet gevraagd';
      elsif v_package.deposit_due_mode = 'booking' then
        new.deposit_status := 'Gevraagd';
      end if;
    end if;
  end if;

  if new.booking_date is not null and new.deposit_type is distinct from 'none' then
    new.deposit_due_date := case
      when new.deposit_due_mode = 'booking' then v_request_date
      when new.deposit_due_days_before_shoot is not null then greatest(new.booking_date - new.deposit_due_days_before_shoot, v_request_date)
      else null
    end;
  else
    new.deposit_due_date := null;
  end if;

  if new.booking_date is not null and new.full_payment_due_days_before_shoot is not null then
    new.full_payment_due_date := greatest(new.booking_date - new.full_payment_due_days_before_shoot, v_request_date);
  else
    new.full_payment_due_date := null;
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

-- Bestaande boekingen krijgen een momentopname van hun huidige pakketregel.
update bookings b
set
  deposit_due_mode = coalesce(b.deposit_due_mode, p.deposit_due_mode),
  full_payment_due_days_before_shoot = coalesce(b.full_payment_due_days_before_shoot, p.full_payment_due_days_before_shoot),
  full_payment_due_date = case
    when b.booking_date is null then null
    else greatest(
      b.booking_date - coalesce(b.full_payment_due_days_before_shoot, p.full_payment_due_days_before_shoot),
      coalesce((b.created_at at time zone 'Europe/Amsterdam')::date, (now() at time zone 'Europe/Amsterdam')::date)
    )
  end,
  deposit_due_date = case
    when b.booking_date is null or b.deposit_type is not distinct from 'none' then null
    when coalesce(b.deposit_due_mode, p.deposit_due_mode) = 'booking' then
      coalesce((b.created_at at time zone 'Europe/Amsterdam')::date, (now() at time zone 'Europe/Amsterdam')::date)
    else greatest(
      b.booking_date - coalesce(b.deposit_due_days_before_shoot, p.deposit_due_days_before_shoot),
      coalesce((b.created_at at time zone 'Europe/Amsterdam')::date, (now() at time zone 'Europe/Amsterdam')::date)
    )
  end
from packages p
where b.package_id = p.id;

-- Laat bestaande automatische facturen dezelfde opgeslagen betaaltermijn volgen.
update invoices i
set due_at = b.full_payment_due_date
from bookings b
where i.booking_id = b.id
  and b.full_payment_due_date is not null
  and i.status <> 'Betaald'
  and coalesce(i.notes, '') like '%"automatic":true%';

notify pgrst, 'reload schema';
