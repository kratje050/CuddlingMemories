import { Check, Expand, MessageSquare } from "lucide-react";
import FavoriteButton from "./FavoriteButton.jsx";

export default function GalleryGrid({ photos, selectedIds, notes, onToggleFavorite, onNoteChange, onOpen }) {
  return (
    <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
      {photos.map((photo, index) => {
        const selected = selectedIds.includes(photo.id);
        const title = readablePhotoTitle(photo, index);

        return (
          <article
            key={photo.id}
            className={`mb-5 break-inside-avoid overflow-hidden rounded-lg bg-card shadow-soft transition duration-300 warm-border ${
              selected ? "ring-2 ring-cocoa ring-offset-2 ring-offset-cream" : "hover:-translate-y-0.5"
            }`}
          >
            <div className="group relative overflow-hidden bg-linen/45">
              <button type="button" onClick={() => onOpen(index)} className="block w-full" aria-label={`Bekijk ${title} groot`}>
                <img
                  src={photo.image_url}
                  alt={photo.alt_text || title}
                  loading="lazy"
                  className="h-auto max-h-[42rem] w-full object-contain transition duration-500 group-hover:scale-[1.015]"
                />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-coffee/72 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-card opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
                  <Expand size={13} /> Bekijk groot
                </span>
              </button>
              <FavoriteButton active={selected} onClick={() => onToggleFavorite(photo.id)} />
              <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-coffee shadow-soft backdrop-blur-sm">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-coffee">{title}</p>
                  <p className="mt-1 text-xs text-coffee/52">{selected ? "Toegevoegd aan je selectie" : "Tik op het hartje om te kiezen"}</p>
                </div>
                {selected && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-linen px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-cocoa">
                    <Check size={12} /> Gekozen
                  </span>
                )}
              </div>

              {selected && (
                <label className="mt-4 block border-t border-cocoa/10 pt-3">
                  <span className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-cocoa">
                    <MessageSquare size={12} /> Notitie bij deze foto
                  </span>
                  <textarea
                    rows={2}
                    value={notes[photo.id] || ""}
                    onChange={(event) => onNoteChange(photo.id, event.target.value)}
                    placeholder="Bijvoorbeeld een uitsnede of kleine aanpassing"
                    className="w-full resize-none rounded-md border border-cocoa/18 bg-cream px-3 py-2.5 text-xs leading-5 text-coffee outline-none transition placeholder:text-coffee/35 focus:border-cocoa"
                  />
                </label>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function readablePhotoTitle(photo, index) {
  const title = String(photo.title || "").trim();
  const filename = String(photo.filename || "").trim();
  const looksAutomatic = !title || title === filename || title.startsWith("cuddling-memories-klantgalerij-");
  return looksAutomatic ? `Foto ${index + 1}` : title;
}
