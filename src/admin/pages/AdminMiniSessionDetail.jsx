import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminButton from "../components/AdminButton.jsx";
import AdminLayout from "../components/AdminLayout.jsx";
import DataTable from "../components/DataTable.jsx";
import { miniSessionBookingStatuses, miniSessionStatuses, slugifyMiniSession } from "../../lib/miniSessions.js";
import { formatDate } from "../../lib/formatDate.js";
import { supabase } from "../../lib/supabaseClient.js";

const emptySession = {
  title: "",
  slug: "",
  description: "",
  date: "",
  location: "",
  price: 0,
  included_images: 5,
  duration_minutes: 20,
  is_published: false,
  status: "Concept",
  cover_image_url: "",
  terms: "",
  internal_note: "",
};

export default function AdminMiniSessionDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState(emptySession);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [saving, setSaving] = useState(false);
  const [slotForm, setSlotForm] = useState({ start_time: "09:00", end_time: "09:20", max_bookings: 1, is_available: true });
  const [generateForm, setGenerateForm] = useState({ start: "09:00", end: "12:00", breakMinutes: 10, max_bookings: 1 });
  const [message, setMessage] = useState("");

  const loadRelated = () => {
    if (isNew) return;
    supabase.from("mini_session_slots").select("*").eq("mini_session_id", id).order("start_time", { ascending: true }).then(({ data }) => setSlots(data || []));
    supabase.from("mini_session_bookings").select("*, mini_session_slots(start_time, end_time)").eq("mini_session_id", id).order("created_at", { ascending: false }).then(({ data }) => setBookings(data || []));
  };

  useEffect(() => {
    if (isNew) return;
    supabase.from("mini_sessions").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setForm({ ...emptySession, ...data });
    });
    loadRelated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const update = (name, value) => {
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "title" && !current.slug) next.slug = slugifyMiniSession(value);
      return next;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = {
      ...form,
      price: Number(form.price || 0),
      included_images: Number(form.included_images || 0),
      duration_minutes: Number(form.duration_minutes || 20),
    };
    const query = isNew
      ? supabase.from("mini_sessions").insert(payload).select("id").single()
      : supabase.from("mini_sessions").update(payload).eq("id", id).select("id").single();
    const { data, error } = await query;
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Mini-shoot opgeslagen.");
    if (isNew) navigate(`/admin/mini-shoots/${data.id}`);
  };

  const addSlot = async (event) => {
    event.preventDefault();
    await supabase.from("mini_session_slots").insert({ ...slotForm, mini_session_id: id, max_bookings: Number(slotForm.max_bookings || 1) });
    loadRelated();
  };

  const generateSlots = async () => {
    const rows = [];
    const [startH, startM] = generateForm.start.split(":").map(Number);
    const [endH, endM] = generateForm.end.split(":").map(Number);
    const date = new Date(2026, 0, 1, startH, startM);
    const end = new Date(2026, 0, 1, endH, endM);
    while (date < end) {
      const slotStart = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      const slotEndDate = new Date(date.getTime() + Number(form.duration_minutes || 20) * 60000);
      if (slotEndDate > end) break;
      const slotEnd = `${String(slotEndDate.getHours()).padStart(2, "0")}:${String(slotEndDate.getMinutes()).padStart(2, "0")}`;
      rows.push({ mini_session_id: id, start_time: slotStart, end_time: slotEnd, max_bookings: Number(generateForm.max_bookings || 1), is_available: true });
      date.setTime(slotEndDate.getTime() + Number(generateForm.breakMinutes || 0) * 60000);
    }
    if (rows.length) await supabase.from("mini_session_slots").insert(rows);
    loadRelated();
  };

  const removeSlot = async (slotId) => {
    await supabase.from("mini_session_slots").delete().eq("id", slotId);
    loadRelated();
  };

  const updateBookingStatus = async (bookingId, status) => {
    await supabase.from("mini_session_bookings").update({ status }).eq("id", bookingId);
    loadRelated();
  };

  return (
    <AdminLayout>
      <h1 className="display-title text-3xl font-semibold text-coffee">{isNew ? "Nieuwe mini-shoot" : "Mini-shoot bewerken"}</h1>
      <p className="mt-1 text-sm text-coffee/65">Maak een mini-shoot dag, publiceer hem en beheer de tijdslots.</p>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border md:grid-cols-2">
        <Field label="Titel" help="Naam van de mini-shoot, bijvoorbeeld Kerst mini-shoots." value={form.title} onChange={(value) => update("title", value)} required />
        <Field label="Slug" help="URL-deel voor de detailpagina." value={form.slug} onChange={(value) => update("slug", value)} required />
        <Field label="Datum" type="date" help="Dag waarop deze mini-shoot plaatsvindt." value={form.date} onChange={(value) => update("date", value)} required />
        <Field label="Locatie/omgeving" help="Bijvoorbeeld studio, Zoutkamp of buitenlocatie." value={form.location} onChange={(value) => update("location", value)} />
        <Field label="Prijs" type="number" help="Prijs in euro's, zonder euroteken." value={form.price} onChange={(value) => update("price", value)} />
        <Field label="Inbegrepen beelden" type="number" help="Aantal beelden dat in deze mini-shoot zit." value={form.included_images} onChange={(value) => update("included_images", value)} />
        <Field label="Duur per tijdslot" type="number" help="Duur in minuten. Wordt gebruikt bij automatisch genereren." value={form.duration_minutes} onChange={(value) => update("duration_minutes", value)} />
        <Field label="Cover afbeelding URL" help="Afbeelding voor de publieke mini-shoot kaart." value={form.cover_image_url || ""} onChange={(value) => update("cover_image_url", value)} />
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Status
          <span className="-mt-1 text-xs font-normal text-coffee/55">Processtatus van deze mini-shoot dag.</span>
          <select value={form.status} onChange={(event) => update("status", event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa">
            {miniSessionStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-coffee">
          <input type="checkbox" checked={Boolean(form.is_published)} onChange={(event) => update("is_published", event.target.checked)} className="h-4 w-4 accent-cocoa" />
          Gepubliceerd
          <span className="text-xs font-normal text-coffee/55">Alleen gepubliceerde mini-shoots zijn zichtbaar op de site.</span>
        </label>
        <TextArea label="Omschrijving" help="Tekst voor de publieke pagina." value={form.description} onChange={(value) => update("description", value)} />
        <TextArea label="Voorwaarden" help="Belangrijke afspraken zoals betaling, annuleren of levertijd." value={form.terms || ""} onChange={(value) => update("terms", value)} />
        <TextArea label="Interne notitie" help="Alleen zichtbaar in admin." value={form.internal_note || ""} onChange={(value) => update("internal_note", value)} />
        {message && <p className="rounded-lg bg-linen px-4 py-3 text-sm text-coffee md:col-span-2">{message}</p>}
        <AdminButton type="submit" disabled={saving} className="justify-self-start md:col-span-2">
          <Save size={14} /> {saving ? "Opslaan..." : "Opslaan"}
        </AdminButton>
      </form>

      {!isNew && (
        <>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <form onSubmit={addSlot} className="rounded-lg bg-card p-5 shadow-soft warm-border">
              <h2 className="display-title text-xl font-semibold text-coffee">Handmatig tijdslot</h2>
              <p className="mt-1 text-xs text-coffee/55">Voeg een los tijdslot toe voor deze mini-shoot.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Starttijd" type="time" value={slotForm.start_time} onChange={(value) => setSlotForm((current) => ({ ...current, start_time: value }))} />
                <Field label="Eindtijd" type="time" value={slotForm.end_time} onChange={(value) => setSlotForm((current) => ({ ...current, end_time: value }))} />
                <Field label="Max plekken" type="number" value={slotForm.max_bookings} onChange={(value) => setSlotForm((current) => ({ ...current, max_bookings: value }))} />
                <label className="flex items-center gap-3 text-sm font-semibold text-coffee">
                  <input type="checkbox" checked={slotForm.is_available} onChange={(event) => setSlotForm((current) => ({ ...current, is_available: event.target.checked }))} className="h-4 w-4 accent-cocoa" />
                  Beschikbaar
                </label>
              </div>
              <AdminButton type="submit" className="mt-4"><Plus size={14} /> Tijdslot toevoegen</AdminButton>
            </form>
            <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
              <h2 className="display-title text-xl font-semibold text-coffee">Automatisch genereren</h2>
              <p className="mt-1 text-xs text-coffee/55">Maak meerdere tijdslots op basis van duur en pauze.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Vanaf" type="time" value={generateForm.start} onChange={(value) => setGenerateForm((current) => ({ ...current, start: value }))} />
                <Field label="Tot" type="time" value={generateForm.end} onChange={(value) => setGenerateForm((current) => ({ ...current, end: value }))} />
                <Field label="Pauze minuten" type="number" value={generateForm.breakMinutes} onChange={(value) => setGenerateForm((current) => ({ ...current, breakMinutes: value }))} />
                <Field label="Max plekken" type="number" value={generateForm.max_bookings} onChange={(value) => setGenerateForm((current) => ({ ...current, max_bookings: value }))} />
              </div>
              <AdminButton type="button" onClick={generateSlots} className="mt-4"><Plus size={14} /> Tijdslots genereren</AdminButton>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="display-title text-xl font-semibold text-coffee">Tijdslots</h2>
            <div className="mt-3">
              <DataTable
                loading={false}
                rows={slots}
                getRowKey={(row) => row.id}
                emptyLabel="Nog geen tijdslots."
                columns={[
                  { key: "time", label: "Tijd", render: (row) => `${row.start_time?.slice(0, 5)} - ${row.end_time?.slice(0, 5)}` },
                  { key: "max_bookings", label: "Max" },
                  { key: "current_bookings", label: "Geboekt" },
                  { key: "is_available", label: "Beschikbaar", render: (row) => (row.is_available ? "Ja" : "Nee") },
                  { key: "actions", label: "", render: (row) => <button type="button" onClick={() => removeSlot(row.id)} className="grid h-8 w-8 place-items-center rounded-full border border-red-300 text-red-700"><Trash2 size={14} /></button> },
                ]}
              />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="display-title text-xl font-semibold text-coffee">Deelnemers</h2>
            <div className="mt-3">
              <DataTable
                loading={false}
                rows={bookings}
                getRowKey={(row) => row.id}
                emptyLabel="Nog geen aanvragen."
                columns={[
                  { key: "customer_name", label: "Naam" },
                  { key: "customer_email", label: "E-mail" },
                  { key: "slot", label: "Tijd", render: (row) => `${row.mini_session_slots?.start_time?.slice(0, 5) || ""}` },
                  {
                    key: "status",
                    label: "Status",
                    render: (row) => (
                      <select value={row.status} onChange={(event) => updateBookingStatus(row.id, event.target.value)} className="rounded-md border border-cocoa/20 bg-cream px-2 py-1 text-xs">
                        {miniSessionBookingStatuses.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    ),
                  },
                  { key: "created_at", label: "Datum", render: (row) => formatDate(row.created_at) },
                ]}
              />
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function Field({ label, help, type = "text", value, onChange, required }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-coffee">
      {label}
      {help && <span className="-mt-1 text-xs font-normal text-coffee/55">{help}</span>}
      <input type={type} required={required} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
    </label>
  );
}

function TextArea({ label, help, value, onChange }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-coffee md:col-span-2">
      {label}
      {help && <span className="-mt-1 text-xs font-normal text-coffee/55">{help}</span>}
      <textarea rows={4} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
    </label>
  );
}
