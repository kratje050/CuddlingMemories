import { ArrowRight } from "lucide-react";
import Button from "./Button.jsx";

export default function PackageCard({ item }) {
  return (
    <article
      className={`flex h-full flex-col rounded-lg p-7 shadow-soft warm-border transition duration-300 hover:-translate-y-1 ${
        item.featured ? "bg-linen" : "bg-card"
      }`}
    >
      {item.featured && <p className="fine-label mb-4 text-[0.68rem] font-semibold text-cocoa">Veel gekozen</p>}
      <h3 className="display-title text-3xl font-semibold text-coffee">{item.name}</h3>
      <p className="mt-4 display-title text-5xl font-semibold text-cocoa">{item.price}</p>
      <p className="mt-4 min-h-14 text-sm leading-7 text-coffee/75">{item.details}</p>
      <Button
        to={`/contact?shoot=${encodeURIComponent(item.shoot)}`}
        className="mt-8 w-full gap-2 px-4"
        aria-label={`${item.name} boeken`}
      >
        Deze shoot boeken <ArrowRight size={16} />
      </Button>
    </article>
  );
}
