-- Voorkom dat een bewust door een admin verwijderde automatische factuur
-- bij de volgende klantportaal-load meteen opnieuw wordt aangemaakt.
-- Veilig om opnieuw uit te voeren.

alter table public.bookings
  add column if not exists auto_invoice_disabled boolean not null default false;

notify pgrst, 'reload schema';
