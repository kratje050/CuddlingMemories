-- Werk bestaande FAQ-antwoorden bij en voeg de nieuwste klantfuncties toe.
update public.faq
set answer = 'Als een maand of dag vol zit, kun je je aanmelden voor de wachtlijst. Zodra er een passende plek vrijkomt, krijgt de eerstvolgende geschikte persoon automatisch een e-mail met een tijdelijke boekingslink.',
    category = 'Acties & shoots',
    is_visible = true,
    updated_at = now()
where lower(trim(question)) = lower('Hoe werkt de wachtlijst?');

update public.faq
set answer = 'Tijdens het boeken accepteer je de actuele annuleringsvoorwaarden. De gebruikte versie, datum, tijd en het e-mailadres worden bij de boeking opgeslagen. In het klantportaal kun je dit later teruglezen; je hoeft daar niet opnieuw te ondertekenen.',
    category = 'Klantportaal',
    is_visible = true,
    updated_at = now()
where lower(trim(question)) = lower('Hoe werkt de digitale overeenkomst?');

with additions(question, answer, category, sort_order) as (values
  ('Hoelang is een uitnodiging van de wachtlijst geldig?', 'Een automatische wachtlijstuitnodiging is 24 uur geldig. De aangeboden plek is pas definitief nadat je via de link een boekingsaanvraag hebt verstuurd en ik deze heb bevestigd. Reageer je niet op tijd, dan kan de volgende passende persoon worden benaderd.', 'Acties & shoots', 35),
  ('Wanneer moet ik de aanbetaling betalen?', 'Dit verschilt per pakket. Bij sommige pakketten wordt de aanbetaling direct na het boeken gevraagd; bij andere geldt een termijn vóór de shoot. Het bedrag en de uiterste betaaldatum staan in je klantportaal en op de factuur.', 'Klantportaal', 36),
  ('Wordt mijn aanbetaling van het totaalbedrag afgetrokken?', 'Ja. Zodra de aanbetaling als ontvangen is verwerkt, wordt deze automatisch van het volledige factuurbedrag afgetrokken. Je betaalt daarna alleen het resterende bedrag en dus nooit dubbel.', 'Klantportaal', 37),
  ('Wanneer moet het restbedrag betaald zijn?', 'Het betaalmoment staat per pakket ingesteld. Dit kan direct bij boeken, een aantal dagen vóór de shoot of een aantal dagen ná de daadwerkelijke shoot zijn. De actuele uiterste betaaldatum en het openstaande bedrag staan altijd in je klantportaal.', 'Klantportaal', 38),
  ('Hoe werkt de betaling bij een bevallingsshoot?', 'Bij een bevallingsshoot reserveert de aanbetaling de periode rond de uitgerekende datum. Omdat de werkelijke datum niet vooraf vaststaat, wordt het restbedrag uiterlijk zeven dagen na de daadwerkelijke bevalling of fotoshoot betaald. De galerij wordt definitief geleverd nadat het volledige bedrag is ontvangen.', 'Klantportaal', 39),
  ('Krijg ik herinneringsmails voor mijn shoot en betaling?', 'Ja. Voor geplande shoots kan ik automatisch voorbereidingstips en een herinnering sturen. Als een aanbetaling of factuur betaald moet worden, ontvang je rond de uiterste betaaldatum ook een betaalherinnering zolang de betaling nog niet als ontvangen staat.', 'Klantportaal', 40),
  ('Waarom staan er voorbereidingsvragen bij het boeken?', 'De vragen helpen mij om de shoot goed voor te bereiden. Je kunt bijvoorbeeld namen en leeftijden van kinderen, deelnemers, allergieën bij een cakesmash en andere bijzonderheden doorgeven. De velden zijn niet allemaal verplicht en kunnen later in het klantportaal worden aangevuld.', 'Klantportaal', 41),
  ('Wanneer verschijnt mijn galerij in het klantportaal?', 'Wanneer ik een galerij aanmaak met hetzelfde e-mailadres als je boeking, wordt deze automatisch aan je klantportaal gekoppeld. Zodra de galerij is gepubliceerd, kun je de foto''s daar openen en je favorieten kiezen.', 'Klantportaal', 42),
  ('Kan mijn galerij worden tegengehouden als er nog een bedrag openstaat?', 'Bij pakketten waarbij het restbedrag na de shoot betaald wordt, kan de definitieve galerij worden vrijgegeven nadat het volledige bedrag als ontvangen is verwerkt. In het klantportaal zie je welk bedrag nog openstaat.', 'Klantportaal', 43)
)
insert into public.faq (question, answer, category, sort_order, is_visible)
select a.question, a.answer, a.category, a.sort_order, true
from additions a
where not exists (
  select 1 from public.faq f where lower(trim(f.question)) = lower(trim(a.question))
);
