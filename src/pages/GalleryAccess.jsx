import { ArrowLeft, ArrowRight, Check, Heart, Images, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button.jsx";
import GalleryGrid from "../components/GalleryGrid.jsx";
import SEO from "../components/SEO.jsx";
import { getPublishedPackages } from "../lib/api.js";
import { supabase } from "../lib/supabaseClient.js";
import { galleryPhotoUrl, withGalleryPhotoUrl } from "../lib/galleryMedia.js";

export default function GalleryAccess() {
  const secureToken = window.location.pathname.split("/").filter(Boolean).at(-1);
  const [gallery, setGallery] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [extraImagePrice, setExtraImagePrice] = useState(null);
  const [paymentRequired, setPaymentRequired] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.rpc("get_gallery_access", { p_token: secureToken }).then(({ data, error }) => {
      if (!active) return;
      if (!error && data?.gallery) {
        const galleryPhotos = (data.photos || []).map((photo) => withGalleryPhotoUrl(photo, secureToken, "medium"));
        setGallery(data.gallery);
        setPhotos(galleryPhotos);
        setSelectedIds(galleryPhotos.filter((photo) => photo.is_favorite).map((photo) => photo.id));
        setNotes(Object.fromEntries(galleryPhotos.map((photo) => [photo.id, photo.client_note || ""])));
      } else if (!error && data?.payment_required) {
        setPaymentRequired(true);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [secureToken]);

  useEffect(() => {
    let active = true;
    getPublishedPackages().then((rows) => {
      if (!active) return;
      const extraImage = rows.find((item) => item.price_unit === "item" && /extra\s*(beeld|foto)/i.test(`${item.title || ""} ${item.slug || ""}`));
      setExtraImagePrice(extraImage ? Number(extraImage.price || 0) : null);
    }).catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const includedCount = Number(gallery?.included_images || 0);
  const extraCount = useMemo(() => Math.max(selectedIds.length - includedCount, 0), [selectedIds.length, includedCount]);
  const selectionProgress = includedCount > 0 ? Math.min((selectedIds.length / includedCount) * 100, 100) : 0;
  const coverPhoto = photos[0]?.image_url || "/images/home-hero-cakesmash.png";
  const visiblePhotos = showSelectedOnly ? photos.filter((photo) => selectedIds.includes(photo.id)) : photos;
  const activePhoto = activeIndex === null ? null : visiblePhotos[activeIndex];

  const toggleFavorite = (id) => {
    setNotice("");
    setStatus("idle");
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const save = async () => {
    setStatus("saving");
    setNotice("");
    const selections = photos.map((photo) => ({
      photo_id: photo.id,
      is_favorite: selectedIds.includes(photo.id),
      client_note: notes[photo.id] || "",
    }));
    const { error } = await supabase.rpc("save_gallery_selection", {
      p_token: secureToken,
      p_selections: selections,
      p_request_extra: extraCount > 0,
    });
    if (error) {
      setStatus("error");
      setNotice("Opslaan is niet gelukt. Probeer het opnieuw.");
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
      return;
    }

    await fetch("/api/submit-gallery-selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secure_token: secureToken, base_url: window.location.origin }),
    }).catch(() => null);

    setStatus("success");
    setNotice(extraCount > 0 ? "Je selectie is verstuurd, inclusief de extra gekozen beelden." : "Je selectie is verstuurd. Bedankt voor het doorgeven.");
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const closeLightbox = () => setActiveIndex(null);
  const showPrevious = () => setActiveIndex((current) => (current === null ? null : (current - 1 + visiblePhotos.length) % visiblePhotos.length));
  const showNext = () => setActiveIndex((current) => (current === null ? null : (current + 1) % visiblePhotos.length));

  useEffect(() => {
    if (activeIndex === null) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current === null ? null : (current - 1 + visiblePhotos.length) % visiblePhotos.length));
      if (event.key === "ArrowRight") setActiveIndex((current) => (current === null ? null : (current + 1) % visiblePhotos.length));
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, visiblePhotos.length]);

  if (loading) {
    return <GalleryState title="Je galerij wordt geladen" text="De foto's worden voor je klaargezet." />;
  }

  if (!gallery) {
    return <GalleryState title={paymentRequired ? "Galerij wacht op betaling" : "Galerij niet beschikbaar"} text={paymentRequired ? "De definitieve galerij wordt beschikbaar zodra het volledige bedrag als ontvangen is geregistreerd." : "Deze link is verlopen of de galerij is nog niet gepubliceerd."} />;
  }

  return (
    <>
      <SEO title={`Galerij ${gallery.client_name}`} description="Beveiligde klantgalerij van Cuddling Memories Fotografie." />
      <section className="pb-36 pt-32 lg:pb-24">
        <div className="container-soft">
          {notice && (
            <div className={`mb-5 flex items-start gap-3 rounded-lg px-5 py-4 text-sm leading-6 shadow-soft warm-border ${status === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900"}`} role="status" aria-live="polite">
              {status === "success" && <Check className="mt-0.5 shrink-0" size={19} />}
              <p className="font-semibold">{notice}</p>
            </div>
          )}
          <div className="overflow-hidden rounded-lg bg-card shadow-soft warm-border">
            <div className="aspect-[4/3] overflow-hidden bg-linen sm:aspect-[16/7] lg:aspect-[16/6]">
              <img src={coverPhoto} alt="Omslag van de klantgalerij" className="h-full w-full object-cover" />
            </div>
            <div className="grid gap-4 border-t border-cocoa/12 px-6 py-6 sm:px-9 sm:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,30rem)] lg:items-end lg:px-12">
              <div>
                <p className="fine-label text-[0.68rem] font-semibold text-cocoa">Persoonlijke klantgalerij</p>
                <h1 className="display-title mt-2 text-4xl font-semibold leading-none text-coffee sm:text-5xl lg:text-6xl">{gallery.title}</h1>
              </div>
              <p className="text-sm leading-7 text-coffee/68 sm:text-base">
                Bekijk de beelden op je gemak en geef met het hartje aan welke foto's je wilt ontvangen.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-lg bg-card shadow-soft warm-border sm:grid-cols-4">
            <GalleryStat label="Beschikbaar" value={photos.length} />
            <GalleryStat label="Inbegrepen" value={includedCount} />
            <GalleryStat label="Gekozen" value={selectedIds.length} accent />
            <GalleryStat label="Extra gekozen" value={extraCount} warning={extraCount > 0} />
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <main className="min-w-0">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-cocoa/12 pb-5">
                <div>
                  <p className="fine-label text-[0.65rem] font-semibold text-cocoa">Foto's bekijken</p>
                  <h2 className="display-title mt-1 text-3xl font-semibold text-coffee sm:text-4xl">
                    {showSelectedOnly ? "Jouw gekozen beelden" : "Alle beelden"}
                  </h2>
                </div>
                <div className="inline-flex rounded-full border border-cocoa/18 bg-card p-1">
                  <FilterButton active={!showSelectedOnly} onClick={() => setShowSelectedOnly(false)} label={`Alles ${photos.length}`} />
                  <FilterButton active={showSelectedOnly} onClick={() => setShowSelectedOnly(true)} label={`Gekozen ${selectedIds.length}`} />
                </div>
              </div>

              {visiblePhotos.length === 0 ? (
                <div className="rounded-lg bg-card px-6 py-16 text-center shadow-soft warm-border">
                  <Heart className="mx-auto text-cocoa" size={28} />
                  <h3 className="display-title mt-4 text-2xl font-semibold text-coffee">Nog geen foto's gekozen</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-coffee/62">Ga terug naar alle beelden en tik op een hartje om je selectie te beginnen.</p>
                  <Button type="button" variant="secondary" onClick={() => setShowSelectedOnly(false)} className="mt-5">Bekijk alle foto's</Button>
                </div>
              ) : (
                <GalleryGrid
                  photos={visiblePhotos}
                  selectedIds={selectedIds}
                  notes={notes}
                  onToggleFavorite={toggleFavorite}
                  onNoteChange={(id, value) => setNotes((current) => ({ ...current, [id]: value }))}
                  onOpen={(index) => setActiveIndex(index)}
                />
              )}
            </main>

            <aside className="order-first rounded-lg bg-card p-5 shadow-soft warm-border lg:order-none lg:sticky lg:top-28">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="fine-label text-[0.62rem] font-semibold text-cocoa">Jouw selectie</p>
                  <p className="display-title mt-1 text-3xl font-semibold text-coffee">{selectedIds.length} gekozen</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-linen text-cocoa"><Heart size={19} fill="currentColor" /></span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-linen">
                <div className="h-full rounded-full bg-cocoa transition-all duration-300" style={{ width: `${selectionProgress}%` }} />
              </div>
              <p className="mt-2 text-xs leading-5 text-coffee/58">
                {selectedIds.length} van {includedCount} inbegrepen beelden gekozen.
              </p>

              {extraCount > 0 ? (
                <p className="mt-4 rounded-md bg-amber-50 px-3 py-3 text-xs leading-5 text-amber-900">
                  Je hebt {extraCount} extra beeld{extraCount === 1 ? "" : "en"} gekozen. Deze worden als extra aanvraag meegestuurd.{extraImagePrice ? ` De extra kosten zijn ${formatEuro(extraCount * extraImagePrice)}.` : ""}
                </p>
              ) : (
                <p className="mt-4 text-xs leading-5 text-coffee/58">Je kunt je selectie tussendoor aanpassen. Pas na het insturen wordt je keuze doorgegeven.</p>
              )}

              <Button type="button" onClick={save} disabled={status === "saving"} className="mt-5 w-full gap-2">
                <Save size={15} /> {status === "saving" ? "Versturen..." : "Selectie insturen"}
              </Button>
            </aside>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-lg bg-card/96 p-3 shadow-[0_12px_40px_rgba(57,38,29,0.24)] backdrop-blur warm-border lg:hidden">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-coffee">{selectedIds.length} gekozen</p>
          <p className="truncate text-[0.68rem] text-coffee/55">{extraCount > 0 ? `${extraCount} extra beeld(en)` : `${includedCount} inbegrepen`}</p>
        </div>
        <Button type="button" onClick={save} disabled={status === "saving"} className="shrink-0 px-4">
          {status === "saving" ? "Bezig..." : "Insturen"}
        </Button>
      </div>

      {activePhoto && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-coffee/95 p-3 text-card backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Foto bekijken">
          <div className="flex items-center justify-between gap-4 pb-3">
            <div>
              <p className="text-sm font-semibold">{readablePhotoTitle(activePhoto, activeIndex)}</p>
              <p className="text-xs text-card/58">Foto {activeIndex + 1} van {visiblePhotos.length}</p>
            </div>
            <button type="button" onClick={closeLightbox} className="relative z-20 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-cocoa/20 bg-card text-coffee shadow-soft transition hover:bg-linen focus:outline-none focus:ring-2 focus:ring-card" aria-label="Foto sluiten" title="Sluiten"><X size={23} strokeWidth={2.2} /></button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            {visiblePhotos.length > 1 && <button type="button" onClick={showPrevious} className="absolute left-0 z-10 grid h-11 w-11 place-items-center rounded-full border border-card/25 bg-coffee/55 sm:left-3" aria-label="Vorige foto"><ArrowLeft size={20} /></button>}
            <img src={galleryPhotoUrl(activePhoto, secureToken, "full")} alt={activePhoto.alt_text || readablePhotoTitle(activePhoto, activeIndex)} className="max-h-full max-w-full rounded-md object-contain" />
            {visiblePhotos.length > 1 && <button type="button" onClick={showNext} className="absolute right-0 z-10 grid h-11 w-11 place-items-center rounded-full border border-card/25 bg-coffee/55 sm:right-3" aria-label="Volgende foto"><ArrowRight size={20} /></button>}
          </div>
          <div className="mx-auto mt-3 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 rounded-lg bg-card p-3 text-coffee sm:p-4">
            <p className="text-xs text-coffee/58">Gebruik het hartje om deze foto aan je selectie toe te voegen.</p>
            <button type="button" onClick={() => toggleFavorite(activePhoto.id)} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.1em] ${selectedIds.includes(activePhoto.id) ? "bg-cocoa text-card" : "border border-cocoa/25 text-coffee"}`}>
              {selectedIds.includes(activePhoto.id) ? <Check size={15} /> : <Heart size={15} />} {selectedIds.includes(activePhoto.id) ? "Gekozen" : "Kies deze foto"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function GalleryStat({ label, value, accent = false, warning = false }) {
  return (
    <div className={`border-cocoa/10 px-4 py-4 text-center [&:not(:last-child)]:border-r sm:px-6 ${accent ? "bg-linen/55" : ""}`}>
      <p className="fine-label text-[0.58rem] font-semibold text-cocoa">{label}</p>
      <p className={`display-title mt-1 text-3xl font-semibold ${warning ? "text-amber-800" : "text-coffee"}`}>{value}</p>
    </div>
  );
}

function FilterButton({ active, onClick, label }) {
  return <button type="button" onClick={onClick} className={`min-h-9 rounded-full px-4 text-[0.65rem] font-semibold uppercase tracking-[0.1em] transition ${active ? "bg-cocoa text-card" : "text-coffee/65 hover:bg-linen"}`}>{label}</button>;
}

function GalleryState({ title, text }) {
  return (
    <section className="container-soft grid min-h-[70vh] place-items-center pt-32">
      <div className="max-w-lg rounded-lg bg-card px-8 py-12 text-center shadow-soft warm-border">
        <Images className="mx-auto text-cocoa" size={28} />
        <h1 className="display-title mt-4 text-3xl font-semibold text-coffee">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-coffee/62">{text}</p>
      </div>
    </section>
  );
}

function readablePhotoTitle(photo, index) {
  const title = String(photo?.title || "").trim();
  const filename = String(photo?.filename || "").trim();
  return !title || title === filename || title.startsWith("cuddling-memories-klantgalerij-") ? `Foto ${index + 1}` : title;
}

const formatEuro = (value) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value || 0));
