-- Beveiligd klantportaal, overeenkomsten, facturen, betalingen en verplaatsingsverzoeken.
-- Veilig om opnieuw uit te voeren in de Supabase SQL Editor.

alter table bookings
  add column if not exists portal_token text,
  add column if not exists portal_enabled boolean not null default true,
  add column if not exists portal_expires_at timestamptz,
  add column if not exists contract_title text not null default 'Overeenkomst fotoshoot',
  add column if not exists contract_version text not null default '2026-07-11-v1',
  add column if not exists contract_text text,
  add column if not exists contract_signed_at timestamptz,
  add column if not exists contract_signer_name text,
  add column if not exists contract_signature_ip text,
  add column if not exists contract_signature_user_agent text,
  add column if not exists questionnaire_locked boolean not null default false,
  add column if not exists deposit_payment_method text check (deposit_payment_method is null or deposit_payment_method in ('bank_transfer', 'cash')),
  add column if not exists deposit_payment_reference text,
  add column if not exists full_payment_method text check (full_payment_method is null or full_payment_method in ('bank_transfer', 'cash'));

update bookings
set deposit_payment_method = 'bank_transfer'
where coalesce(deposit_amount, 0) > 0
  and deposit_status is distinct from 'Betaald';

drop index if exists idx_bookings_mollie_payment;
alter table bookings
  drop column if exists mollie_payment_id,
  drop column if exists deposit_payment_url;

update bookings
set portal_token = encode(gen_random_bytes(32), 'hex')
where portal_token is null or length(portal_token) < 32;

alter table bookings alter column portal_token set default encode(gen_random_bytes(32), 'hex');
alter table bookings alter column portal_token set not null;
create unique index if not exists idx_bookings_portal_token on bookings (portal_token);
update bookings
set deposit_payment_reference = 'CM-' || upper(substr(replace(id::text, '-', ''), 1, 10))
where deposit_payment_reference is null;

create or replace function fn_set_booking_payment_reference()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.deposit_payment_reference is null then
    new.deposit_payment_reference := 'CM-' || upper(substr(replace(new.id::text, '-', ''), 1, 10));
  end if;
  return new;
end;
$$;
drop trigger if exists trg_set_booking_payment_reference on bookings;
create trigger trg_set_booking_payment_reference before insert on bookings
  for each row execute function fn_set_booking_payment_reference();

alter table client_galleries
  add column if not exists booking_id uuid references bookings(id) on delete set null;
create index if not exists idx_client_galleries_booking_id on client_galleries (booking_id);

create table if not exists booking_change_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  request_type text not null default 'reschedule' check (request_type in ('reschedule', 'cancel', 'other')),
  preferred_date date,
  preferred_period text,
  reason text,
  status text not null default 'Nieuw' check (status in ('Nieuw', 'In behandeling', 'Goedgekeurd', 'Afgewezen', 'Afgerond')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_booking_change_requests_booking on booking_change_requests (booking_id, created_at desc);
drop trigger if exists trg_booking_change_requests_updated_at on booking_change_requests;
create trigger trg_booking_change_requests_updated_at before update on booking_change_requests
  for each row execute function set_updated_at();

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  invoice_number text not null unique,
  title text not null default 'Fotoshoot',
  description text,
  amount_excl numeric(10,2) not null default 0,
  vat_rate numeric(5,2) not null default 0,
  vat_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  issued_at date not null default current_date,
  due_at date,
  status text not null default 'Concept' check (status in ('Concept', 'Verzonden', 'Betaald', 'Vervallen', 'Gecrediteerd')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_invoices_booking on invoices (booking_id, issued_at desc);
drop trigger if exists trg_invoices_updated_at on invoices;
create trigger trg_invoices_updated_at before update on invoices
  for each row execute function set_updated_at();

-- Cuddling Memories berekent geen btw op facturen. Houd ook bestaande
-- facturen gelijk aan het totaalbedrag zonder btw-uitsplitsing.
update invoices
set amount_excl = total_amount,
    vat_rate = 0,
    vat_amount = 0
where vat_rate <> 0
   or vat_amount <> 0
   or amount_excl <> total_amount;

create table if not exists payment_transactions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  invoice_id uuid references invoices(id) on delete set null,
  provider text not null default 'bank_transfer' check (provider in ('bank_transfer', 'cash')),
  provider_payment_id text unique,
  payment_type text not null default 'deposit' check (payment_type in ('deposit', 'invoice', 'extra_images', 'other')),
  amount numeric(10,2) not null,
  currency text not null default 'EUR',
  status text not null default 'open',
  checkout_url text,
  provider_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table payment_transactions alter column provider set default 'bank_transfer';
delete from payment_transactions where provider = 'mollie';
create index if not exists idx_payment_transactions_booking on payment_transactions (booking_id, created_at desc);
drop trigger if exists trg_payment_transactions_updated_at on payment_transactions;
create trigger trg_payment_transactions_updated_at before update on payment_transactions
  for each row execute function set_updated_at();

create table if not exists client_portal_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  event_type text not null,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_client_portal_events_booking on client_portal_events (booking_id, created_at desc);

alter table booking_change_requests enable row level security;
alter table invoices enable row level security;
alter table payment_transactions enable row level security;
alter table client_portal_events enable row level security;

drop policy if exists "booking_change_requests_admin_all" on booking_change_requests;
create policy "booking_change_requests_admin_all" on booking_change_requests for all using (is_admin()) with check (is_admin());
drop policy if exists "invoices_admin_all" on invoices;
create policy "invoices_admin_all" on invoices for all using (is_admin()) with check (is_admin());
drop policy if exists "payment_transactions_admin_all" on payment_transactions;
create policy "payment_transactions_admin_all" on payment_transactions for all using (is_admin()) with check (is_admin());
drop policy if exists "client_portal_events_admin_all" on client_portal_events;
create policy "client_portal_events_admin_all" on client_portal_events for all using (is_admin()) with check (is_admin());

insert into email_templates (template_key, label, subject, body, is_active)
values
  ('client_portal_ready', 'Klantportaal beschikbaar', 'Je persoonlijke klantportaal staat klaar', E'Hoi {{customer_name}},\n\nVia onderstaande beveiligde link vind je alles rond je {{shoot_type}} bij elkaar:\n{{portal_link}}\n\nBewaar deze link goed en deel hem niet openbaar.', true),
  ('admin_reschedule_requested', 'Verplaatsingsverzoek ontvangen admin', 'Verplaatsingsverzoek van {{customer_name}}', E'Er is een verzoek om een fotoshoot te verplaatsen.\n\nKlant: {{customer_name}}\nShoot: {{shoot_type}}\nGewenste datum: {{preferred_date}}\nVoorkeur: {{preferred_period}}\nReden: {{reason}}\n\nOpen de boeking: {{admin_link}}', true)
on conflict (template_key) do nothing;

insert into faq (question, answer, category, is_visible, sort_order)
select new_faq.question, new_faq.answer, 'Klantportaal', true, new_faq.sort_order
from (values
  ('Wat is het klantportaal?', 'Het klantportaal is jouw beveiligde omgeving voor de fotoshoot. Je ziet er de afspraak, voortgang, voorbereiding, overeenkomst, betaalwijze, facturen en later je online galerij.', 210),
  ('Hoe krijg ik toegang tot mijn klantportaal?', 'Na een nieuwe boekingsaanvraag kun je het portaal openen vanaf de bedankpagina. Ik kan de unieke beveiligde link ook per e-mail versturen. Bewaar deze link goed en deel hem niet openbaar.', 211),
  ('Wat moet ik doen als ik mijn klantportaallink kwijt ben?', 'Neem contact met mij op via de contactpagina. Ik kan de beveiligde link opnieuw naar het e-mailadres van de boeking sturen.', 212),
  ('Kan ik mijn voorbereidingsvragen later aanvullen?', 'Ja. In het klantportaal kun je de voorbereidingsvragen later aanvullen en opslaan. Zodra de voorbereiding is vergrendeld, kun je de antwoorden alleen nog bekijken.', 213),
  ('Hoe kan ik mijn aanbetaling voldoen?', 'De aanbetaling wordt altijd via bankoverschrijving voldaan. In het klantportaal zie je het bedrag, IBAN, rekeninghouder en jouw unieke betalingskenmerk. Voor het resterende bedrag kun je kiezen tussen bankoverschrijving en contant betalen.', 214),
  ('Wanneer staat mijn bankoverschrijving als betaald?', 'Een bankoverschrijving wordt na ontvangst handmatig gecontroleerd en daarna in het klantportaal als betaald gemarkeerd. Dit kan daardoor iets later zichtbaar zijn dan de overschrijving zelf.', 215),
  ('Hoe werkt de digitale overeenkomst?', 'Je leest de overeenkomst in het klantportaal, vult je volledige naam in en bevestigt dat je akkoord gaat. De gebruikte versie, naam, datum en tijd van ondertekening worden bij de boeking bewaard.', 216),
  ('Waar kan ik mijn facturen vinden?', 'Facturen verschijnen in het klantportaal zodra ze zijn aangemaakt. Je kunt iedere factuur daar als PDF bekijken en downloaden.', 217),
  ('Kan ik via het klantportaal een andere datum aanvragen?', 'Ja. Je kunt een gewenste nieuwe datum, dagdeel en toelichting doorgeven. De bestaande afspraak verandert pas nadat ik het verzoek heb bekeken en bevestigd.', 218)
) as new_faq(question, answer, sort_order)
where not exists (select 1 from faq existing where lower(existing.question) = lower(new_faq.question));

notify pgrst, 'reload schema';
