import { ArrowRight, Camera, Check, Heart, Sparkles } from "lucide-react";
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
  const [imageLeft, setImageLeft] = useState("/images/instagram/instagram-07.jpg");
  const [imageRight, setImageRight] = useState("/images/instagram/instagram-11.jpg");

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
      const imageLeftSection = sections?.find((row) => row.section_key === "image_left");
      const imageRightSection = sections?.find((row) => row.section_key === "image_right");

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
      if (imageLeftSection?.content) setImageLeft(imageLeftSection.content);
      if (imageRightSection?.content) setImageRight(imageRightSection.content);
    }

    load().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <SEO title={title} description={description} />
      <section className="pt-32">
        <div className="container-soft pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <SectionTitle
                centered={false}
                eyebrow="Portfolio-oproep"
                title="Model gezocht"
                text="Af en toe zoek ik modellen om nieuw werk te maken voor mijn portfolio, socials en website."
              />
              {active ? (
                <>
                  <p className="mt-6 text-lg leading-9 text-coffee/78">{pitch.replace("50%", `${discount}%`)}</p>
                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      "Korting op geselecteerde shoots",
                      "Beelden mogen gebruikt worden voor portfolio",
                      "Samen stemmen we sfeer en styling af",
                    ].map((item) => (
                      <div key={item} className="rounded-lg bg-card/80 p-4 shadow-soft warm-border">
                        <Check className="text-cocoa" size={17} />
                        <p className="mt-3 text-sm font-semibold leading-6 text-coffee">{item}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button to={ctaUrl} className="gap-2">
                      {ctaText} <ArrowRight size={15} />
                    </Button>
                    <Button to="/portfolio" variant="secondary">
                      Bekijk portfolio
                    </Button>
                  </div>
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
            <div className="relative grid grid-cols-[0.9fr_1.1fr] gap-4">
              <img
                src={imageLeft}
                alt="Warme buiten fotoshoot door Cuddling Memories"
                className="mt-14 aspect-[3/4] w-full rounded-lg object-cover shadow-soft warm-border"
              />
              <img
                src={imageRight}
                alt="Portfolio voorbeeld van een zachte fotoshoot"
                className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft warm-border"
              />
              <div className="absolute bottom-6 left-6 right-6 rounded-lg bg-card/92 p-5 shadow-soft backdrop-blur warm-border sm:left-auto sm:w-72">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-linen text-cocoa">
                    <Camera size={21} />
                  </span>
                  <div>
                    <p className="fine-label text-[0.62rem] font-semibold text-cocoa">Met korting</p>
                    <p className="display-title text-2xl font-semibold text-coffee">{discount}% modelplek</p>
                  </div>
                  <Heart className="ml-auto text-cocoa" size={19} />
                </div>
              </div>
            </div>
          </div>

          {active && (
            <div className="mt-14 rounded-lg bg-card p-6 shadow-soft warm-border md:p-8">
              <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
                <div>
                  <Sparkles className="text-cocoa" size={22} />
                  <h2 className="display-title mt-3 text-3xl font-semibold text-coffee">Waarvoor ik modellen zoek</h2>
                  <p className="mt-3 text-sm leading-7 text-coffee/68">
                    Deze shootsoorten kunnen wisselen. Als iets bij jou past, kun je via het formulier reageren.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {categories.map((category) => (
                    <div key={category} className="rounded-full bg-linen px-4 py-3 text-center text-xs font-semibold text-coffee warm-border">
                      {category}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
