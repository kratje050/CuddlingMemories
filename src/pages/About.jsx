import { Heart, Sparkles } from "lucide-react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";

export default function About() {
  return (
    <>
      <SEO title="Over Demy" description="Maak kennis met Demy van Cuddling Memories Fotografie: warme, zachte en tijdloze fotografie voor gezinnen, moeders, kinderen en newborns." />
      <section className="pt-36">
        <div className="container-soft grid items-center gap-10 pb-16 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative"><img src="/images/test-motherhood.svg" alt="Testafbeelding Demy's warme fotografiestijl" className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft warm-border" /><div className="absolute -bottom-6 right-6 rounded-lg bg-card p-5 shadow-soft warm-border"><Heart className="text-cocoa" size={22} /><p className="mt-2 max-w-44 text-sm leading-6 text-coffee/75">Oog voor details, rust en echte momenten.</p></div></div>
          <div>
            <SectionTitle centered={false} eyebrow="Over Demy" title="Foto's die later steeds meer gaan betekenen" />
            <div className="mt-6 space-y-5 text-base leading-8 text-coffee/78"><p>Demy legt echte, liefdevolle en pure momenten vast. Ze fotografeert gezinnen, moeders, kinderen, newborns en bijzondere mijlpalen in een warme, zachte en tijdloze stijl.</p><p>Haar aandacht gaat uit naar kleine details, warme blikken en momenten die vaak voorbij lijken te vliegen. Juist die beelden worden later steeds waardevoller.</p><p>Voor de camera mag alles rustig en natuurlijk voelen. Er is ruimte om te wennen, te lachen, te knuffelen en gewoon jezelf te zijn, zonder dat het geforceerd wordt.</p></div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button to="/contact">Boek een shoot</Button><Button to="/werkwijze" variant="secondary">Bekijk werkwijze</Button></div>
            <div className="mt-8 flex gap-4 rounded-lg bg-linen p-5 warm-border"><Sparkles className="mt-1 shrink-0 text-cocoa" /><p className="text-sm leading-7 text-coffee/75">De stijl van Cuddling Memories is rustig, warm en licht, met veel aandacht voor zachte kleuren en tijdloze beelden.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
