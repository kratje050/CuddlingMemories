import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

export default function Lightbox({ items, activeIndex, onClose, onPrev, onNext }) {
  useEffect(() => {
    if (activeIndex === null) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrev();
      if (event.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, onClose, onPrev, onNext]);

  if (activeIndex === null) return null;

  const item = items[activeIndex];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-coffee/90 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-card/90 text-coffee shadow-soft transition hover:bg-card"
        aria-label="Sluiten"
      >
        <X size={20} />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPrev();
        }}
        className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-coffee shadow-soft transition hover:bg-card sm:left-6"
        aria-label="Vorige foto"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onNext();
        }}
        className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-card/90 text-coffee shadow-soft transition hover:bg-card sm:right-6"
        aria-label="Volgende foto"
      >
        <ChevronRight size={22} />
      </button>
      <figure
        className="max-h-[85vh] max-w-4xl overflow-hidden rounded-lg shadow-soft"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={item.image} alt={item.title} className="max-h-[75vh] w-full object-contain" />
        <figcaption className="bg-card px-5 py-4 text-center">
          <p className="fine-label text-[0.64rem] font-semibold text-cocoa">{item.category}</p>
          <p className="display-title mt-1 text-xl font-semibold text-coffee">{item.title}</p>
        </figcaption>
      </figure>
    </div>
  );
}
