import { useEffect, useState } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import Button from "../components/Button.jsx";
import PackageCard from "../components/PackageCard.jsx";
import PriceCalculator from "../components/PriceCalculator.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPublishedPackages } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";

const formatEuro = (value) => `EUR ${Number(value).toFixed(2).replace(".", ",")}`;

export default function Packages() {
  const { title, description } = usePageMeta(
    "pakketten",
    "Pakketten",
    "Bekijk de pakketten en prijzen voor portret, cakesmash, zwangerschap, gezin en newborn fotografie bij Cuddling Memories."
  );
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const shootPackages = packages.filter((item) => item.price_unit === "shoot");
  const extraCosts = packages.filter((item) => item.price_unit !== "shoot");

  useEffect(() => {
    let active = true;
    getPublishedPackages()
      .then((data) => {
        if (active) {
          setPackages(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setFailed(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SEO title={title} description={description} />
      <section className="pt-36">
        <div className="container-soft pb-16">
          <SectionTitle
            eyebrow="Pakketten"
            title="Fotoshoots met een zachte, tijdloze stijl"
            text="Kies de shoot die past bij jouw moment. Na afloop ontvang je een online galerij waar je jouw favoriete beelden kunt kiezen."
          />

          {loading && <p className="mt-10 text-center text-sm text-coffee/60">Pakketten laden...</p>}
          {failed && (
            <p className="mt-10 text-center text-sm text-coffee/60">
              De pakketten konden niet geladen worden. Probeer het later opnieuw.
            </p>
          )}

          {!loading && !failed && (
            <>
              <div className="mt-10">
                <PriceCalculator packages={packages} />
              </div>

              <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-lg bg-card p-5 shadow-soft warm-border md:p-7">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="fine-label text-[0.68rem] font-semibold text-cocoa">Overzicht</p>
                      <h2 className="display-title mt-1 text-3xl font-semibold text-coffee">Shoots en vanaf-prijzen</h2>
                    </div>
                    <Button to="/contact" variant="secondary" className="px-5">
                      Boeken
                    </Button>
                  </div>

                  <div className="mt-6 divide-y divide-cocoa/12">
                    {shootPackages.map((item) => (
                      <div key={item.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto] md:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-coffee">{item.title}</h3>
                            {item.is_featured && (
                              <span className="rounded-full bg-linen px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cocoa">
                                Veel gekozen
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm leading-6 text-coffee/68">{item.description}</p>
                          {item.included_images ? (
                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-coffee/62">
                              <Check size={13} className="text-cocoa" /> {item.included_images} digitale beelden inbegrepen
                            </p>
                          ) : null}
                        </div>
                        <p className="display-title text-3xl font-semibold text-cocoa">{formatEuro(item.price)}</p>
                        <Button
                          to={`/contact?shoot=${encodeURIComponent(item.shoot_type || "Anders")}`}
                          className="gap-2 px-5"
                          aria-label={`${item.title} boeken`}
                        >
                          Kies <ArrowRight size={15} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <aside className="grid gap-4">
                  <div className="rounded-lg bg-linen p-6 shadow-soft warm-border">
                    <Info className="text-cocoa" size={22} />
                    <h2 className="display-title mt-3 text-2xl font-semibold text-coffee">Goed om te weten</h2>
                    <div className="mt-4 grid gap-3 text-sm leading-6 text-coffee/75">
                      <p>Alle prijzen zijn vanaf-prijzen.</p>
                      <p>Na de shoot ontvang je een online galerij waarin je jouw favoriete beelden kiest.</p>
                      <p>Extra beelden en eventuele reiskosten worden alleen toegevoegd als dat nodig is.</p>
                      <p>Bij een afspraak op locatie worden reiskosten standaard als heen- en terugreis berekend vanaf mijn locatie in Zoutkamp of Gouda.</p>
                    </div>
                  </div>

                  {extraCosts.length > 0 && (
                    <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
                      <p className="fine-label text-[0.68rem] font-semibold text-cocoa">Extra informatie</p>
                      <h2 className="display-title mt-1 text-2xl font-semibold text-coffee">Losse kosten</h2>
                      <div className="mt-4 grid gap-3">
                        {extraCosts.map((item) => (
                          <div key={item.id} className="rounded-lg border border-cocoa/15 bg-cream px-4 py-3 text-sm leading-6 text-coffee/72">
                            <div className="flex items-center justify-between gap-4">
                              <p className="font-semibold text-coffee">{item.title}</p>
                              <p className="font-semibold text-cocoa">
                                {formatEuro(item.price)}
                                {item.price_unit === "item" ? " / stuk" : item.price_unit === "km" ? " / km" : ""}
                              </p>
                            </div>
                            {item.description && <p className="mt-1">{item.description}</p>}
                            {item.price_unit === "km" && (
                              <p className="mt-1 text-xs font-semibold text-cocoa">
                                  Standaard als heen- en terugreis berekend vanaf mijn locatie in Zoutkamp of Gouda.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </aside>
              </div>

              <div className="mt-12">
                <SectionTitle
                  eyebrow="Uitgelicht"
                  title="Pakketten vergelijken"
                  text="Wil je per pakket lezen wat erbij hoort? Hieronder staan de shoots nog een keer als losse kaarten."
                />
                <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {shootPackages.map((item) => (
                    <PackageCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
