import PackageCard from "../components/PackageCard.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { packages } from "../data/packages.js";

export default function Packages() {
  return (
    <>
      <SEO title="Pakketten" description="Bekijk de pakketten en prijzen voor portret, cakesmash, zwangerschap, gezin en newborn fotografie bij Cuddling Memories." />
      <section className="pt-36">
        <div className="container-soft pb-16">
          <SectionTitle eyebrow="Pakketten" title="Fotoshoots met een zachte, tijdloze stijl" text="Kies de shoot die past bij jouw moment. Na afloop ontvang je een online galerij waar je jouw favoriete beelden kunt kiezen." />
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((item) => <PackageCard key={item.name} item={item} />)}
          </div>
          <p className="mx-auto mt-8 max-w-3xl rounded-lg bg-linen px-6 py-5 text-center text-sm leading-7 text-coffee/78 warm-border">
            Prijzen zijn vanaf-prijzen. Na de shoot ontvang je een online galerij waar je jouw favoriete beelden kunt kiezen.
          </p>
        </div>
      </section>
    </>
  );
}
