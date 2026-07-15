-- Stel per hoofdpakket in of het gekozen kan worden voor een portfolioshoot
-- met 50% modelkorting. Bevalling is altijd uitgesloten.
-- Veilig om opnieuw uit te voeren.

alter table public.packages
  add column if not exists model_discount_eligible boolean not null default false;

update public.packages
set model_discount_eligible = true
where price_unit = 'shoot'
  and coalesce(is_addon, false) = false
  and lower(coalesce(title, '') || ' ' || coalesce(shoot_type, '')) not like '%bevalling%'
  and not (
    lower(coalesce(title, '') || ' ' || coalesce(shoot_type, '')) like '%model%'
    and lower(coalesce(title, '') || ' ' || coalesce(shoot_type, '')) like '%korting%'
  );

update public.packages
set model_discount_eligible = false
where lower(coalesce(title, '') || ' ' || coalesce(shoot_type, '')) like '%bevalling%'
   or coalesce(is_addon, false) = true;

notify pgrst, 'reload schema';
