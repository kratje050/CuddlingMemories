import { ArrowRight, Camera, Heart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPage, getPageSections } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";

const fallbackParagraphs = [
  "Ik leg echte, liefdevolle en pure momenten vast. Ik fotografeer gezinnen, moeders, kinderen, newborns en bijzondere mijlpalen in een warme, zachte en tijdloze stijl.",
  "Mijn aandacht gaat uit naar kleine details, warme blikken en momenten die vaak voorbij lijken te vliegen. Juist die beelden worden later steeds waardevoller.",
  "Voor de camera mag alles natuurlijk voelen. Er is ruimte om te wennen, te lachen, te knuffelen en gewoon jezelf te zijn, zonder dat het geforceerd wordt.",
];

function cleanAboutText(text) {
  return text
    .replaceAll("Demy", "mij")
    .replaceAll("demy", "mij")
    .replaceAll("rustig en ", "")
    .replaceAll("rustige ", "zachte ")
    .replaceAll("Rustige ", "Zachte ")
    .replaceAll("rustig, ", "")
    .replaceAll("rustig", "ontspannen");
}

export default function About() {
  const { title, description } = usePageMeta(
    "over-demy",
    "Over mij",
    "Maak kennis met mijn warme, zachte en tijdloze fotografiestijl voor gezinnen, moeders, kinderen en newborns."
  );
  const [subtitle, setSubtitle] = useState("Foto's die later steeds meer gaan betekenen");
  const [paragraphs, setParagraphs] = useState(fallbackParagraphs);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getPage("over-demy"), getPageSections("over-demy")])
      .then(([page, sectionRows]) => {
        if (!active || !page) return;
        if (page.subtitle) setSubtitle(page.subtitle);
        if (page.content) setParagraphs(page.content.split("\n\n").filter(Boolean).map(cleanAboutText));
        setSections(sectionRows || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const section = (key, fallback) => sections.find((item) => item.section_key === key && item.is_visible !== false)?.content || fallback;

  return (
    <>
      <SEO title={title} description={description} />
      <section className="pt-32">
        <div className="container-soft pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="grid gap-4">
              <div className="grid grid-cols-[0.75fr_1fr] gap-4">
                <img
                  src={section("image_left", "/images/instagram/instagram-01.jpg")}
                  alt="Warme fotografiestijl van Cuddling Memories"
                  className="mt-12 aspect-[3/4] w-full rounded-lg object-cover shadow-soft warm-border"
                />
                <img
                  src={section("image_right", "/images/instagram/instagram-10.jpg")}
                  alt="Zachte details tijdens een fotoshoot"
                  className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft warm-border"
                />
              </div>
              <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
                <Heart className="text-cocoa" size={22} />
                <p className="mt-2 text-base font-semibold leading-7 text-coffee">
                  {section("highlight_text", "Oog voor kleine details, warme blikken en echte momenten.")}
                </p>
              </div>
            </div>
            <div>
              <SectionTitle centered={false} eyebrow="Over mij" title={subtitle} />
              <div className="mt-6 space-y-5 text-base leading-8 text-coffee/78">
                {paragraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button to="/boek-een-shoot" className="gap-2">
                  Boek een shoot <ArrowRight size={15} />
                </Button>
                <Button to="/werkwijze" variant="secondary">
                  Bekijk werkwijze
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              ["Zachte kleuren", "Ik werk graag met lichte tinten, warme details en beelden die tijdloos blijven.", Sparkles],
              ["Echte momenten", "De mooiste foto's ontstaan vaak tussendoor: een blik, een lach of een kleine aanraking.", Heart],
              ["Fijne begeleiding", "Ik help met houding, sfeer en kleine aanwijzingen, zodat je niet hoeft te weten wat je moet doen.", Camera],
            ].map(([title, text, Icon]) => (
              <div key={title} className="rounded-lg bg-card p-6 shadow-soft warm-border">
                <Icon className="text-cocoa" size={22} />
                <h2 className="display-title mt-4 text-2xl font-semibold text-coffee">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-coffee/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
