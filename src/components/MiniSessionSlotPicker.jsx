export default function MiniSessionSlotPicker({ slots, value, onChange }) {
  const available = slots.filter((slot) => slot.is_available && Number(slot.current_bookings || 0) < Number(slot.max_bookings || 1));

  if (!available.length) {
    return <p className="rounded-lg bg-linen p-4 text-sm text-coffee/70 warm-border">Er zijn op dit moment geen beschikbare tijdslots.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {available.map((slot) => (
        <button
          key={slot.id}
          type="button"
          onClick={() => onChange(slot.id)}
          className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
            value === slot.id ? "border-cocoa bg-cocoa text-card" : "border-cocoa/20 bg-cream text-coffee hover:bg-linen"
          }`}
        >
          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
        </button>
      ))}
    </div>
  );
}
