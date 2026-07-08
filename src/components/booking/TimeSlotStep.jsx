import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getDaySlots } from "../../lib/bookingAvailability.js";

export default function TimeSlotStep({ date, shootType, value, onSelect }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!date) return undefined;
    let active = true;
    setLoading(true);
    setFailed(false);
    getDaySlots(format(date, "yyyy-MM-dd"), shootType)
      .then((data) => {
        if (active) setSlots(data);
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
  }, [date, shootType]);

  if (!date) return null;

  return (
    <div>
      <p className="mb-4 text-sm font-semibold text-coffee">
        Vrije tijden op <span className="capitalize">{format(date, "EEEE d MMMM yyyy", { locale: nl })}</span>
      </p>

      {loading ? (
        <p className="text-sm text-coffee/60">Tijdsloten laden...</p>
      ) : failed ? (
        <p className="text-sm text-coffee/60">Tijdsloten konden niet geladen worden. Probeer het later opnieuw.</p>
      ) : slots.length === 0 ? (
        <p className="rounded-lg bg-linen/70 p-4 text-sm text-coffee/75">
          Voor deze shoot zijn geen beschikbare momenten gevonden op deze datum. Kies een andere dag.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((slot) => (
            <button
              key={slot.start}
              type="button"
              onClick={() => onSelect(slot)}
              className={`rounded-md border px-3 py-2.5 text-sm font-semibold transition ${
                value?.start === slot.start
                  ? "border-cocoa bg-cocoa text-card"
                  : "border-cocoa/25 bg-card text-coffee hover:border-cocoa/60 hover:bg-linen/60"
              }`}
            >
              {slot.start}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
