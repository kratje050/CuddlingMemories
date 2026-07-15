-- Kies vanuit welk vertrekpunt nieuwe reiskosten worden berekend.
-- Veilig om opnieuw uit te voeren.

alter table public.travel_settings
  add column if not exists active_origin text not null default 'auto';

do $$ begin
  alter table public.travel_settings add constraint travel_settings_active_origin_check
    check (active_origin in ('auto', 'zoutkamp', 'gouda'));
exception when duplicate_object then null;
end $$;

update public.travel_settings
set active_origin = 'auto'
where active_origin is null or active_origin not in ('auto', 'zoutkamp', 'gouda');

notify pgrst, 'reload schema';
