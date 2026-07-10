import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "../components/Button.jsx";
import Lightbox from "../components/Lightbox.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";
import { getPortfolioAlbumBySlug, getPortfolioPhotos } from "../lib/api.js";
import { formatPortfolioCategories, parsePortfolioCategories } from "../lib/portfolioCategoryUtils.js";

export default function AlbumDetail() {
  const { slug } = useParams();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);

    getPortfolioAlbumBySlug(slug)
      .then(async (albumData) => {
        if (!active) return;
        if (!albumData) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setAlbum(albumData);
        const photoRows = await getPortfolioPhotos(albumData.id);
        if (!active) return;
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
        setNotFound(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="pt-36 pb-16">
        <div className="container-soft text-center text-sm text-coffee/60">Album laden...</div>
      </section>
    );
  }

  if (notFound || !album) {
    return (
      <section className="pt-36 pb-16">
        <div className="container-soft text-center">
          <p className="text-sm text-coffee/60">Dit album bestaat niet (meer).</p>
          <Button to="/portfolio" className="mt-6">
            Terug naar portfolio
          </Button>
        </div>
      </section>
    );
  }

  return (
    <>
      <SEO title={album.title} description={album.description || `Bekijk het ${album.title}-album van Cuddling Memories Fotografie.`} />
      <section className="pt-36 pb-16">
        <div className="container-soft">
          <Link to="/portfolio" className="flex items-center gap-2 text-sm font-semibold text-coffee/70 hover:text-cocoa">
            <ArrowLeft size={16} /> Terug naar portfolio
          </Link>
          <div className="mt-4">
            <SectionTitle eyebrow={album.category} title={album.title} text={album.description} centered={false} />
          </div>

          {photos.length === 0 ? (
            <p className="mt-10 text-sm text-coffee/60">Nog geen foto's in dit album.</p>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((item, index) => (
                <article
                  key={item.id}
                  className="group relative aspect-[4/5] cursor-pointer overflow-hidden rounded-lg bg-card shadow-soft warm-border"
                  onClick={() => setActiveIndex(index)}
                >
                  <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </article>
              ))}
            </div>
          )}

          <div className="py-14 text-center">
            <Button to="/boek-een-shoot">Boek een shoot</Button>
          </div>
        </div>
      </section>
      <Lightbox
        items={photos}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onPrev={() => setActiveIndex((current) => (current - 1 + photos.length) % photos.length)}
        onNext={() => setActiveIndex((current) => (current + 1) % photos.length)}
      />
    </>
  );
}
