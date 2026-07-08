import { CalendarHeart, Images, Mail, Palette, Sparkles, Star } from "lucide-react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";

const steps = [
  ["Aanvraag via het formulier", Mail],
  ["Samen datum en soort shoot afstemmen", CalendarHeart],
  ["Tips voor kleding en voorbereiding", Palette],
  ["De fotoshoot", Sparkles],
  ["Online galerij ontvangen", Images],
  ["Favoriete beelden kiezen", Star],
];

export default function Process() {
  return (
    <>
      <SEO title="Werkwijze" description="Lees hoe een fotoshoot bij Cuddling Memories verloopt, van aanvraag tot online galerij en favoriete beelden kiezen." />
      <section className="pt-36"><div className="container-soft pb-16"><SectionTitle eyebrow="Werkwijze" title="Van aanvraag tot jouw favoriete beelden" text="Een duidelijke route, met rust vooraf en ruimte tijdens de shoot." /><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{steps.map(([title, Icon], index) => <article key={title} className="rounded-lg bg-card p-7 shadow-soft warm-border"><div className="flex items-center justify-between gap-4"><span className="display-title text-5xl font-semibold text-blush">{String(index + 1).padStart(2, "0")}</span><span className="grid h-12 w-12 place-items-center rounded-full bg-linen text-cocoa"><Icon size={22} strokeWidth={1.6} /></span></div><h3 className="mt-7 display-title text-2xl font-semibold text-coffee">{title}</h3><p className="mt-3 text-sm leading-7 text-coffee/72">Elke stap is bedoeld om de shoot overzichtelijk en ontspannen te laten verlopen.</p></article>)}</div><div className="mt-10 rounded-lg bg-linen p-8 text-center shadow-soft warm-border"><h2 className="display-title text-3xl font-semibold text-coffee">Klaar om jouw shoot aan te vragen?</h2><Button to="/contact" className="mt-6">Boek een shoot</Button></div></div></section>
    </>
  );
}
