-- Taken, vragenlijst en aantoonbare acceptatie van annuleringsvoorwaarden.
-- Veilig om opnieuw uit te voeren in de Supabase SQL Editor.

create table if not exists legal_terms_versions (
  version text primary key,
  title text not null,
  content text not null,
  effective_from date not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

insert into legal_terms_versions (version, title, content, effective_from, is_active)
values (
  '2026-07-11-v1',
  'Annuleringsvoorwaarden',
  E'Een fotoshoot kan alleen schriftelijk of per e-mail worden geannuleerd of verplaatst.\n\nMeer dan 14 dagen voor de fotoshoot: de aanbetaling wordt niet terugbetaald. De afspraak mag één keer kosteloos worden verplaatst.\n\nTussen 7 en 14 dagen voor de fotoshoot: 50% van het afgesproken totaalbedrag blijft verschuldigd.\n\nTussen 48 uur en 7 dagen voor de fotoshoot: 75% van het afgesproken totaalbedrag blijft verschuldigd.\n\nBinnen 48 uur voor de fotoshoot of bij niet verschijnen: het volledige afgesproken bedrag blijft verschuldigd.\n\nBij ziekte of een onverwachte noodsituatie zoeken we in overleg naar een passende oplossing. Neem hiervoor zo snel mogelijk contact op.\n\nBij slecht weer kan een buitenshoot in overleg kosteloos worden verplaatst. Cuddling Memories beoordeelt samen met de klant of de weersomstandigheden geschikt zijn voor de fotoshoot.\n\nWanneer Cuddling Memories de fotoshoot zelf moet annuleren, wordt er een nieuwe datum afgesproken. Wanneer dit niet mogelijk is, worden reeds betaalde bedragen volledig terugbetaald.\n\nDeze annuleringsvoorwaarden laten de wettelijke rechten van de klant onverlet.',
  '2026-07-11',
  true
)
on conflict (version) do update set
  title = excluded.title,
  content = excluded.content,
  effective_from = excluded.effective_from,
  is_active = excluded.is_active;

update legal_terms_versions set is_active = (version = '2026-07-11-v1');

alter table bookings
  add column if not exists terms_version text references legal_terms_versions(version),
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_accepted_by text,
  add column if not exists questionnaire_answers jsonb not null default '{}'::jsonb;

create table if not exists booking_tasks (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  task_key text,
  title text not null,
  description text,
  due_date date,
  status text not null default 'open' check (status in ('open', 'done', 'skipped')),
  completed_at timestamptz,
  completed_by text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, task_key)
);

create index if not exists idx_booking_tasks_booking_id on booking_tasks (booking_id, sort_order);
create index if not exists idx_booking_tasks_due_date on booking_tasks (due_date) where status = 'open';

drop trigger if exists trg_booking_tasks_updated_at on booking_tasks;
create trigger trg_booking_tasks_updated_at
  before update on booking_tasks
  for each row execute function set_updated_at();

create or replace function fn_sync_booking_tasks()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  insert into booking_tasks (booking_id, task_key, title, description, due_date, sort_order)
  values (new.id, 'review_request', 'Aanvraag beoordelen', 'Controleer gegevens, wensen, vragenlijst en beschikbaarheid.', coalesce(new.created_at::date, current_date), 10)
  on conflict (booking_id, task_key) do update set
    title = excluded.title,
    description = excluded.description,
    due_date = case when booking_tasks.status = 'open' then excluded.due_date else booking_tasks.due_date end;

  if new.deposit_amount is not null and new.deposit_amount > 0 then
    insert into booking_tasks (booking_id, task_key, title, description, due_date, sort_order)
    values (new.id, 'deposit', 'Aanbetaling controleren', 'Controleer of de aanbetaling is gevraagd en op tijd is ontvangen.', new.deposit_due_date, 20)
    on conflict (booking_id, task_key) do update set
      due_date = case when booking_tasks.status = 'open' then excluded.due_date else booking_tasks.due_date end;
  else
    delete from booking_tasks where booking_id = new.id and task_key = 'deposit' and status = 'open';
  end if;

  if new.booking_date is not null then
    insert into booking_tasks (booking_id, task_key, title, description, due_date, sort_order) values
      (new.id, 'prepare', 'Shoot voorbereiden', 'Controleer locatie, materialen, styling, vragenlijst en bijzonderheden.', new.booking_date - 3, 30),
      (new.id, 'shoot', 'Fotoshoot uitvoeren', 'Controleer voor vertrek of alle apparatuur, kaarten en accessoires klaarstaan.', new.booking_date, 40),
      (new.id, 'backup', 'Foto’s back-uppen en selectie starten', 'Maak minimaal één extra back-up en start de eerste selectie.', new.booking_date + 1, 50),
      (new.id, 'edit', 'Foto’s bewerken', 'Werk de geselecteerde beelden af in de afgesproken stijl.', new.booking_date + 7, 60),
      (new.id, 'gallery', 'Galerij opleveren', 'Maak of publiceer de klantgalerij en verstuur de galerijmail.', new.booking_date + 14, 70),
      (new.id, 'follow_up', 'Nazorg en reviewverzoek', 'Controleer de fotokeuze, extra beelden en stuur eventueel een reviewverzoek.', new.booking_date + 21, 80)
    on conflict (booking_id, task_key) do update set
      title = excluded.title,
      description = excluded.description,
      due_date = case when booking_tasks.status = 'open' then excluded.due_date else booking_tasks.due_date end,
      sort_order = excluded.sort_order;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_booking_tasks on bookings;
create trigger trg_sync_booking_tasks
  after insert or update of booking_date, deposit_amount, deposit_due_date on bookings
  for each row execute function fn_sync_booking_tasks();

-- Maak ook taken aan voor bestaande boekingen.
update bookings set booking_date = booking_date;

alter table legal_terms_versions enable row level security;
alter table booking_tasks enable row level security;

drop policy if exists "legal_terms_public_read" on legal_terms_versions;
create policy "legal_terms_public_read" on legal_terms_versions
  for select using (is_active = true or is_admin());

drop policy if exists "legal_terms_admin_write" on legal_terms_versions;
create policy "legal_terms_admin_write" on legal_terms_versions
  for all using (is_admin()) with check (is_admin());

drop policy if exists "booking_tasks_admin_all" on booking_tasks;
create policy "booking_tasks_admin_all" on booking_tasks
  for all using (is_admin()) with check (is_admin());

notify pgrst, 'reload schema';

