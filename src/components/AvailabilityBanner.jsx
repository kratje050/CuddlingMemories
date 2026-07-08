import { CalendarCheck } from "lucide-react";
import { availability, statusLabels } from "../data/availability.js";

const dotColors = {
  open: "bg-emerald-500",
  beperkt: "bg-amber-500",
  vol: "bg-red-400",
};

export default function AvailabilityBanner() {
  return (
    <div className="mt-8 rounded-lg bg-linen p-6 shadow-soft warm-border">
      <div className="flex items-center gap-2 text-cocoa">
        <CalendarCheck size={20} />
        <h2 className="fine-label text-sm font-semibold">Beschikbaarheid</h2>
      </div>
      <ul className="mt-4 grid gap-2 text-sm text-coffee/78">
        {availability.map((item) => (
          <li key={item.month} className="flex items-center justify-between gap-3">
            <span>{item.month}</span>
            <span className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${dotColors[item.status]}`} />
              {statusLabels[item.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
