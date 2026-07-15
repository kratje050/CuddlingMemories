import { CalendarClock, CloudRain, Mail, ShieldCheck } from "lucide-react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { CANCELLATION_TERMS_EFFECTIVE_DATE, CANCELLATION_TERMS_VERSION } from "../data/legalTerms.js";

const cancellationSteps = [
  {
    period: "Meer dan 14 dagen voor de fotoshoot",
    condition: "De aanbetaling wordt niet terugbetaald. De afspraak mag één keer kosteloos worden verplaatst.",
  },
  {
    period: "Tussen 7 en 14 dagen voor de fotoshoot",
    condition: "50% van het afgesproken totaalbedrag blijft verschuldigd.",
  },
  {
    period: "Tussen 48 uur en 7 dagen voor de fotoshoot",
    condition: "75% van het afgesproken totaalbedrag blijft verschuldigd.",
  },
  {
    period: "Binnen 48 uur of bij niet verschijnen",
    condition: "Het volledige afgesproken bedrag blijft verschuldigd.",
  },
];

export default function CancellationTerms() {
  return (
    <>
      <SEO
        title="Annuleringsvoorwaarden"
        description="Lees de voorwaarden voor het annuleren of verplaatsen van een fotoshoot bij Cuddling Memories Fotografie."
      />
      <section className="pt-36 pb-20">
        <div className="container-soft">
          <SectionTitle
            eyebrow="Afspraken"
            title="Annuleren of verplaatsen"
            text="Een fotoshoot kan alleen schriftelijk of per e-mail worden geannuleerd of verplaatst. Hieronder lees je welke voorwaarden daarbij gelden."
          />
          <p className="mx-auto mt-4 max-w-4xl text-center text-xs font-semibold uppercase tracking-[0.12em] text-cocoa/70">
            Versie {CANCELLATION_TERMS_VERSION} · geldig vanaf {CANCELLATION_TERMS_EFFECTIVE_DATE}
          </p>

          <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-lg bg-card shadow-soft warm-border">
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.7fr_1.3fr] lg:p-10">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-linen text-cocoa">
                  <CalendarClock size={23} />
                </span>
                <h2 className="display-title mt-4 text-3xl font-semibold text-coffee">Bij annulering</h2>
                <p className="mt-3 text-sm leading-7 text-coffee/70">
                  Hoe dichter de shootdatum nadert, hoe groter het deel van het afgesproken totaalbedrag dat verschuldigd blijft.
                </p>
              </div>

              <div className="divide-y divide-cocoa/12">
                {cancellationSteps.map((step, index) => (
                  <div key={step.period} className="grid gap-2 py-5 first:pt-0 last:pb-0 sm:grid-cols-[2.2rem_1fr]">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-linen text-xs font-semibold text-cocoa">{index + 1}</span>
                    <div>
                      <h3 className="font-semibold text-coffee">{step.period}</h3>
                      <p className="mt-1 text-sm leading-7 text-coffee/72">{step.condition}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-4xl gap-6 md:grid-cols-2">
            <section className="rounded-lg bg-linen/72 p-6 shadow-soft warm-border sm:p-8">
              <CloudRain className="text-cocoa" size={24} />
              <h2 className="display-title mt-4 text-2xl font-semibold text-coffee">Ziekte, noodsituaties en slecht weer</h2>
              <p className="mt-3 text-sm leading-7 text-coffee/75">
                Bij ziekte of een onverwachte noodsituatie zoeken we in overleg naar een passende oplossing. Neem hiervoor zo snel mogelijk contact op.
              </p>
              <p className="mt-3 text-sm leading-7 text-coffee/75">
                Bij slecht weer kan een buitenshoot in overleg kosteloos worden verplaatst. Cuddling Memories beoordeelt samen met de klant of de weersomstandigheden geschikt zijn voor de fotoshoot.
              </p>
            </section>

            <section className="rounded-lg bg-card p-6 shadow-soft warm-border sm:p-8">
              <ShieldCheck className="text-cocoa" size={24} />
              <h2 className="display-title mt-4 text-2xl font-semibold text-coffee">Annulering door Cuddling Memories</h2>
              <p className="mt-3 text-sm leading-7 text-coffee/75">
                Wanneer Cuddling Memories de fotoshoot zelf moet annuleren, wordt er een nieuwe datum afgesproken. Wanneer dit niet mogelijk is, worden reeds betaalde bedragen volledig terugbetaald.
              </p>
              <p className="mt-3 text-sm leading-7 text-coffee/75">
                Deze annuleringsvoorwaarden laten de wettelijke rechten van de klant onverlet.
              </p>
            </section>
          </div>

          <div className="mx-auto mt-8 flex max-w-4xl flex-col items-center justify-between gap-5 rounded-lg bg-cocoa px-6 py-7 text-card sm:flex-row sm:px-8">
            <div>
              <p className="fine-label text-[0.62rem] font-semibold text-blush">Annuleren of verplaatsen</p>
              <p className="mt-2 text-sm leading-6 text-card/80">Stuur altijd zo snel mogelijk een schriftelijk bericht of e-mail.</p>
            </div>
            <Button to="/contact" className="shrink-0 gap-2 bg-card text-coffee hover:bg-linen">
              <Mail size={15} /> Neem contact op
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
