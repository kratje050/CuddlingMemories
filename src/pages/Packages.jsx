import { useEffect, useState } from "react";
import PackageCard from "../components/PackageCard.jsx";
import PriceCalculator from "../components/PriceCalculator.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPublishedPackages } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";

export default function Packages() {
  const { title, description } = usePageMeta(
    "pakketten",
    "Pakketten",
    "Bekijk de pakketten en prijzen voor portret, cakesmash, zwangerschap, gezin en newborn fotografie bij Cuddling Memories."
  );
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

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
              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {packages.map((item) => (
                  <PackageCard key={item.id} item={item} />
                ))}
              </div>
              <p className="mx-auto mt-8 max-w-3xl rounded-lg bg-linen px-6 py-5 text-center text-sm leading-7 text-coffee/78 warm-border">
                Prijzen zijn vanaf-prijzen. Na de shoot ontvang je een online galerij waar je jouw favoriete beelden kunt kiezen.
              </p>
              <PriceCalculator packages={packages} />
            </>
          )}
        </div>
      </section>
    </>
  );
}
