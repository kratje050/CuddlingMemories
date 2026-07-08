import { ArrowRight, Heart, Quote, Star } from "lucide-react";
import Button from "../components/Button.jsx";
import CategoryCard from "../components/CategoryCard.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { portfolioItems, categories } from "../data/portfolio.js";

const featuredCategories = categories.map((category) => portfolioItems.find((item) => item.category === category));
const imageBase = "https://6a4e5b6a100cca13d5bf6c14--cuddling-memories-website.netlify.app";
const reviews = [
  { name: "Lisa", text: "Demy stelt je meteen op je gemak en de foto's zijn prachtig. We zijn zo blij met het resultaat." },
  { name: "Marloes", text: "Een hele fijne ervaring en zulke mooie, warme foto's. Echt een aanrader!" },
  { name: "Kim", text: "Onze newbornshoot was geweldig. Demy heeft zoveel geduld en liefde voor wat ze doet." },
];

export default function Home() {
  return (
    <>
      <SEO title="Home" description="Liefdevolle fotografie voor zwangerschap, newborn, gezin, portret, cakesmash en motherhood in Groningen, Friesland en Zoutkamp." />
      <section className="relative min-h-[760px] overflow-hidden pt-28 md:pt-32">
        <img src={`${imageBase}/images/hero.jpg`} alt="Warme fotoshoot met kind" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="photo-overlay absolute inset-0" />
        <div className="container-soft relative grid min-h-[630px] items-center gap-10 py-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="max-w-2xl animate-floatIn text-center lg:text-left">
            <p className="script-line text-4xl text-cocoa md:text-5xl">Liefdevolle fotografie</p>
            <h1 className="display-title mt-3 text-5xl font-semibold leading-[0.96] text-coffee md:text-7xl">Voor herinneringen <span className="script-line block text-6xl font-normal text-cocoa md:text-8xl">die blijven</span></h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-coffee/82 lg:mx-0">Zwangerschap, newborn, gezin, portret, cakesmash en motherhood fotografie.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button to="/contact">Boek een shoot</Button>
              <Button to="/portfolio" variant="secondary">Bekijk portfolio</Button>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container-soft">
          <SectionTitle eyebrow="Mijn fotografie" title="Warm, zacht en tijdloos" text="Cuddling Memories legt kleine momenten, mijlpalen en liefdevolle details vast in een rustige stijl die past bij jonge gezinnen, moeders en kinderen." />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {featuredCategories.map((item, index) => <CategoryCard key={item.category} item={item} index={index} />)}
          </div>
        </div>
      </section>
      <section className="pb-16">
        <div className="container-soft grid gap-5 lg:grid-cols-[1.5fr_0.7fr]">
          <div className="rounded-lg bg-card p-7 shadow-soft warm-border md:p-10">
            <div className="mb-7 text-center"><Heart className="mx-auto text-cocoa" size={18} /><h2 className="fine-label mt-3 text-sm font-semibold text-cocoa">Lieve woorden</h2></div>
            <div className="grid gap-6 md:grid-cols-3">
              {reviews.map((review) => <article key={review.name} className="text-center"><div className="mb-4 flex justify-center gap-1 text-cocoa">{Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}</div><Quote className="mx-auto mb-3 text-blush" size={22} /><p className="text-sm leading-7 text-coffee/75">"{review.text}"</p><p className="mt-4 text-sm font-semibold text-coffee">- {review.name}</p></article>)}
            </div>
          </div>
          <div className="grid overflow-hidden rounded-lg bg-linen shadow-soft warm-border">
            <img src={`${imageBase}/images/cta-still.jpg`} alt="Zachte fotografie styling" className="h-full min-h-48 w-full object-cover" />
            <div className="flex flex-col justify-center p-7 text-center md:p-9"><h2 className="display-title text-3xl font-semibold leading-tight text-coffee">Wil je ook zulke warme herinneringen laten vastleggen?</h2><Button to="/contact" className="mx-auto mt-6 gap-2">Boek jouw shoot <ArrowRight size={16} /></Button></div>
          </div>
        </div>
      </section>
    </>
  );
}
