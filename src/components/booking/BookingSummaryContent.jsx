import { format } from "date-fns";
import { nl } from "date-fns/locale";

export default function BookingSummaryContent({ shootType, pkg, date, time, details }) {
  const location =
    details?.locationType === "location"
      ? details?.omgeving
        ? `Op locatie: ${details.omgeving}`
        : "Op locatie"
      : "Bij mij thuis in Zoutkamp";

  const rows = [
    ["Shoot", shootType || "-"],
    ["Pakket", pkg ? `${pkg.title} (EUR ${Number(pkg.price).toFixed(2)})` : "Geen specifiek pakket"],
    ["Datum", date ? format(date, "EEEE d MMMM yyyy", { locale: nl }) : "-"],
    ["Tijd", time ? `${time.start} - ${time.end}` : "-"],
    ["Locatie", details ? location : "-"],
    ["Naam", details?.naam || "-"],
    ["E-mailadres", details?.email || "-"],
    ["Telefoonnummer", details?.telefoon || "-"],
  ];

  return (
    <dl className="grid gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-cocoa/10 pb-2">
          <dt className="fine-label text-[0.62rem] text-cocoa">{label}</dt>
          <dd className="text-right text-coffee">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
