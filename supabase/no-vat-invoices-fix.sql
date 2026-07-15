-- Verwijder iedere btw-berekening uit bestaande facturen.
-- Dit bestand is idempotent en kan in een keer in de Supabase SQL Editor.

update invoices
set amount_excl = total_amount,
    vat_rate = 0,
    vat_amount = 0
where vat_rate <> 0
   or vat_amount <> 0
   or amount_excl <> total_amount;

notify pgrst, 'reload schema';
