import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Camera, Grid3X3, Heart, Sparkles } from "lucide-react";
import Button from "../components/Button.jsx";
import Lightbox from "../components/Lightbox.jsx";
import SEO from "../components/SEO.jsx";
import { getAllPublishedPhotos, getPortfolioAlbums } from "../lib/api.js";
import { portfolioCategories } from "../lib/constants.js";
import { applyDynamicAlbumCovers, formatPortfolioCategories, parsePortfolioCategories, photoMatchesCategory } from "../lib/portfolioCategoryUtils.js";

const filterIcons = {
  Alles: Grid3X3,
  Zwangerschap: Heart,
  Newborn: Sparkles,
  Gezin: Heart,
  Cakesmash: Camera,
  Portret: Camera,
  Motherhood: Heart,
  "Buiten shoots": Sparkles,
};

const getMosaicClass = (index) => {
  if (index % 11 === 0) return "sm:col-span-2 lg:col-span-3 lg:row-span-2";
  if (index % 11 === 4) return "lg:col-span-3";
  if (index % 11 === 7) return "sm:col-span-2 lg:col-span-4";
  return "lg:col-span-2";
};

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
        setAlbums(applyDynamicAlbumCovers(albumRows, photoRows).filter((album) => album.hasPhotos));
        setPhotos(
          photoRows.map((row) => ({
            id: row.id,
            title: row.title,
            category: formatPortfolioCategories(row.category),
            categories: parsePortfolioCategories(row.category),
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
    () => photos.filter((item) => photoMatchesCategory(item, active)),
    [active, photos]
  );
  const albumPreview = albums.slice(0, 6);

  useEffect(() => {
    setActiveIndex(null);
  }, [active]);

  return (
    <>
      <SEO
        title="Portfolio"
        description="Bekijk het portfolio van Cuddling Memories met zwangerschap, newborn, cakesmash, gezin, portret, motherhood en buiten fotoshoots."
      />
      <section className="pt-32">
        <div className="container-soft pb-16">
          <div className="max-w-4xl pb-2">
              <p className="script-line text-4xl text-cocoa md:text-5xl">Portfolio</p>
              <h1 className="display-title mt-2 max-w-2xl text-5xl font-semibold leading-[0.95] text-coffee md:text-7xl">
                Beelden met warmte, zachtheid en echte verbinding
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-coffee/72">
                Bekijk een selectie uit verschillende shoots. Gebruik de filters om snel naar een soort shoot te gaan,
                of open een album voor een gerichtere serie.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button to="/boek-een-shoot" className="gap-2">
                  Boek een shoot <ArrowRight size={15} />
                </Button>
                <Button to="/pakketten" variant="secondary">
                  Bekijk pakketten
                </Button>
              </div>
          </div>

          {albums.length > 0 && (
            <div className="mt-14">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="fine-label text-[0.68rem] font-semibold text-cocoa">Albums</p>
                  <h2 className="display-title mt-1 text-3xl font-semibold text-coffee">Bekijk per shootsoort</h2>
                </div>
                {albums.length > albumPreview.length && <p className="text-sm text-coffee/60">{albums.length} albums beschikbaar</p>}
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {albumPreview.map((album, index) => (
                  <Link
                    key={album.id}
                    to={`/portfolio/${album.slug}`}
                    className={`group relative block min-h-[17rem] overflow-hidden rounded-lg bg-card shadow-soft warm-border ${
                      index === 0 ? "lg:col-span-2" : ""
                    }`}
                  >
                    <img
                      src={album.cover_image_url}
                      alt={album.title}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-coffee/70 via-coffee/18 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-coffee/50 via-coffee/18 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-card drop-shadow-[0_2px_8px_rgba(60,38,25,0.38)]">
                      <p className="fine-label text-[0.62rem] font-semibold text-card/90">{album.category || "Portfolio"}</p>
                      <div className="mt-1 flex items-end justify-between gap-4">
                        <h3 className="display-title text-3xl font-semibold leading-none">{album.title}</h3>
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-card/45 bg-card/15 transition group-hover:bg-card group-hover:text-coffee">
                          <ArrowRight size={17} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-14 rounded-lg bg-card/76 p-3 shadow-soft warm-border">
            <div className="flex flex-wrap justify-center gap-2">
              {["Alles", ...portfolioCategories].map((category) => {
                const Icon = filterIcons[category] || Camera;
                const selected = active === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActive(category)}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      selected
                        ? "border-cocoa bg-cocoa text-card shadow-glow"
                        : "border-cocoa/18 bg-cream/70 text-coffee hover:border-cocoa/45 hover:bg-cream"
                    }`}
                  >
                    <Icon size={14} strokeWidth={1.8} />
                    {category}
                  </button>
                );
              })}
            </div>
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

          <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="fine-label text-[0.68rem] font-semibold text-cocoa">{active}</p>
              <h2 className="display-title mt-1 text-3xl font-semibold text-coffee">
                {filtered.length === 1 ? "1 foto" : `${filtered.length} foto's`}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-coffee/62">
              Klik op een beeld om hem groter te bekijken en door de selectie te bladeren.
            </p>
          </div>

          <div className="mt-6 grid auto-rows-[18rem] gap-4 sm:grid-cols-2 lg:grid-cols-6 lg:auto-rows-[15rem]">
            {filtered.map((item, index) => (
              <article
                key={item.id}
                className={`group relative cursor-pointer overflow-hidden rounded-lg bg-card shadow-soft warm-border ${getMosaicClass(index)}`}
                style={{ animationDelay: `${index * 45}ms` }}
                onClick={() => setActiveIndex(index)}
              >
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-coffee/60 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="absolute inset-x-0 bottom-0 translate-y-3 p-5 text-card opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="fine-label text-[0.64rem] font-semibold">{item.category}</p>
                  <h3 className="display-title mt-1 text-2xl font-semibold">{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
          <div className="py-14 text-center">
            <Button to="/boek-een-shoot">Boek een shoot</Button>
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
