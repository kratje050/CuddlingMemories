-- Cuddling Memories Fotografie — betaalgegevens toevoegen aan de
-- cadeaubon-bevestigingsmail. Voer dit één keer uit in de Supabase SQL
-- Editor (werkt de al bestaande template-rij bij, geen nieuwe insert).

update email_templates
set body = E'Hoi {{customer_name}},\n\nDank je wel voor je cadeaubon aanvraag van {{giftcard_amount}}. Ik neem contact met je op om de gegevens, betaling en verzending netjes af te stemmen.\n\nJe kunt het bedrag alvast overmaken naar:\nR Stavasius\nNL25 RABO 0316 0597 49\nOnder vermelding van: cadeaubon + je naam\n\nZodra de betaling binnen is, ontvang je de unieke cadeaubon-code. Na bevestiging en betaling is de cadeaubon geldig.'
where template_key = 'giftcard_received';
