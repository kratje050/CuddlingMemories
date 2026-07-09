import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Archive, CalendarCheck, Mail, Star, Trash2, XCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useAdminAuth } from "../hooks/useAdminAuth.js";
import {
  addBookingNote,
  deleteBooking,
  getBookingDetail,
  toggleBookingImportant,
  updateBookingStatus,
} from "../hooks/useBookings.js";
import { bookingStatuses } from "../utils/bookingStatuses.js";
import { formatDate, formatDateTime } from "../../lib/formatDate.js";

export default function AdminBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await getBookingDetail(id);
    setBooking(result.booking);
    setNotes(result.notes);
    setHistory(result.history);
    setAdminNotes(result.booking?.admin_notes || "");
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-sm text-coffee/70">Laden...</p>
      </AdminLayout>
    );
  }

  if (!booking) {
    return (
      <AdminLayout>
        <p className="text-sm text-coffee/70">Boeking niet gevonden.</p>
        <AdminButton variant="secondary" className="mt-4" onClick={() => navigate("/admin/bookings")}>
          <ArrowLeft size={14} /> Terug naar boekingen
        </AdminButton>
      </AdminLayout>
    );
  }

  const handleStatusChange = async (event) => {
    const nextStatus = event.target.value;
    setSaving(true);
    await updateBookingStatus(booking.id, nextStatus, user?.email);
    if (nextStatus === "Datum ingepland" && booking.status !== "Datum ingepland") {
      await supabase.from("bookings").update({ confirmed_at: new Date().toISOString() }).eq("id", booking.id);
      await sendBookingConfirmedMail(booking);
    }
    await load();
    setSaving(false);
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    await addBookingNote(booking.id, noteText.trim(), user?.email);
    setNoteText("");
    await load();
    setSaving(false);
  };

  const handleToggleImportant = async () => {
    setSaving(true);
    await toggleBookingImportant(booking.id, !booking.is_important);
    await load();
    setSaving(false);
  };

  const handleArchive = async () => {
    setSaving(true);
    await updateBookingStatus(booking.id, "Gearchiveerd", user?.email);
    await load();
    setSaving(false);
  };

  const handleConfirm = async () => {
    setSaving(true);
    await updateBookingStatus(booking.id, "Datum ingepland", user?.email);
    await supabase.from("bookings").update({ confirmed_at: new Date().toISOString() }).eq("id", booking.id);
    await sendBookingConfirmedMail(booking);
    await load();
    setSaving(false);
  };

  const handleCancel = async () => {
    setSaving(true);
    await updateBookingStatus(booking.id, "Geannuleerd", user?.email);
    await supabase.from("bookings").update({ cancelled_at: new Date().toISOString() }).eq("id", booking.id);
    await load();
    setSaving(false);
  };

  const handleSaveAdminNotes = async () => {
    setSaving(true);
    await supabase.from("bookings").update({ admin_notes: adminNotes }).eq("id", booking.id);
    setSaving(false);
  };

  return (
    <AdminLayout>
      <button
        type="button"
        onClick={() => navigate("/admin/bookings")}
        className="flex items-center gap-2 text-sm font-semibold text-coffee/70 hover:text-cocoa"
      >
        <ArrowLeft size={16} /> Terug naar boekingen
      </button>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-title text-3xl font-semibold text-coffee">{booking.customer_name}</h1>
          <p className="mt-1 text-sm text-coffee/70">
            Aangevraagd op {formatDateTime(booking.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <p className="basis-full text-xs leading-5 text-coffee/55">
            Deze acties passen de status of interne markering van de boeking aan. Bevestigen stuurt ook een bevestigingsmail naar de klant.
          </p>
          <AdminButton variant="secondary" onClick={handleConfirm} disabled={saving}>
            <CalendarCheck size={14} /> Bevestigen
          </AdminButton>
          <AdminButton variant="secondary" onClick={handleCancel} disabled={saving}>
            <XCircle size={14} /> Annuleren
          </AdminButton>
          <AdminButton variant="secondary" onClick={handleToggleImportant} disabled={saving}>
            <Star size={14} className={booking.is_important ? "fill-cocoa" : ""} />
            {booking.is_important ? "Belangrijk" : "Markeer belangrijk"}
          </AdminButton>
          <AdminButton variant="secondary" href={`mailto:${booking.customer_email}`}>
            <Mail size={14} /> Mail klant
          </AdminButton>
          <AdminButton variant="secondary" onClick={handleArchive} disabled={saving}>
            <Archive size={14} /> Archiveer
          </AdminButton>
          <AdminButton variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Verwijder
          </AdminButton>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6">
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Aanvraag</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Field label="E-mail" value={booking.customer_email} />
              <Field label="Gewenste shoot" value={booking.shoot_type} />
              <Field
                label="Datum shoot"
                value={booking.booking_date ? `${formatDate(booking.booking_date)} · ${booking.start_time?.slice(0, 5)}-${booking.end_time?.slice(0, 5)}` : "Nog niet ingepland"}
              />
              <Field label="Duur / buffer" value={booking.duration_minutes ? `${booking.duration_minutes} min (buffer ${booking.buffer_before_minutes}/${booking.buffer_after_minutes} min)` : "-"} />
              <Field label="Locatie" value={booking.location || "-"} />
              <Field label="Gekozen pakket" value={booking.packages?.title || "Geen voorkeur"} />
              <Field label="Modelkorting" value={booking.model_discount ? "Ja" : "Nee"} />
              <Field label="Bron" value={booking.source} />
              <Field label="Privacy geaccepteerd" value={booking.privacy_accepted ? "Ja" : "Nee"} />
              <Field label="Bevestigd op" value={booking.confirmed_at ? formatDateTime(booking.confirmed_at) : "-"} />
              <Field label="Geannuleerd op" value={booking.cancelled_at ? formatDateTime(booking.cancelled_at) : "-"} />
              <Field label="Laatste wijziging" value={formatDateTime(booking.updated_at)} />
            </dl>
            <div className="mt-4">
              <p className="fine-label text-[0.62rem] text-cocoa">Bericht</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-coffee/85">{booking.message}</p>
            </div>
          </div>

          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Interne notitie</h2>
            <p className="mt-1 text-xs text-coffee/60">Een vastgepinde notitie voor jezelf. Deze tekst is niet zichtbaar voor de klant.</p>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
            <AdminButton type="button" variant="secondary" onClick={handleSaveAdminNotes} disabled={saving} className="mt-3">
              Opslaan
            </AdminButton>
          </div>

          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Notities</h2>
            <p className="mt-1 text-xs text-coffee/60">Losse interne tijdlijnnotities. Handig voor belafspraken, bijzonderheden of opvolging.</p>
            <form onSubmit={handleAddNote} className="mt-3 grid gap-2">
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                rows={3}
                placeholder="Interne notitie toevoegen..."
                className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
              <AdminButton type="submit" className="justify-self-start" disabled={saving || !noteText.trim()}>
                Notitie toevoegen
              </AdminButton>
            </form>
            <div className="mt-4 grid gap-3">
              {notes.length === 0 && <p className="text-sm text-coffee/60">Nog geen notities.</p>}
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg bg-linen/60 p-3 text-sm">
                  <p className="text-coffee/85">{note.note}</p>
                  <p className="mt-1 text-xs text-coffee/50">
                    {note.created_by || "Onbekend"} · {formatDateTime(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Status</h2>
            <p className="mt-1 text-xs leading-5 text-coffee/60">
              De status helpt jou bij opvolging. Bevestigen en annuleren vullen ook de bevestigings- of annuleringsdatum.
            </p>
            <select
              value={booking.status}
              onChange={handleStatusChange}
              disabled={saving}
              className="mt-3 w-full rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            >
              {bookingStatuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Statusgeschiedenis</h2>
            <div className="mt-3 grid gap-3">
              {history.length === 0 && <p className="text-sm text-coffee/60">Nog geen statuswijzigingen.</p>}
              {history.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <p className="text-coffee/85">
                    {entry.old_status ? `${entry.old_status} → ` : ""}
                    <span className="font-semibold">{entry.new_status}</span>
                  </p>
                  <p className="text-xs text-coffee/50">
                    {entry.changed_by || "Onbekend"} · {formatDateTime(entry.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Boeking verwijderen?"
        description={`De boeking van ${booking.customer_name} wordt definitief verwijderd.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteBooking(booking.id);
          navigate("/admin/bookings");
        }}
      />
    </AdminLayout>
  );
}

async function sendBookingConfirmedMail(booking) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_email: booking.customer_email,
        template_key: "booking_confirmed",
        related_booking_id: booking.id,
        variables: {
          customer_name: booking.customer_name,
          shoot_type: booking.shoot_type,
          booking_date: booking.booking_date ? formatDate(booking.booking_date) : "de afgesproken datum",
          booking_time: booking.start_time ? booking.start_time.slice(0, 5) : "de afgesproken tijd",
          package_name: booking.packages?.title || "",
        },
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.error("Bevestigingsmail versturen is mislukt:", result.message || response.statusText);
    }
  } catch (error) {
    console.error("Bevestigingsmail versturen is mislukt:", error);
  }
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="fine-label text-[0.6rem] text-cocoa">{label}</dt>
      <dd className="mt-1 text-coffee/85">{value}</dd>
    </div>
  );
}
