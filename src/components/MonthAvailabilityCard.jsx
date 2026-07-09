import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Link } from "react-router-dom";
import { getMonthStatusGroup, getMonthStatusLabel, getMonthStatusStyle } from "../lib/monthAvailability.js";

const statusContent = {
  green: {
    text: "Er zijn nog genoeg plekken beschikbaar.",
    button: "Kies shoot voor deze maand",
    className: "border-cocoa bg-cocoa text-card shadow-glow hover:-translate-y-0.5 hover:bg-coffee",
  },
  orange: {
    text: "Deze maand raakt redelijk vol. Boek op tijd als je deze maand wilt.",
    button: "Kies shoot voor deze maand",
    className: "border-clay bg-clay text-coffee hover:-translate-y-0.5 hover:bg-cocoa hover:text-card",
  },
  red: {
    text: "Deze maand is vol of niet beschikbaar.",
    button: "Aanmelden voor wachtlijst",
    className: "border-coffee bg-coffee text-card hover:-translate-y-0.5 hover:bg-cocoa",
  },
};

export default function MonthAvailabilityCard({ month }) {
  const date = new Date(month.year, month.month - 1, 1);
  const style = getMonthStatusStyle(month.status);
  const group = getMonthStatusGroup(month.status);
  const content = statusContent[group];
  const slug = `${month.year}-${String(month.month).padStart(2, "0")}`;
  const waitlistOnly = group === "red";

  return (
    <article className={`flex h-full flex-col rounded-lg p-6 shadow-soft transition duration-300 hover:-translate-y-1 ${style.card}`}>
      <p className="fine-label text-[0.64rem] font-semibold text-cocoa">{format(date, "yyyy")}</p>
      <h3 className="display-title mt-1 text-2xl font-semibold capitalize text-coffee">{format(date, "MMMM", { locale: nl })}</h3>
      <div className="mt-3">
        <span className={`fine-label inline-flex items-center rounded-full px-3 py-1 text-[0.62rem] font-semibold ${style.badge}`}>
          {getMonthStatusLabel(month.status)}
        </span>
      </div>
      <p className="mt-4 flex-1 text-sm leading-7 text-coffee/75">{content.text}</p>
      <Link
        to={waitlistOnly ? `/contact?wachtlijst=${slug}#boeken` : `/contact?maand=${slug}#boeken`}
        className={`mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full border px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] transition ${content.className}`}
      >
        {content.button}
      </Link>
    </article>
  );
}
