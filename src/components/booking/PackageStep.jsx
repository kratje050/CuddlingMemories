import { Check, Plus } from "lucide-react";
import { formatDepositRule, formatFullPaymentRule } from "../../lib/depositRules.js";

export default function PackageStep({ packages, addons = [], value, addonValues = [], onSelect, onToggleAddon, onContinue }) {
  const selectedPackage = packages.find((pkg) => pkg.id === value) || null;
  const selectedAddons = addons.filter((pkg) => addonValues.includes(pkg.id));
  const total = Number(selectedPackage?.price || 0) + selectedAddons.reduce((sum, pkg) => sum + Number(pkg.price || 0), 0);
  const canContinue = packages.length === 0 || Boolean(selectedPackage);

  return (
    <div className="grid gap-6">
      <div>
        <p className="fine-label text-cocoa">Hoofdpakket</p>
        <p className="mt-1 text-xs leading-5 text-coffee/55">Kies één hoofdpakket. Dit bepaalt de shoot, aanbetaling en betaaltermijnen.</p>
        {packages.length === 0 ? (
          <p className="mt-3 rounded-lg bg-linen p-5 text-sm text-coffee/75">Voor deze shoot is geen apart hoofdpakket nodig. De details worden samen afgestemd.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {packages.map((pkg) => {
              const selected = value === pkg.id;
              return <button key={pkg.id} type="button" onClick={() => onSelect(pkg.id)} aria-pressed={selected} className={`relative rounded-lg border p-4 text-left transition ${selected ? "border-cocoa bg-cocoa text-card shadow-glow" : "border-cocoa/20 bg-card text-coffee hover:border-cocoa/50 hover:bg-linen/60"}`}>
                {selected && <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-card text-cocoa"><Check size={14} /></span>}
                <p className="pr-8 text-sm font-semibold">{pkg.title}</p>
                <p className={`mt-1 text-xs ${selected ? "text-card/85" : "text-coffee/65"}`}>
                  {pkg.is_model_discount_price && <span className={`mr-2 line-through ${selected ? "text-card/60" : "text-coffee/40"}`}>EUR {Number(pkg.original_price).toFixed(2)}</span>}
                  <span className={pkg.is_model_discount_price ? "font-semibold" : ""}>EUR {Number(pkg.price).toFixed(2)}</span>{pkg.is_model_discount_price ? " · 50% modelkorting" : ""}{pkg.description ? ` · ${pkg.description}` : ""}
                </p>
                <p className={`mt-2 text-[0.7rem] font-semibold ${selected ? "text-card/90" : "text-cocoa"}`}>{formatDepositRule(pkg)}</p>
                <p className={`mt-1 text-[0.68rem] ${selected ? "text-card/75" : "text-coffee/55"}`}>{formatFullPaymentRule(pkg)}</p>
              </button>;
            })}
          </div>
        )}
      </div>

      {addons.length > 0 && (
        <div className={!selectedPackage && packages.length > 0 ? "opacity-55" : ""}>
          <p className="fine-label text-cocoa">Extra pakketten en add-ons</p>
          <p className="mt-1 text-xs leading-5 text-coffee/55">Je kunt meerdere extra’s toevoegen aan dezelfde afspraak. Ze komen samen op één factuur.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {addons.map((pkg) => {
              const selected = addonValues.includes(pkg.id);
              return <button key={pkg.id} type="button" disabled={!selectedPackage && packages.length > 0} onClick={() => onToggleAddon(pkg.id)} aria-pressed={selected} className={`flex min-h-24 items-start gap-3 rounded-lg border p-4 text-left transition disabled:cursor-not-allowed ${selected ? "border-cocoa bg-linen shadow-soft" : "border-cocoa/20 bg-card hover:border-cocoa/50"}`}>
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${selected ? "border-cocoa bg-cocoa text-card" : "border-cocoa/25 text-cocoa"}`}>{selected ? <Check size={14} /> : <Plus size={14} />}</span>
                <span><span className="block text-sm font-semibold text-coffee">{pkg.title}</span><span className="mt-1 block text-xs text-coffee/65">+ EUR {Number(pkg.price).toFixed(2)}{pkg.description ? ` · ${pkg.description}` : ""}</span></span>
              </button>;
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-linen p-4 warm-border">
        <div><p className="fine-label text-cocoa">Totaal gekozen</p><p className="display-title mt-1 text-2xl font-semibold text-coffee">EUR {total.toFixed(2)}</p><p className="mt-1 text-xs text-coffee/55">{selectedAddons.length} add-on{selectedAddons.length === 1 ? "" : "s"} gekozen</p></div>
        <button type="button" onClick={onContinue} disabled={!canContinue} className="min-h-11 rounded-full bg-cocoa px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-card transition hover:bg-coffee disabled:cursor-not-allowed disabled:opacity-45">Naar de kalender</button>
      </div>
    </div>
  );
}
