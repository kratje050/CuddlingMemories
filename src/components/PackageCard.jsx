import { ArrowRight } from "lucide-react";
import Button from "./Button.jsx";
import { formatDepositRule, formatFullPaymentRule } from "../lib/depositRules.js";

const formatEuro = (value) => `€${Number(value).toFixed(2).replace(".", ",")}`;

export default function PackageCard({ item, extraImagePrice }) {
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
      {extraImagePrice && <p className="mt-3 rounded-md bg-cream/70 px-3 py-2 text-xs leading-5 text-coffee/70">Extra foto's bijbestellen: <strong>{extraImagePrice} per stuk</strong></p>}
      <p className="mt-3 text-xs font-semibold leading-5 text-cocoa">{formatDepositRule(item)}</p>
      <p className="mt-1 text-xs leading-5 text-coffee/60">{formatFullPaymentRule(item)}</p>
      {item.cancellation_terms ? <p className="mt-2 text-xs leading-5 text-coffee/60">{item.cancellation_terms}</p> : null}
      <Button
        to={`/boek-een-shoot?shoot=${encodeURIComponent(item.shoot_type || "Anders")}`}
        className="mt-8 w-full gap-2 px-4"
        aria-label={`${item.title} boeken`}
      >
        {item.button_text || "Deze shoot boeken"} <ArrowRight size={16} />
      </Button>
    </article>
  );
}
