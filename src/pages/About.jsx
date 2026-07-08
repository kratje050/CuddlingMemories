import { Heart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPage } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";

const fallbackParagraphs = [
  "Ik leg echte, liefdevolle en pure momenten vast. Ik fotografeer gezinnen, moeders, kinderen, newborns en bijzondere mijlpalen in een warme, zachte en tijdloze stijl.",
  "Mijn aandacht gaat uit naar kleine details, warme blikken en momenten die vaak voorbij lijken te vliegen. Juist die beelden worden later steeds waardevoller.",
  "Voor de camera mag alles rustig en natuurlijk voelen. Er is ruimte om te wennen, te lachen, te knuffelen en gewoon jezelf te zijn, zonder dat het geforceerd wordt.",
];

export default function About() {
  const { title, description } = usePageMeta(
    "over-demy",
    "Over Demy",
    "Maak kennis met Demy van Cuddling Memories Fotografie: warme, zachte en tijdloze fotografie voor gezinnen, moeders, kinderen en newborns."
  );
  const [subtitle, setSubtitle] = useState("Foto's die later steeds meer gaan betekenen");
  const [paragraphs, setParagraphs] = useState(fallbackParagraphs);

  useEffect(() => {
    let active = true;
    getPage("over-demy")
      .then((page) => {
        if (!active || !page) return;
        if (page.subtitle) setSubtitle(page.subtitle);
        if (page.content) setParagraphs(page.content.split("\n\n").filter(Boolean));
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
        <div className="container-soft grid items-center gap-10 pb-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative">
            <img src="/images/instagram/instagram-01.jpg" alt="Demy's warme fotografiestijl" className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft warm-border" />
            <div className="absolute -bottom-6 right-6 rounded-lg bg-card p-5 shadow-soft warm-border">
              <Heart className="text-cocoa" size={22} />
              <p className="mt-2 max-w-44 text-sm leading-6 text-coffee/75">Oog voor details, rust en echte momenten.</p>
            </div>
          </div>
          <div>
            <SectionTitle centered={false} eyebrow="Over Demy" title={subtitle} />
            <div className="mt-6 space-y-5 text-base leading-8 text-coffee/78">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/contact">Boek een shoot</Button>
              <Button to="/werkwijze" variant="secondary">
                Bekijk werkwijze
              </Button>
            </div>
            <div className="mt-8 flex gap-4 rounded-lg bg-linen p-5 warm-border">
              <Sparkles className="mt-1 shrink-0 text-cocoa" />
              <p className="text-sm leading-7 text-coffee/75">
                De stijl van Cuddling Memories is rustig, warm en licht, met veel aandacht voor zachte kleuren en
                tijdloze beelden.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
