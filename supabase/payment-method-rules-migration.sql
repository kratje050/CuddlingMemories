-- Aanbetalingen verplicht per bank; restbedrag per bank of contant.
-- Veilig om opnieuw uit te voeren.

alter table public.bookings
  add column if not exists full_payment_method text;

do $$ begin
  alter table public.bookings add constraint bookings_full_payment_method_check
    check (full_payment_method is null or full_payment_method in ('bank_transfer', 'cash'));
exception when duplicate_object then null;
end $$;

update public.bookings
set deposit_payment_method = 'bank_transfer'
where coalesce(deposit_amount, 0) > 0
  and deposit_status is distinct from 'Betaald';

update public.faq
set answer = 'De aanbetaling wordt altijd via bankoverschrijving voldaan. In het klantportaal zie je het bedrag, IBAN, rekeninghouder en jouw unieke betalingskenmerk. Voor het resterende bedrag kun je kiezen tussen bankoverschrijving en contant betalen.'
where lower(question) = lower('Hoe kan ik mijn aanbetaling voldoen?');

notify pgrst, 'reload schema';
