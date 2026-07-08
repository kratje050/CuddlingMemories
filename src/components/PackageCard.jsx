import { ArrowRight } from "lucide-react";
import Button from "./Button.jsx";

const formatEuro = (value) => `€${Number(value).toFixed(2).replace(".", ",")}`;

export default function PackageCard({ item }) {
  return (
    <article
      className={`flex h-full flex-col rounded-lg p-7 shadow-soft warm-border transition duration-300 hover:-translate-y-1 ${
        item.is_featured ? "bg-linen" : "bg-card"
      }`}
    >
      {item.is_featured && <p className="fine-label mb-4 text-[0.68rem] font-semibold text-cocoa">Veel gekozen</p>}
      <h3 className="display-title text-3xl font-semibold text-coffee">{item.title}</h3>
      <p className="mt-4 display-title text-5xl font-semibold text-cocoa">{formatEuro(item.price)}</p>
      <p className="mt-4 min-h-14 text-sm leading-7 text-coffee/75">{item.description}</p>
      <Button
        to={`/contact?shoot=${encodeURIComponent(item.shoot_type || "Anders")}`}
        className="mt-8 w-full gap-2 px-4"
        aria-label={`${item.title} boeken`}
      >
        {item.button_text || "Deze shoot boeken"} <ArrowRight size={16} />
      </Button>
    </article>
  );
}
