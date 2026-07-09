import { Heart } from "lucide-react";

export default function FavoriteButton({ active, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full border border-card/70 bg-card/90 shadow-soft transition hover:scale-105 ${
        active ? "text-cocoa" : "text-coffee/55"
      }`}
      aria-label={active ? "Verwijder uit favorieten" : "Kies als favoriet"}
      title={active ? "Gekozen als favoriet" : "Kies als favoriet"}
    >
      <Heart size={18} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
