import { ArrowLeft, ArrowRight, Check, Download, Heart, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Button from "../components/Button.jsx";
import GalleryGrid from "../components/GalleryGrid.jsx";
import SEO from "../components/SEO.jsx";
import { supabase } from "../lib/supabaseClient.js";

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

  useEffect(() => {
    let active = true;
    supabase.rpc("get_gallery_access", { p_token: secureToken }).then(({ data, error }) => {
      if (!active) return;
      if (!error && data?.gallery) {
        setGallery(data.gallery);
        setPhotos(data.photos || []);
        setSelectedIds((data.photos || []).filter((photo) => photo.is_favorite).map((photo) => photo.id));
        setNotes(Object.fromEntries((data.photos || []).map((photo) => [photo.id, photo.client_note || ""])));
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [secureToken]);

  const includedCount = Number(gallery?.included_images || 0);
  const extraCount = useMemo(() => Math.max(selectedIds.length - includedCount, 0), [selectedIds.length, includedCount]);
  const coverPhoto = photos[0]?.image_url || "/images/home-hero-cakesmash.png";
  const visiblePhotos = showSelectedOnly ? photos.filter((photo) => selectedIds.includes(photo.id)) : photos;
  const activePhoto = activeIndex === null ? null : visiblePhotos[activeIndex];

  const toggleFavorite = (id) => {
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
      return;
    }

    await fetch("/api/submit-gallery-selection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secure_token: secureToken,
        base_url: window.location.origin,
      }),
    }).catch(() => null);

    setStatus("success");
    setNotice(extraCount > 0 ? "Je keuze is ontvangen. Je hebt extra beelden gekozen." : "Je keuze is ontvangen. Bedankt voor het doorgeven.");
  };

  const closeLightbox = () => setActiveIndex(null);
  const showPrevious = () => setActiveIndex((current) => (current === null ? null : (current - 1 + visiblePhotos.length) % visiblePhotos.length));
  const showNext = () => setActiveIndex((current) => (current === null ? null : (current + 1) % visiblePhotos.length));

  if (loading) {
    return (
      <section className="container-soft pt-36">
        <p className="text-sm text-coffee/60">Galerij laden...</p>
      </section>
    );
  }

  if (!gallery) {
    return (
      <section className="container-soft pt-36">
        <p className="rounded-lg bg-card p-6 shadow-soft warm-border">Deze galerij is niet beschikbaar of verlopen.</p>
      </section>
    );
  }

  return (
    <>
      <SEO title={`Galerij ${gallery.client_name}`} description="Beveiligde klantgalerij van Cuddling Memories Fotografie." />
      <section className="pt-28">
        <div className="relative min-h-[28rem] overflow-hidden">
          <img src={coverPhoto} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-coffee/82 via-coffee/42 to-coffee/12" />
          <div className="container-soft relative flex min-h-[28rem] items-end pb-10 pt-28">
            <div className="max-w-3xl text-card">
              <p className="fine-label text-xs font-semibold text-card/80">Klantgalerij</p>
              <h1 className="display-title mt-3 text-5xl font-semibold leading-none md:text-7xl">{gallery.title}</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-card/85 md:text-base">
                Kies je favorieten met het hartje, open beelden groot om details te bekijken en stuur je selectie daarna in.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Stat label="Foto's" value={photos.length} />
                <Stat label="Inbegrepen" value={includedCount} />
                <Stat label="Gekozen" value={selectedIds.length} />
                <Stat label="Extra" value={extraCount} />
              </div>
            </div>
          </div>
        </div>

        <div className="container-soft pb-28 pt-10">
          <div className="sticky top-24 z-20 mb-8 rounded-lg bg-card/95 p-4 shadow-soft backdrop-blur warm-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-coffee">Selectie van {gallery.client_name}</p>
                <p className="mt-1 text-xs leading-5 text-coffee/60">
                  {selectedIds.length} gekozen van {includedCount} inbegrepen
                  {extraCount > 0 ? `, ${extraCount} extra beeld(en)` : ""}.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowSelectedOnly(false)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    !showSelectedOnly ? "bg-cocoa text-card" : "border border-cocoa/25 text-coffee hover:bg-linen"
                  }`}
                >
                  Alles
                </button>
                <button
                  type="button"
                  onClick={() => setShowSelectedOnly(true)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    showSelectedOnly ? "bg-cocoa text-card" : "border border-cocoa/25 text-coffee hover:bg-linen"
                  }`}
                >
                  Gekozen
                </button>
                <Button type="button" onClick={save} disabled={status === "saving"} className="gap-2">
                  {status === "saving" ? "Opslaan..." : "Keuze insturen"} <Save size={16} />
                </Button>
              </div>
            </div>
            {extraCount > 0 && (
              <p className="mt-3 rounded-lg bg-linen px-3 py-2 text-xs leading-5 text-coffee/75">
                Je hebt meer beelden gekozen dan inbegrepen. Deze worden als extra beelden aangevraagd.
              </p>
            )}
            {notice && (
              <p className={`mt-3 rounded-lg px-3 py-2 text-xs leading-5 ${status === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"}`}>
                {notice}
              </p>
            )}
          </div>

          {visiblePhotos.length === 0 ? (
            <div className="rounded-lg bg-card p-8 text-center shadow-soft warm-border">
              <Heart className="mx-auto text-cocoa" size={24} />
              <p className="mt-3 text-sm text-coffee/70">Je hebt nog geen beelden gekozen.</p>
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
        </div>
      </section>

      {activePhoto && (
        <div className="fixed inset-0 z-[80] bg-coffee/92 p-4 text-card">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-card/30 bg-card/10"
            aria-label="Sluiten"
          >
            <X size={20} />
          </button>
          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-card/30 bg-card/10"
            aria-label="Vorige foto"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            onClick={showNext}
            className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-card/30 bg-card/10"
            aria-label="Volgende foto"
          >
            <ArrowRight size={20} />
          </button>
          <div className="mx-auto flex h-full max-w-6xl flex-col justify-center gap-4">
            <img src={activePhoto.image_url} alt={activePhoto.title || "Galerijfoto"} className="max-h-[72vh] w-full rounded-lg object-contain" />
            <div className="rounded-lg bg-card p-4 text-coffee shadow-soft warm-border">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{activePhoto.title || activePhoto.filename || "Foto"}</p>
                  <p className="text-xs text-coffee/55">Foto {activeIndex + 1} van {visiblePhotos.length}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={activePhoto.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-cocoa/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-coffee"
                  >
                    <Download size={14} /> Open
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(activePhoto.id)}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${
                      selectedIds.includes(activePhoto.id) ? "bg-cocoa text-card" : "border border-cocoa/25 text-coffee"
                    }`}
                  >
                    <Check size={14} /> {selectedIds.includes(activePhoto.id) ? "Gekozen" : "Kies"}
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={notes[activePhoto.id] || ""}
                onChange={(event) => setNotes((current) => ({ ...current, [activePhoto.id]: event.target.value }))}
                placeholder="Notitie bij deze foto"
                className="mt-3 w-full resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-card/24 bg-card/14 px-4 py-3 backdrop-blur">
      <p className="fine-label text-[0.58rem] font-semibold text-card/70">{label}</p>
      <p className="display-title text-3xl font-semibold leading-none">{value}</p>
    </div>
  );
}
