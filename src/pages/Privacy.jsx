import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacybeleid"
        description="Lees hoe Cuddling Memories Fotografie omgaat met jouw persoonsgegevens bij een boekingsaanvraag."
      />
      <section className="pt-36">
        <div className="container-soft pb-16">
          <SectionTitle eyebrow="Privacy" title="Privacybeleid" />
          <div className="mx-auto mt-10 max-w-3xl space-y-6 text-sm leading-7 text-coffee/78">
            <p>
              Cuddling Memories Fotografie gaat zorgvuldig om met de persoonsgegevens die je via het boekingsformulier
              deelt. Hieronder lees je welke gegevens worden verwerkt, waarom, en hoe lang ze worden bewaard.
            </p>
            <div>
              <h2 className="display-title text-xl font-semibold text-coffee">Welke gegevens</h2>
              <p className="mt-2">
                Bij een boekingsaanvraag worden je naam, e-mailadres, gewenste shoot, gewenste periode, locatie en
                bericht verwerkt. Deze gegevens worden alleen gebruikt om je aanvraag te beantwoorden en een shoot met
                je in te plannen.
              </p>
            </div>
            <div>
              <h2 className="display-title text-xl font-semibold text-coffee">Bewaartermijn</h2>
              <p className="mt-2">
                Gegevens worden niet langer bewaard dan nodig is om je aanvraag af te handelen en, bij een geboekte
                shoot, de administratie rondom die boeking af te ronden.
              </p>
            </div>
            <div>
              <h2 className="display-title text-xl font-semibold text-coffee">Delen met derden</h2>
              <p className="mt-2">
                Je gegevens worden niet verkocht of gedeeld met derden voor marketingdoeleinden. Ze worden uitsluitend
                gebruikt voor het verzenden van de boekingsaanvraag naar Cuddling Memories Fotografie.
              </p>
            </div>
            <div>
              <h2 className="display-title text-xl font-semibold text-coffee">Jouw rechten</h2>
              <p className="mt-2">
                Je hebt het recht om inzage, correctie of verwijdering van je gegevens te vragen. Neem hiervoor contact
                op via het contactformulier.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
