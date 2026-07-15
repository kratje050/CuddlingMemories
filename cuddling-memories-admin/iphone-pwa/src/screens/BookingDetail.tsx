import { addBookingNote, bookingStatuses, getBookingDetail, updateBookingStatus, type Booking, type BookingNote, type BookingTask } from "@shared/index";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader } from "../components/ui";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import { getBookingWeather, getSolarTimes, hasAvailableSlots, isOutdoorBooking, type WeatherDay } from "../lib/weather";
import { formatMobileDate, formatMobileDateTime } from "../lib/formatDate";

const depositStatuses = ["Niet gevraagd", "Gevraagd", "Betaald", "Terugbetaald", "Vervallen"];

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [weather, setWeather] = useState<{ location: string; scheduled: WeatherDay | null } | null>(null);
  const [weatherAlternatives, setWeatherAlternatives] = useState<Array<WeatherDay & { time: string }>>([]);
  const [weatherError, setWeatherError] = useState("");
  const [solar, setSolar] = useState<Record<string, string> | null>(null);
  const [tasks, setTasks] = useState<BookingTask[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [actualShootDate, setActualShootDate] = useState("");

  async function load() {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const result = await getBookingDetail(supabase as any, id);
      setBooking(result.booking);
      setActualShootDate(result.booking?.actual_shoot_date || "");
      setNotes(result.notes);
      const { data: taskRows, error: taskError } = await supabase.from("booking_tasks").select("*").eq("booking_id", id).order("sort_order", { ascending: true });
      if (taskError) throw taskError;
      setTasks((taskRows || []) as BookingTask[]);
    } catch {
      setError("Deze boeking kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!booking?.booking_date || !isOutdoorBooking(booking.shoot_type)) return;
    let active = true;
    setWeatherError("");
    getBookingWeather(booking.location, booking.booking_date)
      .then(async (result) => {
        const candidates = result.days
          .filter((day) => day.date !== booking.booking_date && day.date > new Date().toISOString().slice(0, 10))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        const checked = await Promise.all(candidates.map(async (day) => {
          try {
            const slots = await hasAvailableSlots(day.date, booking.shoot_type);
            return slots.length ? { ...day, time: slots[0].start } : null;
          } catch {
            return null;
          }
        }));
        if (active) {
          setWeather({ location: result.location, scheduled: result.scheduled });
          setWeatherAlternatives(checked.filter(Boolean).slice(0, 3) as Array<WeatherDay & { time: string }>);
        }
      })
      .catch((err) => active && setWeatherError(err instanceof Error ? err.message : "Weer ophalen is niet gelukt."));
    getSolarTimes(booking.booking_date, booking.location).then((result) => active && setSolar(result)).catch(() => {});
    return () => { active = false; };
  }, [booking?.booking_date, booking?.location, booking?.shoot_type]);

  async function setStatus(status: string) {
    if (!id) return;
    setSaving(true);

    try {
      await updateBookingStatus(supabase as any, id, status, user?.email);
      if (status === "Shoot geweest" && !booking?.actual_shoot_date) {
        const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
        await supabase.from("bookings").update({ actual_shoot_date: today }).eq("id", id);
      }
      await load();
    } catch {
      setError("Status aanpassen is niet gelukt.");
    } finally {
      setSaving(false);
    }
  }

  async function saveActualShootDate() {
    if (!id || !actualShootDate) return;
    setSaving(true);
    const { error: updateError } = await supabase.from("bookings").update({ actual_shoot_date: actualShootDate }).eq("id", id);
    if (updateError) setError("Werkelijke shootdatum opslaan is niet gelukt.");
    else await load();
    setSaving(false);
  }

  async function saveNote() {
    if (!id || !note.trim()) return;
    setSaving(true);

    try {
      await addBookingNote(supabase as any, id, note.trim(), user?.email);
      setNote("");
      await load();
    } catch {
      setError("Notitie opslaan is niet gelukt.");
    } finally {
      setSaving(false);
    }
  }

  async function setDepositStatus(status: string) {
    if (!id) return;
    if (status === "Terugbetaald") {
      const typed = window.prompt("Controleer eerst of het bedrag echt is terugbetaald. Typ TERUGBETALEN om de status te wijzigen.");
      if (typed?.trim() !== "TERUGBETALEN") return;
    }
    setSaving(true);
    const { error: updateError } = await supabase.from("bookings").update({ deposit_status: status }).eq("id", id);
    if (updateError) setError("Betaalstatus aanpassen is niet gelukt.");
    else await load();
    setSaving(false);
  }

  async function toggleTask(task: BookingTask) {
    const done = task.status !== "done";
    const { error: taskError } = await supabase.from("booking_tasks").update({ status: done ? "done" : "open", completed_at: done ? new Date().toISOString() : null, completed_by: done ? user?.email || "admin-app" : null }).eq("id", task.id);
    if (taskError) setError("Taak aanpassen is niet gelukt."); else await load();
  }

  async function addTask() {
    if (!id || !newTask.trim()) return;
    const { error: taskError } = await supabase.from("booking_tasks").insert({ booking_id: id, title: newTask.trim(), due_date: newTaskDate || null, sort_order: 90 + tasks.length });
    if (taskError) setError("Taak toevoegen is niet gelukt.");
    else { setNewTask(""); setNewTaskDate(""); await load(); }
  }

  return (
    <>
      <Link to="/bookings" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-cocoa">
        <span>←</span>
        Terug naar boekingen
      </Link>
      <PageHeader title={booking?.customer_name || "Boeking"} subtitle={booking?.shoot_type || "Details"} />
      {error ? <ErrorBox message={error} /> : null}
      {loading ? <EmptyState title="Laden..." text="Ik haal de boeking op." /> : null}
      {booking ? (
        <Card>
          <Badge>{booking.status}</Badge>
          <p className="mt-3 text-sm text-coffee/60">{booking.customer_email}</p>
          <div className="mt-4 grid gap-2 text-sm text-coffee/70">
            {booking.booking_date ? <p>Datum: {formatMobileDate(booking.booking_date)}</p> : null}
            {booking.start_time ? <p>Tijd: {booking.start_time}</p> : null}
            {booking.location ? <p>Locatie: {booking.location}</p> : null}
            <p>Voorwaarden: {booking.terms_accepted_at ? `geaccepteerd op ${formatMobileDateTime(booking.terms_accepted_at)} (${booking.terms_version})` : "niet vastgelegd"}</p>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-coffee/75">{booking.message || "Geen bericht."}</p>
          {booking.questionnaire_answers && Object.values(booking.questionnaire_answers).some(Boolean) ? (
            <div className="mt-4 rounded-xl bg-linen p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">Vragenlijst</p>{Object.entries(questionnaireLabels).map(([key, label]) => booking.questionnaire_answers?.[key] ? <p key={key} className="mt-2 text-sm leading-6 text-coffee/70"><strong>{label}:</strong> {booking.questionnaire_answers[key]}</p> : null)}</div>
          ) : null}
        </Card>
      ) : null}
      {booking && isOutdoorBooking(booking.shoot_type) && booking.booking_date ? (
        <Card className="mt-4">
          <p className="text-lg font-semibold text-coffee">Weersverwachting</p>
          <p className="mt-1 text-xs text-coffee/55">{weather?.location || booking.location || "Zoutkamp"}</p>
          {weatherError ? <p className="mt-3 text-sm text-coffee/70">{weatherError}</p> : null}
          {weather?.scheduled ? <MobileWeatherDay day={weather.scheduled} /> : !weatherError ? <p className="mt-3 text-sm leading-6 text-coffee/65">Voor deze datum is nog geen verwachting beschikbaar. Het weer loopt maximaal zestien dagen vooruit.</p> : null}
          {solar ? <div className="mt-4 rounded-xl bg-linen p-3 text-sm text-coffee/70"><p className="font-semibold text-coffee">Golden hour</p><p className="mt-1">Ochtend: {formatClock(solar.morningGoldenHourStart)}-{formatClock(solar.morningGoldenHourEnd)}</p><p className="mt-1">Avond: {formatClock(solar.eveningGoldenHourStart)}-{formatClock(solar.eveningGoldenHourEnd)}</p><p className="mt-1 text-xs text-coffee/50">Zonsondergang {formatClock(solar.sunset)}</p></div> : null}
          {weatherAlternatives.length ? (
            <div className="mt-4 border-t border-cocoa/15 pt-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-cocoa">Beschikbare alternatieven</p>
              <div className="mt-3 grid gap-3">
                {weatherAlternatives.map((day) => {
                  const subject = encodeURIComponent(`Alternatieve datum voor je ${booking.shoot_type}`);
                  const body = encodeURIComponent(`Hoi ${booking.customer_name},\n\nVoor je buitenshoot lijkt ${formatMobileDate(day.date)} om ${day.time} een mooi alternatief met een gunstigere weersverwachting. Zou deze datum voor jou passen?\n\nLiefs,\nCuddling Memories Fotografie`);
                  return <div key={day.date} className="rounded-xl bg-linen p-3"><MobileWeatherDay day={day} /><a className="mt-2 block text-xs font-bold text-cocoa" href={`mailto:${booking.customer_email}?subject=${subject}&body=${body}`}>Stel deze datum voor</a></div>;
                })}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
      {booking?.deposit_type && booking.deposit_type !== "none" ? (
        <Card className="mt-4">
          <p className="text-lg font-semibold text-coffee">Aanbetaling</p>
          <div className="mt-3 grid gap-2 text-sm text-coffee/70">
            <p>Bedrag: EUR {Number(booking.deposit_amount || 0).toFixed(2)}</p>
            <p>Uiterlijk: {booking.deposit_due_date ? formatMobileDate(booking.deposit_due_date) : "Nog niet bepaald"}</p>
            <p>Betaalmoment: {booking.deposit_due_mode === "booking" ? "Direct bij boeken" : "Voor de shoot"}</p>
            <p>Restbedrag: {booking.full_payment_due_mode === "after_shoot" ? "Na de werkelijke shootdatum" : booking.full_payment_due_mode === "booking" ? "Direct bij boeken" : "Voor de shoot"}</p>
            <p>Het volledige bedrag uiterlijk: {booking.full_payment_due_date ? formatMobileDate(booking.full_payment_due_date) : "Nog niet bepaald"}</p>
            {booking.cancellation_terms ? <p className="leading-6">Annuleren: {booking.cancellation_terms}</p> : null}
          </div>
          {booking.full_payment_due_mode === "after_shoot" ? <div className="mt-4 rounded-xl bg-linen p-3"><label className="grid gap-2 text-xs font-semibold text-coffee">Werkelijke shootdatum<span className="font-normal leading-5 text-coffee/55">Na opslaan begint de termijn voor het restbedrag.</span><input type="date" value={actualShootDate} onChange={(event) => setActualShootDate(event.target.value)} className="rounded-xl border border-cocoa/20 bg-card px-4 py-3 text-sm" /></label><Button onClick={saveActualShootDate} disabled={saving || !actualShootDate} className="mt-3">Datum opslaan</Button></div> : null}
          <select value={booking.deposit_status || "Niet gevraagd"} onChange={(event) => setDepositStatus(event.target.value)} disabled={saving} className="mt-4 w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee">
            {depositStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <p className="mt-2 text-xs leading-5 text-coffee/55">Hiermee houd je bij of de aanbetaling al is gevraagd, ontvangen, terugbetaald of verlopen. Bij Betaald wordt de betaaldatum automatisch opgeslagen.</p>
        </Card>
      ) : null}
      {booking ? (
        <Card className="mt-4">
          <div className="flex items-center justify-between gap-3"><p className="text-lg font-semibold text-coffee">Takenlijst</p><span className="text-xs font-semibold text-cocoa">{tasks.filter((task) => task.status === "done").length}/{tasks.length} klaar</span></div>
          <p className="mt-1 text-xs leading-5 text-coffee/55">Automatische taken bewegen mee met de shootdatum. Tik een taak aan om deze af te ronden.</p>
          <div className="mt-4 grid gap-2">{tasks.map((task) => <button key={task.id} onClick={() => toggleTask(task)} className={`rounded-xl border p-3 text-left ${task.status === "done" ? "border-cocoa/10 bg-linen/40 text-coffee/45" : "border-cocoa/20 bg-cream text-coffee"}`}><span className="text-sm font-semibold">{task.status === "done" ? "✓ " : "○ "}{task.title}</span>{task.due_date ? <span className="mt-1 block text-xs text-cocoa">Uiterlijk {formatMobileDate(task.due_date)}</span> : null}</button>)}</div>
          <div className="mt-4 grid gap-2 rounded-xl bg-linen p-3"><input value={newTask} onChange={(event) => setNewTask(event.target.value)} placeholder="Nieuwe taak" className="rounded-xl border border-cocoa/20 bg-card px-4 py-3 text-sm" /><input type="date" value={newTaskDate} onChange={(event) => setNewTaskDate(event.target.value)} className="rounded-xl border border-cocoa/20 bg-card px-4 py-3 text-sm" /><Button onClick={addTask} disabled={!newTask.trim()}>Taak toevoegen</Button></div>
        </Card>
      ) : null}
      <h2 className="mt-6 text-lg font-semibold text-coffee">Status</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {bookingStatuses.map((status) => (
          <button
            key={status}
            disabled={saving}
            onClick={() => setStatus(status)}
            className={`rounded-full border px-3 py-2 text-xs font-semibold ${booking?.status === status ? "border-cocoa bg-cocoa text-card" : "border-cocoa/25 bg-card text-coffee"}`}
          >
            {status}
          </button>
        ))}
      </div>
      <h2 className="mt-6 text-lg font-semibold text-coffee">Interne notitie</h2>
      <p className="mt-1 text-xs leading-5 text-coffee/55">Alleen zichtbaar in het beheer. De klant ontvangt en ziet deze tekst niet.</p>
      <textarea className="mt-3 min-h-24 w-full rounded-xl border border-cocoa/20 bg-card px-4 py-3 text-sm outline-none" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Notitie toevoegen" />
      <Button onClick={saveNote} disabled={saving} className="mt-3 w-full">{saving ? "Bezig..." : "Notitie opslaan"}</Button>
      <div className="mt-4 grid gap-3">
        {!notes.length && !loading ? <EmptyState title="Nog geen notities" text="Interne notities verschijnen hier." /> : null}
        {notes.map((item) => (
          <Card key={item.id}>
            <p className="text-sm leading-6 text-coffee/75">{item.note}</p>
            <p className="mt-2 text-xs text-coffee/50">{item.created_by || "Admin"}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

function MobileWeatherDay({ day }: { day: WeatherDay }) {
  return <div className="mt-3 text-sm text-coffee/70"><p className="font-semibold text-coffee">{formatMobileDate(day.date)} · {day.description}</p><p className="mt-1">{Math.round(day.temperatureMin)}-{Math.round(day.temperatureMax)}°C · {day.precipitationProbability}% regen · {Math.round(day.windSpeed)} km/u wind</p></div>;
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(new Date(value));
}

const questionnaireLabels: Record<string, string> = {
  children: "Namen en leeftijden kinderen",
  participants: "Wie komen op de foto",
  allergies: "Allergieën",
  specialDetails: "Bijzonderheden",
  photographerNotes: "Verder vooraf weten",
};
