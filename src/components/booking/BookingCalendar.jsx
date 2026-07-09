import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { nl } from "date-fns/locale";
import { getMonthAvailability } from "../../lib/bookingAvailability.js";

const weekdayLabels = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

const statusStyles = {
  available: "border-cocoa/40 bg-card text-coffee hover:border-cocoa hover:bg-linen/70 cursor-pointer",
  full: "border-transparent bg-linen/40 text-coffee/30 cursor-not-allowed line-through",
  blocked: "border-transparent bg-linen/40 text-coffee/30 cursor-not-allowed line-through",
  closed: "border-transparent text-coffee/25 cursor-not-allowed",
};

export default function BookingCalendar({ shootType, value, onSelect, initialMonth }) {
  const [month, setMonth] = useState(() => startOfMonth(initialMonth || new Date()));
  const [days, setDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initialMonth) {
      setMonth(startOfMonth(initialMonth));
    }
  }, [initialMonth]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    getMonthAvailability(month.getFullYear(), month.getMonth() + 1, shootType)
      .then((data) => {
        if (active) setDays(data);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month, shootType]);

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const today = startOfDay(new Date());
  const hasAvailableDay = Object.values(days).some((status) => status === "available");

  return (
    <div className="rounded-lg bg-card p-4 shadow-soft warm-border sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((current) => subMonths(current, 1))}
          disabled={!isBefore(startOfMonth(today), startOfMonth(month))}
          className="grid h-9 w-9 place-items-center rounded-full border border-cocoa/25 text-coffee transition hover:bg-linen disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="Vorige maand"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="display-title text-lg font-semibold capitalize text-coffee">{format(month, "MMMM yyyy", { locale: nl })}</p>
        <button
          type="button"
          onClick={() => setMonth((current) => addMonths(current, 1))}
          className="grid h-9 w-9 place-items-center rounded-full border border-cocoa/25 text-coffee transition hover:bg-linen"
          aria-label="Volgende maand"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-coffee/50">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-coffee/60">Beschikbaarheid laden...</p>
      ) : failed ? (
        <p className="py-10 text-center text-sm text-coffee/60">
          Beschikbaarheid kon niet geladen worden. Probeer het later opnieuw.
        </p>
      ) : (
        <>
          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {gridDays.map((day) => {
              const inMonth = isSameMonth(day, month);
              const key = format(day, "yyyy-MM-dd");
              const status = inMonth ? days[key] || "closed" : null;
              const selectable = inMonth && status === "available";

              return (
                <button
                  key={key}
                  type="button"
                  disabled={!selectable}
                  onClick={() => selectable && onSelect(day)}
                  className={`aspect-square rounded-md border text-xs font-semibold transition ${
                    !inMonth
                      ? "border-transparent text-transparent"
                      : value && isSameDay(day, value)
                        ? "border-cocoa bg-cocoa text-card"
                        : `${statusStyles[status]} ${isToday(day) ? "ring-1 ring-cocoa/40" : ""}`
                  }`}
                >
                  {inMonth ? format(day, "d") : ""}
                </button>
              );
            })}
          </div>

          {!hasAvailableDay && (
            <p className="mt-4 rounded-lg bg-linen/70 p-4 text-center text-sm text-coffee/75">
              Voor deze maand zijn geen beschikbare momenten gevonden. Probeer een andere maand.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[0.65rem] text-coffee/55">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-cocoa/40 bg-card" /> Beschikbaar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-linen/70" /> Vol / geblokkeerd / gesloten
            </span>
          </div>
        </>
      )}
    </div>
  );
}
