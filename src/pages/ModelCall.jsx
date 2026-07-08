import { Camera, Heart } from "lucide-react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";

const modelCategories = ["Cakesmash", "Motherhood", "Gezin", "Portret", "Newborn", "Zwangerschap", "Bevalling", "Buiten shoots"];
const imageBase = "https://6a4e5b6a100cca13d5bf6c14--cuddling-memories-website.netlify.app";

export default function ModelCall() {
  return (
    <>
      <SEO title="Model gezocht" description="Model gezocht voor portfolio-uitbreiding bij Cuddling Memories Fotografie met 50% korting op geselecteerde shoots." />
      <section className="pt-36"><div className="container-soft grid items-center gap-10 pb-16 lg:grid-cols-[1fr_0.95fr]"><div><SectionTitle centered={false} eyebrow="Portfolio-oproep" title="Model gezocht" /><p className="mt-6 text-lg leading-9 text-coffee/78">Voor het uitbreiden van mijn portfolio ben ik regelmatig op zoek naar modellen. Je mag dan met 50% korting bij mij komen shooten.</p><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{modelCategories.map((category) => <div key={category} className="rounded-full bg-card px-4 py-3 text-center text-xs font-semibold text-coffee shadow-soft warm-border">{category}</div>)}</div><Button to="/contact?shoot=Model%20staan%20met%2050%25%20korting" className="mt-9">Ik wil model staan</Button></div><div className="relative"><img src={`${imageBase}/images/warm-field.jpg`} alt="Warme buiten fotoshoot" className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft warm-border" /><div className="absolute -bottom-6 left-6 right-6 rounded-lg bg-card p-5 shadow-soft warm-border"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-linen text-cocoa"><Camera size={21} /></span><div><p className="fine-label text-[0.62rem] font-semibold text-cocoa">Met korting</p><p className="display-title text-2xl font-semibold text-coffee">50% portfolio-modelplek</p></div><Heart className="ml-auto hidden text-cocoa sm:block" /></div></div></div></div></section>
    </>
  );
}
