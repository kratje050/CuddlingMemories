import { Calendar, Image, MapPin } from "lucide-react";
import Button from "./Button.jsx";
import { formatDate } from "../lib/formatDate.js";

export default function MiniSessionCard({ session }) {
  return (
    <article className="overflow-hidden rounded-lg bg-card shadow-soft warm-border">
      <img
        src={session.cover_image_url || "/images/home-hero-cakesmash.png"}
        alt={session.title}
        loading="lazy"
        className="aspect-[5/3] w-full object-cover"
      />
      <div className="grid gap-4 p-5">
        <div>
          <p className="fine-label text-[0.62rem] text-cocoa">{session.status}</p>
          <h2 className="display-title mt-1 text-3xl font-semibold text-coffee">{session.title}</h2>
          <p className="mt-2 text-sm leading-6 text-coffee/72">{session.description}</p>
        </div>
        <div className="grid gap-2 text-sm text-coffee/72">
          <span className="flex items-center gap-2"><Calendar size={15} /> {formatDate(session.date)}</span>
          <span className="flex items-center gap-2"><Image size={15} /> {session.included_images || 0} beelden inbegrepen</span>
          <span className="flex items-center gap-2"><MapPin size={15} /> {session.location || "Locatie volgt"}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="display-title text-2xl font-semibold text-coffee">EUR {Number(session.price || 0).toFixed(0)}</p>
          <Button to={`/mini-shoots/${session.slug}`}>Bekijk tijden</Button>
        </div>
      </div>
    </article>
  );
}
