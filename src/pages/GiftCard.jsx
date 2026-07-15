import { Gift, ShieldCheck } from "lucide-react";
import GiftCardForm from "../components/GiftCardForm.jsx";
import SEO from "../components/SEO.jsx";
import SectionTitle from "../components/SectionTitle.jsx";

export default function GiftCard() {
  return (
    <>
      <SEO
        title="Cadeaubon"
        description="Geef een fotoshoot cadeau met een cadeaubon van Cuddling Memories Fotografie."
      />
      <section className="pt-36">
        <div className="container-soft grid gap-10 pb-16 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <SectionTitle centered={false} eyebrow="Cadeaubon" title="Geef een herinnering cadeau" />
            <p className="mt-6 text-base leading-8 text-coffee/78">
              Een cadeaubon voor een fotoshoot is een zacht en waardevol cadeau voor zwangerschap, newborn,
              moederdag, verjaardag, gezin of een mini-shoot. Je kiest een bedrag of pakket en ik stem de verdere
              details met je af.
            </p>
            <div className="mt-7 rounded-lg bg-linen p-5 shadow-soft warm-border">
              <ShieldCheck className="text-cocoa" size={22} />
              <p className="mt-2 text-sm leading-6 text-coffee/75">
                De cadeaubon is pas geldig nadat Cuddling Memories de aanvraag heeft bevestigd en de betaling is
                ontvangen.
              </p>
            </div>
            <div className="mt-7 grid gap-3 text-sm text-coffee/75">
              {["Vrij bedrag", "Portretshoot", "Cakesmash", "Zwangerschapsshoot", "Gezinsshoot", "Newbornshoot", "Bevalling", "Mini-shoot"].map((item) => (
                <span key={item} className="flex items-center gap-2 rounded-lg bg-card px-4 py-3 warm-border">
                  <Gift size={16} className="text-cocoa" /> {item}
                </span>
              ))}
            </div>
          </div>
          <GiftCardForm />
        </div>
      </section>
    </>
  );
}
