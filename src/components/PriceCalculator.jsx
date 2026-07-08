import { Calculator } from "lucide-react";
import { useMemo, useState } from "react";
import { packages } from "../data/packages.js";
import Button from "./Button.jsx";

const parsePrice = (price) => Number(price.replace("€", "").replace(",", ".").trim());

const bookablePackages = packages.filter((item) => item.shoot !== "Anders");
const extraImagePrice = parsePrice(packages.find((item) => item.name === "Extra beeld").price);
const travelPricePerKm = parsePrice(packages.find((item) => item.name === "Reiskosten").price);

const formatEuro = (value) => `€${value.toFixed(2).replace(".", ",")}`;

export default function PriceCalculator() {
  const [selected, setSelected] = useState(bookablePackages[0].name);
  const [extraImages, setExtraImages] = useState(0);
  const [travelKm, setTravelKm] = useState(0);

  const selectedPackage = bookablePackages.find((item) => item.name === selected);

  const total = useMemo(() => {
    const base = parsePrice(selectedPackage.price);
    const extras = Math.max(0, Number(extraImages) || 0) * extraImagePrice;
    const travel = Math.max(0, Number(travelKm) || 0) * travelPricePerKm;
    return base + extras + travel;
  }, [selectedPackage, extraImages, travelKm]);

  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-lg bg-card p-6 shadow-soft warm-border md:p-8">
      <div className="mb-6 flex items-center justify-center gap-2 text-cocoa">
        <Calculator size={20} />
        <h2 className="fine-label text-sm font-semibold">Bereken je richtprijs</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Pakket
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa"
          >
            {bookablePackages.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name} ({item.price})
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
          Reisafstand (km)
          <input
            type="number"
            min="0"
            value={travelKm}
            onChange={(event) => setTravelKm(event.target.value)}
            className="rounded-lg border border-cocoa/20 bg-cream px-4 py-3 text-sm outline-none transition focus:border-cocoa"
          />
        </label>
      </div>
      <div className="mt-7 flex flex-col items-center gap-4 rounded-lg bg-linen p-6 text-center warm-border sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="fine-label text-[0.62rem] text-cocoa">Richtprijs</p>
          <p className="display-title text-3xl font-semibold text-coffee">{formatEuro(total)}</p>
          <p className="mt-1 text-xs text-coffee/65">
            {selectedPackage.name} · {extraImages || 0} extra beeld(en) · {travelKm || 0} km reiskosten
          </p>
        </div>
        <Button to={`/contact?shoot=${encodeURIComponent(selectedPackage.shoot)}`}>Boek deze shoot</Button>
      </div>
      <p className="mt-4 text-center text-xs text-coffee/60">
        Dit is een richtprijs op basis van de vanaf-tarieven. De definitieve prijs stemmen we samen af.
      </p>
    </div>
  );
}
