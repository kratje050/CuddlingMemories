import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "../../lib/supabaseClient.js";

const dayShort = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
const HOUR_START = 7;
const HOUR_END = 21;
const PX_PER_HOUR = 52;

const statusColors = {
  Nieuw: "border-amber-300 bg-amber-100 text-amber-900",
  Gelezen: "border-amber-200 bg-amber-50 text-amber-800",
  "Contact opgenomen": "border-sky-300 bg-sky-100 text-sky-900",
  "Wacht op reactie": "border-sky-200 bg-sky-50 text-sky-800",
  "Datum ingepland": "border-emerald-300 bg-emerald-100 text-emerald-900",
  "Aanbetaling gevraagd": "border-purple-300 bg-purple-100 text-purple-900",
  "Aanbetaling ontvangen": "border-purple-200 bg-purple-50 text-purple-800",
  "Shoot geweest": "border-cocoa/30 bg-cocoa/20 text-coffee",
  "Galerij verstuurd": "border-cocoa/25 bg-cocoa/15 text-coffee",
  Afgerond: "border-emerald-400 bg-emerald-200 text-emerald-950",
  Geannuleerd: "border-red-300 bg-red-100 text-red-800 line-through",
  Gearchiveerd: "border-cocoa/15 bg-linen text-coffee/50",
};

function toMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function minutesFromDrop(clientY, columnTop) {
  const relPx = clientY - columnTop;
  const minutesFromStart = (relPx / PX_PER_HOUR) * 60;
  const totalMinutes = HOUR_START * 60 + minutesFromStart;
  const snapped = Math.round(totalMinutes / 15) * 15;
  const clamped = Math.min(Math.max(snapped, HOUR_START * 60), HOUR_END * 60 - 15);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function BookingBlock({ booking, onClick, draggable, onDragStart }) {
  const startMin = toMinutes(booking.start_time);
  const endMin = toMinutes(booking.end_time) ?? (startMin != null ? startMin + 60 : null);
  if (startMin == null) return null;

  const top = ((startMin - HOUR_START * 60) / 60) * PX_PER_HOUR;
  const height = Math.max(((endMin - startMin) / 60) * PX_PER_HOUR, 20);
  const colorClass = statusColors[booking.status] || "border-cocoa/25 bg-card text-coffee";

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={() => onClick(booking)}
      style={{ top: `${top}px`, height: `${height}px` }}
      className={`absolute inset-x-0.5 z-10 overflow-hidden rounded-md border px-1.5 py-1 text-left text-[0.68rem] leading-tight shadow-sm transition hover:z-20 hover:shadow-md ${colorClass}`}
    >
      <p className="truncate font-semibold">{booking.start_time?.slice(0, 5)} {booking.customer_name}</p>
      <p className="truncate">{booking.shoot_type}</p>
    </button>
  );
}

export default function AdminCalendar({ view, date, onViewChange, onDateChange, onBookingClick }) {
  const [bookings, setBookings] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragError, setDragError] = useState("");

  const rangeStart = useMemo(() => {
    if (view === "month") return startOfWeek(startOfMonth(date), { weekStartsOn: 0 });
    if (view === "week") return startOfWeek(date, { weekStartsOn: 0 });
    return date;
  }, [view, date]);

  const rangeEnd = useMemo(() => {
    if (view === "month") return endOfWeek(endOfMonth(date), { weekStartsOn: 0 });
    if (view === "week") return endOfWeek(date, { weekStartsOn: 0 });
    return date;
  }, [view, date]);

  const days = useMemo(() => {
    if (view === "day") return [date];
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }, [view, date, rangeStart, rangeEnd]);

  const load = async () => {
    setLoading(true);
    const fromStr = format(rangeStart, "yyyy-MM-dd");
    const toStr = format(rangeEnd, "yyyy-MM-dd");
    const [{ data: bookingRows }, { data: blockedRows }] = await Promise.all([
      supabase.from("bookings").select("*").gte("booking_date", fromStr).lte("booking_date", toStr).not("booking_date", "is", null),
      supabase.from("blocked_periods").select("*").lte("start_datetime", `${toStr}T23:59:59`).gte("end_datetime", `${fromStr}T00:00:00`),
    ]);
    setBookings(bookingRows || []);
    setBlocked(blockedRows || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeStart.getTime(), rangeEnd.getTime()]);

  const navigate = (direction) => {
    if (view === "month") onDateChange(direction > 0 ? addMonths(date, 1) : subMonths(date, 1));
    else if (view === "week") onDateChange(direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1));
    else onDateChange(addDays(date, direction));
  };

  const bookingsForDay = (day) => bookings.filter((b) => b.booking_date === format(day, "yyyy-MM-dd"));
  const isDayBlocked = (day) =>
    blocked.some((b) => {
      const start = new Date(b.start_datetime);
      const end = new Date(b.end_datetime);
      return b.all_day && day >= new Date(start.toDateString()) && day <= new Date(end.toDateString());
    });

  const handleDrop = async (event, day) => {
    event.preventDefault();
    setDragError("");
    const bookingId = event.dataTransfer.getData("text/booking-id");
    if (!bookingId) return;
    const columnTop = event.currentTarget.getBoundingClientRect().top;
    const newStartTime = minutesFromDrop(event.clientY, columnTop);
    const newDate = format(day, "yyyy-MM-dd");

    const { error } = await supabase.rpc("reschedule_booking", {
      p_booking_id: bookingId,
      p_new_date: newDate,
      p_new_start_time: newStartTime,
    });

    if (error) {
      setDragError(
        error.message === "SLOT_TAKEN"
          ? "Dit moment overlapt met een andere boeking. Kies een ander moment."
          : "Herplannen is niet gelukt."
      );
    }
    load();
  };

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  return (
    <div className="rounded-lg bg-card p-4 shadow-soft warm-border sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-cocoa/25 text-coffee hover:bg-linen">
            <ChevronLeft size={18} />
          </button>
          <p className="display-title min-w-[10rem] text-center text-lg font-semibold capitalize text-coffee">
            {view === "month" && format(date, "MMMM yyyy", { locale: nl })}
            {view === "week" && `Week van ${format(rangeStart, "d MMM", { locale: nl })}`}
            {view === "day" && format(date, "EEEE d MMMM yyyy", { locale: nl })}
          </p>
          <button type="button" onClick={() => navigate(1)} className="grid h-9 w-9 place-items-center rounded-full border border-cocoa/25 text-coffee hover:bg-linen">
            <ChevronRight size={18} />
          </button>
          <button type="button" onClick={() => onDateChange(new Date())} className="ml-2 rounded-full border border-cocoa/25 px-3 py-1.5 text-xs font-semibold text-coffee hover:bg-linen">
            Vandaag
          </button>
        </div>
        <div className="flex gap-1.5 rounded-full bg-linen/70 p-1">
          {["month", "week", "day"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onViewChange(v)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${view === v ? "bg-cocoa text-card" : "text-coffee/70 hover:bg-card"}`}
            >
              {v === "month" ? "Maand" : v === "week" ? "Week" : "Dag"}
            </button>
          ))}
        </div>
      </div>

      {dragError && <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800">{dragError}</p>}
      {loading && <p className="text-sm text-coffee/60">Laden...</p>}

      {!loading && view === "month" && (
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase text-coffee/50">
            {dayShort.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = isSameMonth(day, date);
              const dayBookings = bookingsForDay(day);
              const blockedDay = isDayBlocked(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => {
                    onDateChange(day);
                    onViewChange("day");
                  }}
                  className={`min-h-[5.5rem] rounded-md border p-1.5 text-left align-top text-xs transition hover:border-cocoa/50 ${
                    inMonth ? "border-cocoa/15 bg-cream" : "border-transparent text-coffee/25"
                  } ${blockedDay ? "bg-linen/80" : ""}`}
                >
                  <p className={`font-semibold ${isSameDay(day, new Date()) ? "text-cocoa" : "text-coffee"}`}>{format(day, "d")}</p>
                  {blockedDay && <p className="mt-1 truncate rounded bg-cocoa/15 px-1 text-[0.6rem] text-coffee">Geblokkeerd</p>}
                  <div className="mt-1 grid gap-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <p key={b.id} className={`truncate rounded px-1 text-[0.6rem] ${statusColors[b.status] || "bg-linen"}`}>
                        {b.start_time?.slice(0, 5)} {b.customer_name}
                      </p>
                    ))}
                    {dayBookings.length > 3 && <p className="text-[0.6rem] text-coffee/50">+{dayBookings.length - 3} meer</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!loading && (view === "week" || view === "day") && (
        <div className="overflow-x-auto">
          <div className={`grid ${view === "week" ? "grid-cols-[3rem_repeat(7,minmax(7rem,1fr))]" : "grid-cols-[3rem_1fr]"}`}>
            <div />
            {days.map((day) => (
              <div key={day.toISOString()} className="border-b border-cocoa/15 pb-2 text-center">
                <p className="text-xs font-semibold uppercase text-coffee/50">{format(day, "EEE", { locale: nl })}</p>
                <p className={`text-sm font-semibold ${isSameDay(day, new Date()) ? "text-cocoa" : "text-coffee"}`}>{format(day, "d MMM", { locale: nl })}</p>
              </div>
            ))}

            <div style={{ height: `${(HOUR_END - HOUR_START) * PX_PER_HOUR}px` }} className="relative">
              {hours.map((h) => (
                <p key={h} style={{ top: `${(h - HOUR_START) * PX_PER_HOUR - 7}px` }} className="absolute right-1.5 text-[0.65rem] text-coffee/40">
                  {h}:00
                </p>
              ))}
            </div>

            {days.map((day) => (
              <div
                key={day.toISOString()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, day)}
                style={{ height: `${(HOUR_END - HOUR_START) * PX_PER_HOUR}px` }}
                className={`relative border-l border-cocoa/10 ${isDayBlocked(day) ? "bg-linen/50" : ""}`}
              >
                {hours.map((h) => (
                  <div key={h} style={{ top: `${(h - HOUR_START) * PX_PER_HOUR}px` }} className="absolute inset-x-0 border-t border-cocoa/10" />
                ))}
                {bookingsForDay(day).map((booking) => (
                  <BookingBlock
                    key={booking.id}
                    booking={booking}
                    onClick={onBookingClick}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/booking-id", booking.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.65rem] text-coffee/60">
        {Object.entries(statusColors).map(([status, cls]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full border ${cls.split(" ").slice(0, 2).join(" ")}`} />
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
