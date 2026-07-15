import { Camera, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ResponsiveImage from "./ResponsiveImage.jsx";

const icons = [Camera, Heart, Sparkles];

export default function CategoryCard({ item, index = 0 }) {
  const Icon = icons[index % icons.length];

  return (
    <Link
      to={`/portfolio?category=${encodeURIComponent(item.category)}`}
      className="group block min-w-0"
      aria-label={`Bekijk ${item.category}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden rounded-lg shadow-soft warm-border">
        <ResponsiveImage
          src={item.image}
          alt={item.category}
          sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-coffee/35 to-transparent opacity-80" />
        <div className="absolute -bottom-5 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border border-cocoa/30 bg-card text-cocoa shadow-glow transition duration-300 group-hover:-translate-y-1">
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>
      <p className="fine-label mt-8 min-h-4 text-center text-[0.68rem] font-semibold text-coffee">{item.category}</p>
    </Link>
  );
}
