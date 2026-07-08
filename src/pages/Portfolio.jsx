import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import Lightbox from "../components/Lightbox.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getAllPublishedPhotos, getPortfolioAlbums } from "../lib/api.js";
import { portfolioCategories } from "../lib/constants.js";

export default function Portfolio() {
  const [params] = useSearchParams();
  const initial = params.get("category") || "Alles";
  const [active, setActive] = useState(portfolioCategories.includes(initial) ? initial : "Alles");
  const [activeIndex, setActiveIndex] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([getPortfolioAlbums(), getAllPublishedPhotos()])
      .then(([albumRows, photoRows]) => {
        if (!active) return;
        setAlbums(albumRows);
        setPhotos(
          photoRows.map((row) => ({
            id: row.id,
            title: row.title,
            category: row.category,
            image: row.image_url,
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(
    () => (active === "Alles" ? photos : photos.filter((item) => item.category === active)),
    [active, photos]
  );

  return (
    <>
      <SEO
        title="Portfolio"
        description="Bekijk het portfolio van Cuddling Memories met zwangerschap, newborn, cakesmash, gezin, portret, motherhood en buiten fotoshoots."
      />
      <section className="pt-36">
        <div className="container-soft">
          <SectionTitle
            eyebrow="Portfolio"
            title="Een rustige galerij vol warme momenten"
            text="Filter op soort shoot en ontdek de zachte stijl van Cuddling Memories."
          />

          {albums.length > 0 && (
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
              {albums.map((album) => (
                <Link key={album.id} to={`/portfolio/${album.slug}`} className="group block min-w-0">
                  <div className="relative aspect-[5/4] overflow-hidden rounded-lg shadow-soft warm-border">
                    <img
                      src={album.cover_image_url}
                      alt={album.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="fine-label mt-3 text-center text-[0.64rem] font-semibold text-coffee">{album.title}</p>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {["Alles", ...portfolioCategories].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActive(category)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  active === category
                    ? "border-cocoa bg-cocoa text-card"
                    : "border-cocoa/25 bg-card/70 text-coffee hover:bg-card"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {loading && <p className="mt-10 text-center text-sm text-coffee/60">Foto's laden...</p>}
          {failed && (
            <p className="mt-10 text-center text-sm text-coffee/60">
              De galerij kon niet geladen worden. Probeer het later opnieuw.
            </p>
          )}

          {!loading && !failed && filtered.length === 0 && (
            <p className="mt-10 text-center text-sm text-coffee/60">Nog geen foto's in deze categorie.</p>
          )}

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, index) => (
              <article
                key={item.id}
                className="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-lg bg-card shadow-soft warm-border"
                style={{ animationDelay: `${index * 45}ms` }}
                onClick={() => setActiveIndex(index)}
              >
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-coffee/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-4 p-5 text-card opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="fine-label text-[0.64rem] font-semibold">{item.category}</p>
                  <h3 className="display-title mt-1 text-2xl font-semibold">{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
          <div className="py-14 text-center">
            <Button to="/contact">Boek een shoot</Button>
          </div>
        </div>
      </section>
      <Lightbox
        items={filtered}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onPrev={() => setActiveIndex((current) => (current - 1 + filtered.length) % filtered.length)}
        onNext={() => setActiveIndex((current) => (current + 1) % filtered.length)}
      />
    </>
  );
}
