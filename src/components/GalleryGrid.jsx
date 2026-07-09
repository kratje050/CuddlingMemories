import { MessageSquare } from "lucide-react";
import FavoriteButton from "./FavoriteButton.jsx";

const gridClass = (index) => {
  if (index % 10 === 0) return "md:col-span-2 md:row-span-2";
  if (index % 10 === 5) return "md:col-span-2";
  return "";
};

export default function GalleryGrid({ photos, selectedIds, notes, onToggleFavorite, onNoteChange, onOpen }) {
  return (
    <div className="grid auto-rows-[18rem] gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo, index) => {
        const selected = selectedIds.includes(photo.id);
        return (
          <article
            key={photo.id}
            className={`group relative overflow-hidden rounded-lg bg-card shadow-soft warm-border ${gridClass(index)}`}
          >
            <button type="button" onClick={() => onOpen(index)} className="absolute inset-0 z-0" aria-label="Open foto">
              <img
                src={photo.image_url}
                alt={photo.alt_text || photo.title || "Foto in klantgalerij"}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </button>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-coffee/76 via-coffee/14 to-transparent opacity-85" />
            <FavoriteButton active={selected} onClick={() => onToggleFavorite(photo.id)} />
            <div className="absolute inset-x-0 bottom-0 z-10 p-4 text-card">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="fine-label text-[0.58rem] font-semibold text-card/75">Foto {index + 1}</p>
                  <p className="mt-1 line-clamp-1 text-sm font-semibold drop-shadow">{photo.title || photo.filename || "Foto"}</p>
                </div>
                {selected && <span className="rounded-full bg-card px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cocoa">Gekozen</span>}
              </div>
              <label className="mt-3 block">
                <span className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-card/75">
                  <MessageSquare size={12} /> Notitie
                </span>
                <textarea
                  rows={2}
                  value={notes[photo.id] || ""}
                  onChange={(event) => onNoteChange(photo.id, event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  placeholder="Bijv. graag deze foto"
                  className="w-full resize-none rounded-md border border-card/20 bg-card/92 px-3 py-2 text-xs text-coffee outline-none focus:border-card"
                />
              </label>
            </div>
          </article>
        );
      })}
    </div>
  );
}
