import { ArrowRight, Camera, Check, Heart, Instagram, Quote, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../components/Button.jsx";
import CategoryCard from "../components/CategoryCard.jsx";
import MonthAvailabilityCard from "../components/MonthAvailabilityCard.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getFeaturedPhotos, getPageSections, getPortfolioAlbums, getVisibleTestimonials } from "../lib/api.js";
import { getMonthsAvailability } from "../lib/monthAvailability.js";
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
  const [upcomingMonths, setUpcomingMonths] = useState([]);
  const [homeSections, setHomeSections] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getPortfolioAlbums(), getVisibleTestimonials(), getFeaturedPhotos(6), getPageSections("home")])
      .then(([albumRows, reviewRows, featuredRows, sectionRows]) => {
        if (!active) return;
        setAlbums(albumRows);
        setReviews(reviewRows);
        setInstagramPreview(featuredRows.map((row) => row.image_url));
        setHomeSections(sectionRows || []);
      })
      .catch(() => {
        // Blijft bij lege secties als Supabase niet bereikbaar is.
      });
    const now = new Date();
    getMonthsAvailability(now.getFullYear(), now.getMonth() + 1, 3)
      .then((data) => {
        if (active) setUpcomingMonths(data);
      })
      .catch(() => {
        // Blijft bij een lege previewsectie als Supabase niet bereikbaar is.
      });
    return () => {
      active = false;
    };
  }, []);

  const homeSection = (key, fallback) => homeSections.find((item) => item.section_key === key && item.is_visible !== false)?.content || fallback;
  const homeSectionTitle = (key, fallback) => homeSections.find((item) => item.section_key === key && item.is_visible !== false)?.title || fallback;
  const heroTitleWeight = Math.min(700, Math.max(300, Number(homeSection("hero_title_weight", "400")) || 400));

  return (
    <>
      <SEO title={title} description={description} />
      <section className="relative min-h-[720px] overflow-hidden pt-28 md:min-h-[760px] md:pt-32">
        <img
          src={homeSection("hero_image", "/images/home-hero-cakesmash.png")}
          alt="Cakesmash fotoshoot door Cuddling Memories Fotografie"
          className="home-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="photo-overlay absolute inset-0" />
        <div className="container-soft relative flex min-h-[590px] items-center py-12 md:min-h-[630px]">
          <div className="max-w-2xl animate-floatIn text-center lg:text-left">
            <p className="script-line text-5xl text-cocoa md:text-6xl">{settings.hero_subtitle}</p>
            <h1 className="display-title mt-3 text-4xl leading-[1.05] tracking-wide text-coffee md:text-5xl" style={{ fontWeight: heroTitleWeight }}>
              {settings.hero_title}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-coffee/82 lg:mx-0">
              {homeSection("hero_intro", "Zwangerschap, newborn, gezin, portret, cakesmash en motherhood fotografie.")}
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

      <section className="py-16">
        <div className="container-soft grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="script-line text-4xl text-cocoa">Voor later</p>
            <h2 className="display-title mt-2 text-4xl font-semibold leading-tight text-coffee md:text-5xl">
              {homeSectionTitle("memory_intro", "Foto's die voelen als een herinnering zodra je ze terugziet")}
            </h2>
            <p className="mt-5 text-base leading-8 text-coffee/72">
              {homeSection(
                "memory_intro",
                "Ik fotografeer met zachte kleuren, warme details en aandacht voor wat echt bij jullie past. Van kleine handjes tot grote mijlpalen: elk beeld mag iets bewaren van hoe het nu voelt."
              )}
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["Zachte stijl", Sparkles],
                ["Echte momenten", Heart],
                ["Fijne begeleiding", Camera],
              ].map(([label, Icon]) => (
                <div key={label} className="flex items-center gap-3 rounded-lg bg-card px-4 py-3 shadow-soft warm-border">
                  <Icon className="text-cocoa" size={18} />
                  <span className="text-sm font-semibold text-coffee">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-[1fr_0.82fr] gap-4">
            <img
              src={homeSection("memory_image_main", "/images/instagram/instagram-04.jpg")}
              alt="Warme familieshoot door Cuddling Memories"
              className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft warm-border"
            />
            <div className="grid gap-4">
              <img
                src={homeSection("memory_image_small", "/images/instagram/instagram-12.jpg")}
                alt="Detailbeeld van een fotoshoot"
                className="aspect-[4/3] w-full rounded-lg object-cover shadow-soft warm-border"
              />
              <div className="rounded-lg bg-linen p-5 shadow-soft warm-border">
                <Check className="text-cocoa" size={19} />
                <p className="mt-3 text-sm leading-7 text-coffee/75">
                  Bij locatie-afspraken worden eventuele reiskosten standaard als heen- en terugreis berekend vanaf mijn huis in Zoutkamp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {upcomingMonths.length > 0 && (
        <section className="py-16">
          <div className="container-soft">
            <SectionTitle eyebrow="Boeken" title="Wil je binnenkort een shoot boeken?" />
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {upcomingMonths.map((month) => (
                <MonthAvailabilityCard key={`${month.year}-${month.month}`} month={month} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Button to="/contact" variant="secondary">
                Bekijk alle beschikbare maanden
              </Button>
            </div>
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section className="py-16">
          <div className="container-soft">
            <SectionTitle
              eyebrow="Mijn fotografie"
              title="Warm, zacht en tijdloos"
              text="Cuddling Memories legt kleine momenten, mijlpalen en liefdevolle details vast in een zachte stijl die past bij jonge gezinnen, moeders en kinderen."
            />
            <div className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_1.6fr]">
              <div className="relative min-h-[24rem] overflow-hidden rounded-lg bg-card shadow-soft warm-border">
                <img
                  src={albums[0].cover_image_url}
                  alt={albums[0].category}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-coffee/70 via-coffee/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-card">
                  <p className="fine-label text-[0.62rem] font-semibold text-card/90">Uitgelicht</p>
                  <h3 className="display-title mt-1 text-4xl font-semibold">{albums[0].category}</h3>
                  <Button to={`/portfolio?category=${encodeURIComponent(albums[0].category)}`} variant="secondary" className="mt-5 border-card/70 bg-card/20 text-card hover:bg-card hover:text-coffee">
                    Bekijk deze foto's
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {albums.slice(1, 7).map((album, index) => (
                  <CategoryCard key={album.id} item={{ image: album.cover_image_url, category: album.category }} index={index} />
                ))}
              </div>
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
