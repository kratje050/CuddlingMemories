import { format } from "date-fns";
import { nl } from "date-fns/locale";
import AvailabilityStatusBadge from "../../components/AvailabilityStatusBadge.jsx";
import AdminButton from "./AdminButton.jsx";

export default function MonthPlanningTable({ months, loading, onSelect }) {
  if (loading) return <p className="text-sm text-coffee/70">Laden...</p>;

  return (
    <div className="overflow-x-auto rounded-lg bg-card shadow-soft warm-border">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-coffee/50">
            <th className="px-4 py-3">Maand</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Boekingen</th>
            <th className="px-4 py-3">Bevestigd</th>
            <th className="px-4 py-3">Openstaand</th>
            <th className="px-4 py-3">Resterend</th>
            <th className="px-4 py-3">Geblokkeerde dagen</th>
            <th className="px-4 py-3">Gesloten</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => {
            const date = new Date(month.year, month.month - 1, 1);
            return (
              <tr key={`${month.year}-${month.month}`} className="border-t border-cocoa/10">
                <td className="px-4 py-3 font-semibold capitalize text-coffee">{format(date, "MMMM yyyy", { locale: nl })}</td>
                <td className="px-4 py-3">
                  <AvailabilityStatusBadge status={month.status} />
                </td>
                <td className="px-4 py-3 text-coffee/80">{month.totalRequests}</td>
                <td className="px-4 py-3 text-coffee/80">{month.confirmedCount}</td>
                <td className="px-4 py-3 text-coffee/80">{month.pendingCount}</td>
                <td className="px-4 py-3 text-coffee/80">
                  {month.remaining} / {month.capacity}
                </td>
                <td className="px-4 py-3 text-coffee/80">{month.blockedDays}</td>
                <td className="px-4 py-3 text-coffee/80">{month.isClosed ? "Ja" : "Nee"}</td>
                <td className="px-4 py-3 text-right">
                  <AdminButton type="button" variant="secondary" onClick={() => onSelect(month)}>
                    Beheren
                  </AdminButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
