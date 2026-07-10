import { addBookingNote, bookingStatuses, getBookingDetail, updateBookingStatus, type Booking, type BookingNote } from "@shared/index";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader } from "../components/ui";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export default function BookingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [notes, setNotes] = useState<BookingNote[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!id) return;
    setLoading(true);
    setError("");

    try {
      const result = await getBookingDetail(supabase as any, id);
      setBooking(result.booking);
      setNotes(result.notes);
    } catch {
      setError("Deze boeking kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function setStatus(status: string) {
    if (!id) return;
    setSaving(true);

    try {
      await updateBookingStatus(supabase as any, id, status, user?.email);
      await load();
    } catch {
      setError("Status aanpassen is niet gelukt.");
    } finally {
      setSaving(false);
    }
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
            {booking.booking_date ? <p>Datum: {booking.booking_date}</p> : null}
            {booking.start_time ? <p>Tijd: {booking.start_time}</p> : null}
            {booking.location ? <p>Locatie: {booking.location}</p> : null}
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-6 text-coffee/75">{booking.message || "Geen bericht."}</p>
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
