-- Maakt het aantal zichtbare albums op de openbare portfoliopagina instelbaar.
alter table public.site_settings
  add column if not exists portfolio_album_limit integer not null default 6;

alter table public.site_settings
  drop constraint if exists site_settings_portfolio_album_limit_check;

alter table public.site_settings
  add constraint site_settings_portfolio_album_limit_check
  check (portfolio_album_limit between 1 and 24);
