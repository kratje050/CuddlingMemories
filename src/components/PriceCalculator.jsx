import { Calculator } from "lucide-react";
import { useMemo, useState } from "react";
import Button from "./Button.jsx";

const formatEuro = (value) => `EUR ${value.toFixed(2).replace(".", ",")}`;

export default function PriceCalculator({ packages }) {
  const bookablePackages = useMemo(() => packages.filter((item) => item.price_unit === "shoot"), [packages]);
  const extraImagePrice = packages.find((item) => item.price_unit === "item")?.price || 0;
  const travelPricePerKm = packages.find((item) => item.price_unit === "km")?.price || 0;

  const [selectedId, setSelectedId] = useState(bookablePackages[0]?.id || "");
  const [extraImages, setExtraImages] = useState(0);
  const [travelSingleKm, setTravelSingleKm] = useState(0);

  const selectedPackage = bookablePackages.find((item) => item.id === selectedId) || bookablePackages[0];
  const travelRoundTripKm = Math.max(0, Number(travelSingleKm) || 0) * 2;

  const total = useMemo(() => {
    if (!selectedPackage) return 0;
    const base = Number(selectedPackage.price);
    const extras = Math.max(0, Number(extraImages) || 0) * Number(extraImagePrice);
    const travel = travelRoundTripKm * Number(travelPricePerKm);
    return base + extras + travel;
  }, [selectedPackage, extraImages, travelRoundTripKm, extraImagePrice, travelPricePerKm]);

  if (!selectedPackage) return null;

  return (
    <div className="mx-auto max-w-5xl rounded-lg bg-card p-6 shadow-soft warm-border md:p-8">
      <div className="mb-6 flex items-center justify-center gap-2 text-cocoa">
        <Calculator size={20} />
        <h2 className="fine-label text-sm font-semibold">Bereken je richtprijs</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Pakket
          <select
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa"
          >
            {bookablePackages.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({formatEuro(Number(item.price))})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Extra beelden
          <input
            type="number"
            min="0"
            value={extraImages}
            onChange={(event) => setExtraImages(event.target.value)}
            className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa"
          />
        </label>
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Reisafstand enkele reis vanaf Zoutkamp of Gouda (km)
          <input
            type="number"
            min="0"
            value={travelSingleKm}
            onChange={(event) => setTravelSingleKm(event.target.value)}
            className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa"
          />
          <span className="text-xs font-normal leading-5 text-coffee/55">
            Vul de afstand heen in. De calculator rekent automatisch heen en terug.
          </span>
        </label>
      </div>
      <div className="mt-7 flex flex-col items-center gap-4 rounded-lg bg-linen p-6 text-center warm-border sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="fine-label text-[0.62rem] text-cocoa">Richtprijs</p>
          <p className="display-title text-3xl font-semibold text-coffee">{formatEuro(total)}</p>
          <p className="mt-1 text-xs text-coffee/65">
            {selectedPackage.title} · {extraImages || 0} extra beeld(en) · {travelSingleKm || 0} km enkele reis / {travelRoundTripKm} km retour
          </p>
        </div>
        <Button to={`/contact?shoot=${encodeURIComponent(selectedPackage.shoot_type || "Anders")}`}>Boek deze shoot</Button>
      </div>
      <p className="mt-4 text-center text-xs text-coffee/60">
        Dit is een richtprijs op basis van de vanaf-tarieven. Bij een locatie-afspraak worden reiskosten standaard als retourafstand berekend vanaf mijn locatie in Zoutkamp of Gouda.
      </p>
    </div>
  );
}
