import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { format } from "date-fns";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import ShootTypeStep from "../../components/booking/ShootTypeStep.jsx";
import PackageStep from "../../components/booking/PackageStep.jsx";
import BookingCalendar from "../../components/booking/BookingCalendar.jsx";
import TimeSlotStep from "../../components/booking/TimeSlotStep.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { bookingStatuses, shootTypeOptions } from "../utils/bookingStatuses.js";

const inputClass = "rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa";

export default function AdminBookingNew() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [shootType, setShootType] = useState(null);
  const [packageId, setPackageId] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [status, setStatus] = useState("Nieuw");
  const [customer, setCustomer] = useState({ naam: "", email: "", omgeving: "", bericht: "", adminNotes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("packages")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setPackages(data || []));
  }, []);

  const packagesForShoot = useMemo(() => packages.filter((p) => p.shoot_type === shootType), [packages, shootType]);

  const handleSubmit = async () => {
    if (!shootType || !date || !time || !customer.naam || !customer.email) {
      setError("Vul shoot, datum, tijd, naam en e-mail in.");
      return;
    }
    setSaving(true);
    setError("");

    const { error: rpcError } = await supabase.rpc("book_slot", {
      p_payload: {
        customer_name: customer.naam,
        customer_email: customer.email,
        shoot_type: shootType,
        booking_date: format(date, "yyyy-MM-dd"),
        start_time: time.start,
        package_id: packageId || "",
        location: customer.omgeving,
        message: customer.bericht,
        privacy_accepted: true,
        admin_notes: customer.adminNotes,
        status,
        source: "admin",
      },
    });

    setSaving(false);

    if (rpcError) {
      const messages = {
        SLOT_TAKEN: "Dit tijdslot overlapt met een bestaande boeking.",
        NOT_BOOKABLE: "Dit shoot-type bestaat niet in de instellingen.",
      };
      setError(messages[rpcError.message] || rpcError.message);
      return;
    }

    navigate("/admin/bookings");
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

      <h1 className="mt-4 display-title text-3xl font-semibold text-coffee">Nieuwe boeking toevoegen</h1>
      <p className="mt-1 text-sm text-coffee/70">
        Ook handmatig toegevoegde boekingen worden gecontroleerd op overlap met bestaande boekingen en blokkades.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="grid gap-6">
          <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
            <h2 className="fine-label text-[0.65rem] text-cocoa">1. Shoot-type</h2>
            <p className="mt-2 text-xs leading-5 text-coffee/55">Kies welk soort shoot je handmatig in de kalender zet. Dit bepaalt duur, buffers en toegestane dagen.</p>
            <div className="mt-3">
              <ShootTypeStep
                options={shootTypeOptions}
                value={shootType}
                onSelect={(value) => {
                  setShootType(value);
                  setPackageId(null);
                  setDate(null);
                  setTime(null);
                }}
              />
            </div>
          </div>

          {shootType && packagesForShoot.length > 0 && (
            <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
              <h2 className="fine-label text-[0.65rem] text-cocoa">2. Pakket (optioneel)</h2>
              <p className="mt-2 text-xs leading-5 text-coffee/55">Koppel eventueel het pakket dat de klant heeft gekozen. Dit is vooral handig voor administratie.</p>
              <div className="mt-3">
                <PackageStep packages={packagesForShoot} value={packageId} onSelect={setPackageId} />
              </div>
            </div>
          )}

          {shootType && (
            <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
              <h2 className="fine-label text-[0.65rem] text-cocoa">3. Datum</h2>
              <p className="mt-2 text-xs leading-5 text-coffee/55">De kalender toont alleen data die volgens het rooster, blokkades en shoot-instellingen mogelijk zijn.</p>
              <div className="mt-3">
                <BookingCalendar shootType={shootType} value={date} onSelect={(d) => { setDate(d); setTime(null); }} />
              </div>
            </div>
          )}

          {shootType && date && (
            <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
              <h2 className="fine-label text-[0.65rem] text-cocoa">4. Tijd</h2>
              <p className="mt-2 text-xs leading-5 text-coffee/55">Kies een vrij tijdslot. Bij opslaan wordt nogmaals gecontroleerd of er geen overlap is.</p>
              <div className="mt-3">
                <TimeSlotStep date={date} shootType={shootType} value={time} onSelect={setTime} />
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
            <h2 className="fine-label text-[0.65rem] text-cocoa">Klantgegevens</h2>
            <div className="mt-3 grid gap-3">
              <label className="grid gap-1.5 text-sm font-semibold text-coffee">
                Naam
                <span className="text-xs font-normal text-coffee/55">Naam van de klant zoals die in de boekingenlijst verschijnt.</span>
                <input type="text" value={customer.naam} onChange={(e) => setCustomer({ ...customer, naam: e.target.value })} className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-coffee">
                E-mail
                <span className="text-xs font-normal text-coffee/55">Nodig om later contact op te nemen of een bevestiging te sturen.</span>
                <input type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-coffee">
                Locatie/omgeving
                <span className="text-xs font-normal text-coffee/55">Plaats of omgeving waar de shoot moet plaatsvinden.</span>
                <input type="text" value={customer.omgeving} onChange={(e) => setCustomer({ ...customer, omgeving: e.target.value })} className={inputClass} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-coffee">
                Bericht
                <span className="text-xs font-normal text-coffee/55">Klantwens of context voor deze aanvraag.</span>
                <textarea rows={3} value={customer.bericht} onChange={(e) => setCustomer({ ...customer, bericht: e.target.value })} className={`${inputClass} resize-none`} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-coffee">
                Interne notitie
                <span className="text-xs font-normal text-coffee/55">Alleen zichtbaar in admin, niet voor de klant.</span>
                <textarea rows={2} value={customer.adminNotes} onChange={(e) => setCustomer({ ...customer, adminNotes: e.target.value })} className={`${inputClass} resize-none`} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold text-coffee">
                Status
                <span className="text-xs font-normal text-coffee/55">Startstatus van deze handmatig toegevoegde boeking.</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                  {bookingStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

          <AdminButton type="button" onClick={handleSubmit} disabled={saving} className="justify-self-start">
            <Save size={14} /> {saving ? "Opslaan..." : "Boeking opslaan"}
          </AdminButton>
        </div>
      </div>
    </AdminLayout>
  );
}
