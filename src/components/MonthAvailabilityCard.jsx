import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Button from "./Button.jsx";
import AvailabilityStatusBadge from "./AvailabilityStatusBadge.jsx";
import { getMonthStatusStyle } from "../lib/monthAvailability.js";

export default function MonthAvailabilityCard({ month }) {
  const date = new Date(month.year, month.month - 1, 1);
  const style = getMonthStatusStyle(month.status);
  const slug = `${month.year}-${String(month.month).padStart(2, "0")}`;

  return (
    <article className={`flex h-full flex-col rounded-lg p-6 shadow-soft transition duration-300 hover:-translate-y-1 ${style.card}`}>
      <p className="fine-label text-[0.64rem] font-semibold text-cocoa">{format(date, "yyyy")}</p>
      <h3 className="display-title mt-1 text-2xl font-semibold capitalize text-coffee">{format(date, "MMMM", { locale: nl })}</h3>
      <div className="mt-3">
        <AvailabilityStatusBadge status={month.status} />
      </div>
      <p className="mt-4 flex-1 text-sm leading-7 text-coffee/75">{month.message}</p>
      <Button to={`/contact?maand=${slug}`} variant="secondary" className="mt-6 w-full">
        Bekijk beschikbare dagen
      </Button>
    </article>
  );
}
