import { Camera, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPage, getPageSections } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";

const fallbackCategories = ["Cakesmash", "Motherhood", "Gezin", "Portret", "Newborn", "Zwangerschap", "Bevalling", "Buiten shoots"];

export default function ModelCall() {
  const { title, description } = usePageMeta(
    "model-gezocht",
    "Model gezocht",
    "Model gezocht voor portfolio-uitbreiding bij Cuddling Memories Fotografie met 50% korting op geselecteerde shoots."
  );
  const [active, setActive] = useState(true);
  const [pitch, setPitch] = useState(
    "Voor het uitbreiden van mijn portfolio ben ik regelmatig op zoek naar modellen. Je mag dan met 50% korting bij mij komen shooten."
  );
  const [discount, setDiscount] = useState("50");
  const [categories, setCategories] = useState(fallbackCategories);
  const [ctaText, setCtaText] = useState("Ik wil model staan");
  const [ctaUrl, setCtaUrl] = useState("/contact?shoot=Model%20staan%20met%2050%25%20korting");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [page, sections] = await Promise.all([getPage("model-gezocht"), getPageSections("model-gezocht")]);
      if (cancelled) return;

      if (!page) {
        setActive(false);
        return;
      }
      setActive(page.is_published);
      if (page.content) setPitch(page.content);

      const discountSection = sections?.find((row) => row.section_key === "discount");
      const categoriesSection = sections?.find((row) => row.section_key === "categories");
      const ctaSection = sections?.find((row) => row.section_key === "cta");

      if (discountSection?.content) setDiscount(discountSection.content);
      if (categoriesSection?.content) {
        try {
          setCategories(JSON.parse(categoriesSection.content));
        } catch {
          // laat fallback staan bij ongeldige JSON
        }
      }
      if (ctaSection?.button_text) setCtaText(ctaSection.button_text);
      if (ctaSection?.button_url) setCtaUrl(ctaSection.button_url);
    }

    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SEO title={title} description={description} />
      <section className="pt-36">
        <div className="container-soft grid items-center gap-10 pb-16 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <SectionTitle centered={false} eyebrow="Portfolio-oproep" title="Model gezocht" />
            {active ? (
              <>
                <p className="mt-6 text-lg leading-9 text-coffee/78">{pitch.replace("50%", `${discount}%`)}</p>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {categories.map((category) => (
                    <div key={category} className="rounded-full bg-card px-4 py-3 text-center text-xs font-semibold text-coffee shadow-soft warm-border">
                      {category}
                    </div>
                  ))}
                </div>
                <Button to={ctaUrl} className="mt-9">
                  {ctaText}
                </Button>
              </>
            ) : (
              <div className="mt-6 rounded-lg bg-linen p-6 text-sm leading-7 text-coffee/78 warm-border">
                Er zijn op dit moment geen modelplekken beschikbaar. Kijk later nog eens terug, of{" "}
                <Button to="/contact" variant="ghost" className="px-0 normal-case tracking-normal">
                  boek gewoon een reguliere shoot
                </Button>
                .
              </div>
            )}
          </div>
          <div className="relative">
            <img src="/images/instagram/instagram-07.jpg" alt="Warme buiten fotoshoot door Cuddling Memories" className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft warm-border" />
            <div className="absolute -bottom-6 left-6 right-6 rounded-lg bg-card p-5 shadow-soft warm-border">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-linen text-cocoa">
                  <Camera size={21} />
                </span>
                <div>
                  <p className="fine-label text-[0.62rem] font-semibold text-cocoa">Met korting</p>
                  <p className="display-title text-2xl font-semibold text-coffee">{discount}% portfolio-modelplek</p>
                </div>
                <Heart className="ml-auto hidden text-cocoa sm:block" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
