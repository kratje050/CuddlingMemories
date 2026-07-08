import { useEffect, useState } from "react";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPage, getPageSections } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";

const fallbackSections = [
  {
    section_key: "gegevens",
    title: "Welke gegevens",
    content:
      "Bij een boekingsaanvraag worden je naam, e-mailadres, gewenste shoot, gewenste periode, locatie en bericht verwerkt. Deze gegevens worden alleen gebruikt om je aanvraag te beantwoorden en een shoot met je in te plannen.",
  },
  {
    section_key: "bewaartermijn",
    title: "Bewaartermijn",
    content:
      "Gegevens worden niet langer bewaard dan nodig is om je aanvraag af te handelen en, bij een geboekte shoot, de administratie rondom die boeking af te ronden.",
  },
  {
    section_key: "delen",
    title: "Delen met derden",
    content:
      "Je gegevens worden niet verkocht of gedeeld met derden voor marketingdoeleinden. Ze worden uitsluitend gebruikt voor het verzenden van de boekingsaanvraag naar Cuddling Memories Fotografie.",
  },
  {
    section_key: "rechten",
    title: "Jouw rechten",
    content:
      "Je hebt het recht om inzage, correctie of verwijdering van je gegevens te vragen. Neem hiervoor contact op via het contactformulier.",
  },
];

export default function Privacy() {
  const { title, description } = usePageMeta(
    "privacybeleid",
    "Privacybeleid",
    "Lees hoe Cuddling Memories Fotografie omgaat met jouw persoonsgegevens bij een boekingsaanvraag."
  );
  const [intro, setIntro] = useState(
    "Cuddling Memories Fotografie gaat zorgvuldig om met de persoonsgegevens die je via het boekingsformulier deelt. Hieronder lees je welke gegevens worden verwerkt, waarom, en hoe lang ze worden bewaard."
  );
  const [sections, setSections] = useState(fallbackSections);

  useEffect(() => {
    let active = true;

    Promise.all([getPage("privacybeleid"), getPageSections("privacybeleid")])
      .then(([page, sectionRows]) => {
        if (!active) return;
        if (page?.content) setIntro(page.content);
        if (sectionRows?.length) setSections(sectionRows);
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
          <SectionTitle eyebrow="Privacy" title="Privacybeleid" />
          <div className="mx-auto mt-10 max-w-3xl space-y-6 text-sm leading-7 text-coffee/78">
            <p>{intro}</p>
            {sections.map((section) => (
              <div key={section.section_key || section.title}>
                <h2 className="display-title text-xl font-semibold text-coffee">{section.title}</h2>
                <p className="mt-2">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
