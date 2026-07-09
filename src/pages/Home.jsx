import { ArrowRight, Heart, Instagram, Quote, Star } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import CategoryCard from "../components/CategoryCard.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getFeaturedPhotos, getPortfolioAlbums, getVisibleTestimonials } from "../lib/api.js";
import { usePageMeta } from "../lib/usePageMeta.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

export default function Home() {
  const settings = useSiteSettings();
  const { title, description } = usePageMeta(
    "home",
    "Home",
    "Liefdevolle fotografie voor zwangerschap, newborn, gezin, portret, cakesmash en motherhood in Groningen, Friesland en Zoutkamp."
  );
  const [albums, setAlbums] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [instagramPreview, setInstagramPreview] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getPortfolioAlbums(), getVisibleTestimonials(), getFeaturedPhotos(6)])
      .then(([albumRows, reviewRows, featuredRows]) => {
        if (!active) return;
        setAlbums(albumRows);
        setReviews(reviewRows);
        setInstagramPreview(featuredRows.map((row) => row.image_url));
      })
      .catch(() => {
        // Blijft bij lege secties als Supabase niet bereikbaar is.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <SEO title={title} description={description} />
      <section className="relative min-h-[720px] overflow-hidden pt-28 md:min-h-[760px] md:pt-32">
        <img
          src="/images/home-hero-cakesmash.png"
          alt="Cakesmash fotoshoot door Cuddling Memories Fotografie"
          className="home-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="photo-overlay absolute inset-0" />
        <div className="container-soft relative flex min-h-[590px] items-center py-12 md:min-h-[630px]">
          <div className="max-w-2xl animate-floatIn text-center lg:text-left">
            <p className="script-line text-4xl text-cocoa md:text-5xl">{settings.hero_subtitle}</p>
            <h1 className="display-title mt-3 text-5xl font-semibold leading-[0.96] text-coffee md:text-7xl">
              {settings.hero_title}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-coffee/82 lg:mx-0">
              Zwangerschap, newborn, gezin, portret, cakesmash en motherhood fotografie.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Button to="/contact">Boek een shoot</Button>
              <Button to="/portfolio" variant="secondary">
                Bekijk portfolio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {albums.length > 0 && (
        <section className="py-16">
          <div className="container-soft">
            <SectionTitle
              eyebrow="Mijn fotografie"
              title="Warm, zacht en tijdloos"
              text="Cuddling Memories legt kleine momenten, mijlpalen en liefdevolle details vast in een rustige stijl die past bij jonge gezinnen, moeders en kinderen."
            />
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
              {albums.map((album, index) => (
                <CategoryCard key={album.id} item={{ image: album.cover_image_url, category: album.category }} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {reviews.length > 0 && (
        <section className="pb-16">
          <div className="container-soft grid gap-5 lg:grid-cols-[1.5fr_0.7fr]">
            <div className="rounded-lg bg-card p-7 shadow-soft warm-border md:p-10">
              <div className="mb-7 text-center">
                <Heart className="mx-auto text-cocoa" size={18} />
                <h2 className="fine-label mt-3 text-sm font-semibold text-cocoa">Lieve woorden</h2>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {reviews.map((review) => (
                  <article key={review.id} className="text-center">
                    <div className="mb-4 flex justify-center gap-1 text-cocoa">
                      {Array.from({ length: review.rating || 5 }).map((_, index) => (
                        <Star key={index} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <Quote className="mx-auto mb-3 text-blush" size={22} />
                    <p className="text-sm leading-7 text-coffee/75">"{review.text}"</p>
                    <p className="mt-4 text-sm font-semibold text-coffee">- {review.name}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="grid overflow-hidden rounded-lg bg-linen shadow-soft warm-border md:grid-cols-[0.85fr_1fr] lg:grid-cols-1">
              <img
                src="/images/instagram/instagram-10.jpg"
                alt="Zachte fotografie styling van Cuddling Memories"
                className="h-full min-h-48 w-full object-cover"
              />
              <div className="flex flex-col justify-center p-7 text-center md:p-9">
                <h2 className="display-title text-3xl font-semibold leading-tight text-coffee">
                  Wil je ook zulke warme herinneringen laten vastleggen?
                </h2>
                <Button to="/contact" className="mx-auto mt-6 gap-2">
                  Boek jouw shoot <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {instagramPreview.length > 0 && (
        <section className="pb-16">
          <div className="container-soft">
            <SectionTitle
              eyebrow="Instagram"
              title="Volg mij op Instagram"
              text="@cuddlingmemories - dagelijkse inkijkjes in shoots, achter de schermen en nieuwe beelden."
            />
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {instagramPreview.map((src) => (
                <a
                  key={src}
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg warm-border"
                >
                  <img src={src} alt="Post van Cuddling Memories op Instagram" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 grid place-items-center bg-coffee/0 text-card opacity-0 transition group-hover:bg-coffee/40 group-hover:opacity-100">
                    <Instagram size={22} />
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                <Instagram size={16} /> Volg op Instagram
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
