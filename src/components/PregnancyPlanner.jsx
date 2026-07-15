import { useMemo, useState } from "react";
import { Baby, CalendarDays } from "lucide-react";
import Button from "./Button.jsx";
import { formatDate } from "../lib/formatDate.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function dateWeeksBefore(date, weeks) {
  return new Date(date.getTime() - weeks * 7 * DAY_MS);
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export default function PregnancyPlanner({ compact = false, onPlan }) {
  const [dueDate, setDueDate] = useState("");
  const [multiplePregnancy, setMultiplePregnancy] = useState(false);

  const planningWindow = useMemo(() => {
    const parsed = parseLocalDate(dueDate);
    if (!parsed || Number.isNaN(parsed.getTime())) return null;
    const startWeek = multiplePregnancy ? 24 : 28;
    const endWeek = multiplePregnancy ? 28 : 34;
    const sweetStart = multiplePregnancy ? 25 : 30;
    const sweetEnd = multiplePregnancy ? 27 : 32;
    return {
      startWeek,
      endWeek,
      start: dateWeeksBefore(parsed, 40 - startWeek),
      end: dateWeeksBefore(parsed, 40 - endWeek),
      sweetStart,
      sweetEnd,
      sweetStartDate: dateWeeksBefore(parsed, 40 - sweetStart),
      sweetEndDate: dateWeeksBefore(parsed, 40 - sweetEnd),
    };
  }, [dueDate, multiplePregnancy]);

  return (
    <div className={`rounded-lg border border-cocoa/15 bg-linen/55 ${compact ? "p-4" : "p-6 md:p-8"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-card text-cocoa shadow-soft">
          <Baby size={20} />
        </span>
        <div>
          <p className="fine-label text-[0.65rem] font-semibold text-cocoa">Zwangerschapstermijnplanner</p>
          <h2 className={`display-title mt-1 font-semibold text-coffee ${compact ? "text-2xl" : "text-3xl"}`}>
            Vind een fijn moment voor je shoot
          </h2>
          <p className="mt-2 text-sm leading-6 text-coffee/70">
            Vul je uitgerekende datum in. De planner laat zien in welke periode een zwangerschapsshoot vaak wordt gepland.
          </p>
        </div>
      </div>

      <div className={`mt-5 grid gap-4 ${compact ? "" : "md:grid-cols-[1fr_auto] md:items-end"}`}>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Uitgerekende datum
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="min-h-12 rounded-lg border border-cocoa/20 bg-card px-4 py-3 text-sm outline-none focus:border-cocoa"
          />
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-lg border border-cocoa/15 bg-card px-4 py-3 text-sm text-coffee/75">
          <input
            type="checkbox"
            checked={multiplePregnancy}
            onChange={(event) => setMultiplePregnancy(event.target.checked)}
            className="h-4 w-4 accent-cocoa"
          />
          Ik verwacht een meerling
        </label>
      </div>

      {planningWindow && (
        <div className="mt-5 rounded-lg bg-card p-5 shadow-soft warm-border">
          <div className="flex gap-3">
            <CalendarDays size={20} className="mt-0.5 shrink-0 text-cocoa" />
            <div>
              <p className="text-sm font-semibold text-coffee">
                Week {planningWindow.startWeek}-{planningWindow.endWeek}: {formatDate(planningWindow.start)} t/m {formatDate(planningWindow.end)}
              </p>
              <p className="mt-2 text-sm leading-6 text-coffee/70">
                Vaak gekozen: week {planningWindow.sweetStart}-{planningWindow.sweetEnd}, ongeveer {formatDate(planningWindow.sweetStartDate)} t/m {formatDate(planningWindow.sweetEndDate)}.
              </p>
            </div>
          </div>
          <Button
            type={onPlan ? "button" : undefined}
            to={onPlan ? undefined : "/boek-een-shoot?shoot=Zwangerschapsshoot"}
            onClick={onPlan ? () => onPlan(planningWindow.sweetStartDate) : undefined}
            className="mt-5 w-full sm:w-auto"
          >
            Plan zwangerschapsshoot
          </Button>
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-coffee/55">
        Dit is een fotografische planningshulp, geen medisch advies. Elke zwangerschap verloopt anders; kies vooral een moment dat goed voelt en overleg bij bijzonderheden.
      </p>
    </div>
  );
}
