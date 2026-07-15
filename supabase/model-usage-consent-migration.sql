-- Leg aantoonbaar vast dat een klant met modelkorting toestemming gaf voor
-- gebruik van de foto's op social media en in het portfolio.
-- Veilig om opnieuw uit te voeren.

alter table public.bookings
  add column if not exists model_usage_consent boolean not null default false,
  add column if not exists model_usage_consent_at timestamptz,
  add column if not exists model_usage_consent_version text;

notify pgrst, 'reload schema';
