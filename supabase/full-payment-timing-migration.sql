-- Restbetaling voor, na of direct bij boeken.
-- Een uitgerekende datum is bij een bevalling alleen een plandatum. De
-- betaaltermijn na de shoot start pas zodra actual_shoot_date is ingevuld.

alter table packages
  add column if not exists full_payment_due_mode text not null default 'before_shoot'
    check (full_payment_due_mode in ('booking', 'before_shoot', 'after_shoot'));

alter table bookings
  add column if not exists full_payment_due_mode text
    check (full_payment_due_mode is null or full_payment_due_mode in ('booking', 'before_shoot', 'after_shoot')),
  add column if not exists actual_shoot_date date;

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
      new.full_payment_due_mode := null;
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
      new.full_payment_due_mode := v_package.full_payment_due_mode;
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

  new.full_payment_due_date := case
    when new.full_payment_due_mode = 'booking' then v_request_date
    when new.full_payment_due_mode = 'before_shoot' and new.booking_date is not null then
      greatest(new.booking_date - coalesce(new.full_payment_due_days_before_shoot, 0), v_request_date)
    when new.full_payment_due_mode = 'after_shoot' and new.actual_shoot_date is not null then
      new.actual_shoot_date + coalesce(new.full_payment_due_days_before_shoot, 0)
    else null
  end;

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
  before insert or update of package_id, booking_date, actual_shoot_date, deposit_status on bookings
  for each row execute function fn_snapshot_booking_deposit();

-- De aanbevolen standaard voor het bevallingspakket.
update packages
set deposit_type = 'percentage',
    deposit_value = 30,
    deposit_due_mode = 'booking',
    full_payment_due_mode = 'after_shoot',
    full_payment_due_days_before_shoot = 7
where lower(coalesce(nullif(shoot_type, ''), title)) = 'bevalling';

-- Bestaande bevallingsboekingen nemen dezelfde regel over. De einddatum blijft
-- leeg totdat de werkelijke shootdatum in de boeking is ingevuld.
update bookings b
set deposit_type = p.deposit_type,
    deposit_value = p.deposit_value,
    deposit_due_mode = p.deposit_due_mode,
    full_payment_due_mode = p.full_payment_due_mode,
    full_payment_due_days_before_shoot = p.full_payment_due_days_before_shoot,
    full_payment_due_date = case
      when b.actual_shoot_date is not null then b.actual_shoot_date + p.full_payment_due_days_before_shoot
      else null
    end
from packages p
where b.package_id = p.id
  and lower(coalesce(nullif(p.shoot_type, ''), p.title)) = 'bevalling';

update invoices i
set due_at = b.full_payment_due_date
from bookings b
where i.booking_id = b.id
  and b.full_payment_due_mode = 'after_shoot'
  and i.status <> 'Betaald'
  and coalesce(i.notes, '') like '%"automatic":true%';

-- Een galerij van een pakket met betaling na de shoot blijft afgeschermd
-- totdat de volledige factuur als Betaald is gemarkeerd.
create or replace function get_gallery_access(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gallery client_galleries%rowtype;
  v_photos jsonb;
  v_payment_locked boolean := false;
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

  if v_gallery.booking_id is not null then
    select coalesce(b.full_payment_due_mode = 'after_shoot' and not exists (
      select 1 from invoices i where i.booking_id = b.id and i.status = 'Betaald'
    ), false)
    into v_payment_locked
    from bookings b
    where b.id = v_gallery.booking_id;
  end if;

  if v_payment_locked then
    return jsonb_build_object('gallery', null, 'photos', '[]'::jsonb, 'payment_required', true);
  end if;

  select coalesce(jsonb_agg(to_jsonb(p) order by p.sort_order, p.created_at), '[]'::jsonb)
    into v_photos
  from gallery_photos p
  where p.gallery_id = v_gallery.id;

  return jsonb_build_object('gallery', to_jsonb(v_gallery), 'photos', v_photos);
end;
$$;

grant execute on function get_gallery_access(text) to anon, authenticated;

notify pgrst, 'reload schema';
