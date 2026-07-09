import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/Button.jsx";
import MiniSessionSlotPicker from "../components/MiniSessionSlotPicker.jsx";
import SEO from "../components/SEO.jsx";
import { formatDate } from "../lib/formatDate.js";
import { supabase } from "../lib/supabaseClient.js";

export default function MiniSessionDetail() {
  const { slug } = useParams();
  const [session, setSession] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ slot_id: "", customer_name: "", customer_email: "", message: "", botField: "" });
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: sessionRow } = await supabase
        .from("mini_sessions")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (!active) return;
      setSession(sessionRow || null);
      if (sessionRow) {
        const { data: slotRows } = await supabase
          .from("mini_session_slots")
          .select("*")
          .eq("mini_session_id", sessionRow.id)
          .order("start_time", { ascending: true });
        if (active) setSlots(slotRows || []);
      }
      if (active) setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus("sending");
    setNotice("");
    try {
      const response = await fetch("/api/submit-mini-session-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mini_session_id: session.id }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) throw new Error(body.message || "Aanvraag versturen is niet gelukt.");
      setStatus("success");
      setNotice("Dank je wel. Je mini-shoot aanvraag is ontvangen.");
      setForm({ slot_id: "", customer_name: "", customer_email: "", message: "", botField: "" });
    } catch (error) {
      setStatus("error");
      setNotice(error instanceof Error ? error.message : "Aanvraag versturen is niet gelukt.");
    }
  };

  if (loading) return <section className="container-soft pt-36"><p className="text-sm text-coffee/60">Even laden...</p></section>;
  if (!session) return <section className="container-soft pt-36"><p className="rounded-lg bg-card p-6 shadow-soft warm-border">Deze mini-shoot is niet gevonden.</p></section>;

  return (
    <>
      <SEO title={session.title} description={session.description || "Mini-shoot bij Cuddling Memories Fotografie."} />
      <section className="pt-36">
        <div className="container-soft grid gap-10 pb-16 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <img src={session.cover_image_url || "/images/home-hero-cakesmash.png"} alt={session.title} className="aspect-[4/5] w-full rounded-lg object-cover shadow-soft warm-border" />
          </div>
          <div>
            <p className="fine-label text-sm text-cocoa">{formatDate(session.date)}</p>
            <h1 className="display-title mt-2 text-5xl font-semibold text-coffee">{session.title}</h1>
            <p className="mt-5 text-base leading-8 text-coffee/78">{session.description}</p>
            <div className="mt-7 grid gap-3 rounded-lg bg-linen p-5 text-sm text-coffee/75 shadow-soft warm-border sm:grid-cols-2">
              <p><strong>Prijs:</strong> EUR {Number(session.price || 0).toFixed(0)}</p>
              <p><strong>Beelden:</strong> {session.included_images || 0}</p>
              <p><strong>Duur:</strong> {session.duration_minutes || 20} minuten</p>
              <p><strong>Locatie:</strong> {session.location || "Wordt afgestemd"}</p>
            </div>
            {session.terms && <p className="mt-5 text-sm leading-7 text-coffee/65">{session.terms}</p>}

            <form onSubmit={submit} className="mt-8 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border">
              <input type="text" value={form.botField} onChange={(event) => update("botField", event.target.value)} className="hidden" tabIndex={-1} autoComplete="off" />
              <div>
                <h2 className="display-title text-2xl font-semibold text-coffee">Kies je tijdslot</h2>
                <div className="mt-4">
                  <MiniSessionSlotPicker slots={slots} value={form.slot_id} onChange={(id) => update("slot_id", id)} />
                </div>
              </div>
              <Field label="Naam" value={form.customer_name} onChange={(value) => update("customer_name", value)} required />
              <Field label="E-mailadres" type="email" value={form.customer_email} onChange={(value) => update("customer_email", value)} required />
              <label className="grid gap-2 text-sm font-semibold text-coffee">
                Bericht
                <textarea rows={4} value={form.message} onChange={(event) => update("message", event.target.value)} className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
              </label>
              {notice && <p className={`rounded-lg px-4 py-3 text-sm ${status === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"}`}>{notice}</p>}
              <Button type="submit" disabled={status === "sending"} className="gap-2">
                {status === "sending" ? "Bezig met verzenden" : "Tijdslot aanvragen"} <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

function Field({ label, type = "text", value, onChange, required }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-coffee">
      {label}
      <input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
    </label>
  );
}
