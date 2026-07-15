import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { formatDepositRule, formatFullPaymentRule } from "../../lib/depositRules.js";

export default function BookingSummaryContent({ shootType, pkg, addons = [], date, time, details }) {
  const location =
    details?.locationType === "location"
      ? [details?.locationStreet, details?.locationHouseNumber, details?.locationPostalCode, details?.locationCity].filter(Boolean).join(" ") || "Op locatie"
      : "Bij mij thuis in Zoutkamp";

  const total = Number(pkg?.price || 0) + addons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
  const rows = [
    ["Shoot", shootType || "-"],
    ["Pakket", pkg ? `${pkg.title} (EUR ${Number(pkg.price).toFixed(2)})` : "Geen specifiek pakket"],
    ["Add-ons", addons.length ? addons.map((addon) => `${addon.title} (EUR ${Number(addon.price).toFixed(2)})`).join(", ") : "Geen"],
    ["Totaal", pkg || addons.length ? `EUR ${total.toFixed(2)}` : "Volgens afspraak"],
    ["Aanbetaling", pkg ? formatDepositRule(pkg) : "Niet van toepassing"],
    ["Volledige betaling", pkg ? formatFullPaymentRule(pkg) : "Volgens afspraak"],
    ["Datum", date ? format(date, "EEEE d MMMM yyyy", { locale: nl }) : "-"],
    ["Tijd", time ? `${time.start} - ${time.end}` : "-"],
    ["Locatie", details ? location : "-"],
    ["Naam", details?.naam || "-"],
    ["E-mailadres", details?.email || "-"],
    ["Telefoonnummer", details?.telefoon || "-"],
    ["Voorwaarden", details?.termsAccepted ? "Geaccepteerd" : "Nog niet geaccepteerd"],
    ...(details?.modelUsageConsent ? [["Gebruik modelfoto's", "Toestemming gegeven voor social media en portfolio"]] : []),
  ];

  return (
    <dl className="grid min-w-0 gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="grid min-w-0 grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] items-start gap-3 border-b border-cocoa/10 pb-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-4"
        >
          <dt className="fine-label pt-0.5 text-[0.58rem] text-cocoa sm:text-[0.62rem]">{label}</dt>
          <dd className="min-w-0 break-words text-right leading-5 text-coffee">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
