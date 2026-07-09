import { useEffect, useState } from "react";
import SectionTitle from "./SectionTitle.jsx";
import MonthAvailabilityCard from "./MonthAvailabilityCard.jsx";
import { getMonthsAvailability } from "../lib/monthAvailability.js";

export default function MonthAvailabilityOverview({ className = "" }) {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const now = new Date();
    getMonthsAvailability(now.getFullYear(), now.getMonth() + 1)
      .then((data) => {
        if (!active) return;
        setMonths(data);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasAvailableMonths = months.some((month) => month.status !== "unavailable");

  return (
    <div className={className}>
      <SectionTitle
        centered={false}
        eyebrow="Beschikbaarheid"
        title="Beschikbaarheid per maand"
        text="Bekijk hieronder hoe druk de komende maanden zijn. Zo zie je snel of er nog voldoende plek is of dat een maand bijna vol zit."
      />

      {loading && <p className="mt-8 text-center text-sm text-coffee/60">Beschikbaarheid laden...</p>}
      {failed && (
        <p className="mt-8 text-center text-sm text-coffee/60">
          Beschikbaarheid kon niet geladen worden. Probeer het later opnieuw.
        </p>
      )}
      {!loading && !failed && !hasAvailableMonths && (
        <p className="mt-8 text-center text-sm text-coffee/60">
          Er zijn op dit moment nog geen beschikbare maanden zichtbaar. Neem gerust contact op voor de mogelijkheden.
        </p>
      )}

      {!loading && !failed && hasAvailableMonths && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {months.map((month) => (
            <MonthAvailabilityCard key={`${month.year}-${month.month}`} month={month} />
          ))}
        </div>
      )}
    </div>
  );
}
