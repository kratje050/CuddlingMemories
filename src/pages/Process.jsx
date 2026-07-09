import { CalendarDays, CheckCircle, Clock, Images, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPageSections } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";

const icons = [Sparkles, CalendarDays, Clock, CheckCircle, Images, Mail];

const fallbackSteps = [
  {
    section_key: "step-1",
    title: "Kies je shoot",
    content:
      "Op de contactpagina kies je eerst het soort shoot. Zo kan de kalender meteen de juiste duur en beschikbaarheid gebruiken.",
  },
  {
    section_key: "step-2",
    title: "Kies pakket, maand en datum",
    content:
      "Daarna kies je eventueel een passend pakket. Kom je vanuit het maandoverzicht, dan opent de kalender direct in die maand.",
  },
  {
    section_key: "step-3",
    title: "Kies een vrij tijdslot",
    content:
      "Je ziet alleen beschikbare tijden. Een aanvraag is nog geen definitieve boeking; ik bevestig het moment persoonlijk.",
  },
  {
    section_key: "step-4",
    title: "Vul je gegevens in",
    content:
      "Je vult je naam, e-mailadres, omgeving en bericht in. Er wordt geen telefoonnummer of adres gevraagd.",
  },
  {
    section_key: "step-5",
    title: "De fotoshoot",
    content:
      "Na bevestiging stemmen we de laatste details af. Tijdens de shoot is er ruimte en aandacht voor echte momenten.",
  },
  {
    section_key: "step-6",
    title: "Online galerij en favorieten",
    content:
      "Na de shoot ontvang je een beveiligde online galerij. Daar kies je jouw favoriete beelden en kun je extra beelden aanvragen.",
  },
];

const oldGenericText = "Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.";

function normalizeSteps(sections) {
  const defaultsByKey = new Map(fallbackSteps.map((step) => [step.section_key, step]));
  return sections.map((section) => {
    const fallback = defaultsByKey.get(section.section_key);
    if (!fallback) return section;
    if (!section.content || section.content === oldGenericText) {
      return { ...section, title: fallback.title, content: fallback.content };
    }
    return section;
  });
}

export default function Process() {
  const { title, description } = usePageMeta(
    "werkwijze",
    "Werkwijze",
    "Lees hoe boeken bij Cuddling Memories werkt: shoot kiezen, datum en tijd aanvragen, bevestiging en online galerij."
  );
  const [steps, setSteps] = useState(fallbackSteps);

  useEffect(() => {
    let active = true;
    getPageSections("werkwijze")
      .then((sections) => {
        if (active && sections?.length) setSteps(normalizeSteps(sections));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SEO title={title} description={description} />
      <section className="pt-36">
        <div className="container-soft pb-16">
          <SectionTitle
            eyebrow="Werkwijze"
            title="Zo werkt boeken bij Cuddling Memories"
            text="Je kiest online je shoot, maand, datum en tijd. Daarna bevestig ik de aanvraag en volgt alles stap voor stap."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = icons[index % icons.length];
              return (
                <article key={step.section_key || step.title} className="rounded-lg bg-card p-7 shadow-soft warm-border">
                  <div className="flex items-center justify-between gap-4">
                    <span className="display-title text-5xl font-semibold text-blush">{String(index + 1).padStart(2, "0")}</span>
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-linen text-cocoa">
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                  </div>
                  <h3 className="mt-7 display-title text-2xl font-semibold text-coffee">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-coffee/72">{step.content}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-10 rounded-lg bg-linen p-8 text-center shadow-soft warm-border">
            <h2 className="display-title text-3xl font-semibold text-coffee">Klaar om jouw shoot aan te vragen?</h2>
            <Button to="/contact" className="mt-6">
              Boek een shoot
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
