import { CalendarHeart, Images, Mail, Palette, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPageSections } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";

const icons = [Mail, CalendarHeart, Palette, Sparkles, Images, Star];

const fallbackSteps = [
  { section_key: "step-1", title: "Aanvraag via het formulier" },
  { section_key: "step-2", title: "Samen datum en soort shoot afstemmen" },
  { section_key: "step-3", title: "Tips voor kleding en voorbereiding" },
  { section_key: "step-4", title: "De fotoshoot" },
  { section_key: "step-5", title: "Online galerij ontvangen" },
  { section_key: "step-6", title: "Favoriete beelden kiezen" },
].map((step) => ({
  ...step,
  content: "Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.",
}));

export default function Process() {
  const { title, description } = usePageMeta(
    "werkwijze",
    "Werkwijze",
    "Lees hoe een fotoshoot bij Cuddling Memories verloopt, van aanvraag tot online galerij en favoriete beelden kiezen."
  );
  const [steps, setSteps] = useState(fallbackSteps);

  useEffect(() => {
    let active = true;
    getPageSections("werkwijze")
      .then((sections) => {
        if (active && sections?.length) setSteps(sections);
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
            title="Van aanvraag tot jouw favoriete beelden"
            text="Een duidelijke route, met rust vooraf en ruimte tijdens de shoot."
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
                  {step.section_key === "step-5" && (
                    <span className="fine-label mt-4 inline-block rounded-full bg-blush/40 px-3 py-1 text-[0.62rem] font-semibold text-cocoa">
                      Binnenkort beschikbaar
                    </span>
                  )}
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
