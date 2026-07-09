import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import MonthPlanningTable from "../components/MonthPlanningTable.jsx";
import MonthPlanningCard from "../components/MonthPlanningCard.jsx";
import { getMonthsStatusAdmin } from "../../lib/monthAvailability.js";

const inputClass = "rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa";

function FieldHelp({ children }) {
  return <p className="-mt-1 text-xs font-normal leading-5 text-coffee/55">{children}</p>;
}

function DisplaySettingsSection() {
  const [id, setId] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    supabase
      .from("booking_display_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setId(data.id);
          setValues(data);
        }
        setLoading(false);
      });
  }, []);

  const update = (field, value) => setValues((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    const { error } = await supabase
      .from("booking_display_settings")
      .update({
        months_ahead_to_show: Number(values.months_ahead_to_show) || 12,
        show_booking_counts_publicly: Boolean(values.show_booking_counts_publicly),
        show_exact_available_slots_publicly: Boolean(values.show_exact_available_slots_publicly),
        reserve_pending_bookings: Boolean(values.reserve_pending_bookings),
        almost_full_threshold_slots: Number(values.almost_full_threshold_slots) || 0,
        almost_full_threshold_percentage: Number(values.almost_full_threshold_percentage) || 0,
        limited_threshold_percentage: Number(values.limited_threshold_percentage) || 0,
      })
      .eq("id", id);
    setSaving(false);
    setFeedback(error ? { type: "error", message: error.message } : { type: "success", message: "Instellingen opgeslagen." });
  };

  if (loading) return <p className="text-sm text-coffee/70">Laden...</p>;

  return (
    <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
      <h2 className="fine-label text-[0.65rem] text-cocoa">Weergave-instellingen</h2>
      <p className="mt-2 text-sm leading-6 text-coffee/65">
        Deze instellingen bepalen hoe het maandoverzicht op de website berekend en getoond wordt.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Aantal maanden vooruit tonen
          <input type="number" min="1" value={values.months_ahead_to_show ?? ""} onChange={(e) => update("months_ahead_to_show", e.target.value)} className={inputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Drempel "bijna vol" (aantal plekken)
          <input type="number" min="0" value={values.almost_full_threshold_slots ?? ""} onChange={(e) => update("almost_full_threshold_slots", e.target.value)} className={inputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Drempel "bijna vol" (percentage)
          <input type="number" min="0" max="100" value={values.almost_full_threshold_percentage ?? ""} onChange={(e) => update("almost_full_threshold_percentage", e.target.value)} className={inputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Drempel "beperkt beschikbaar" (percentage)
          <input type="number" min="0" max="100" value={values.limited_threshold_percentage ?? ""} onChange={(e) => update("limited_threshold_percentage", e.target.value)} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-coffee sm:col-span-2">
          <input type="checkbox" checked={Boolean(values.reserve_pending_bookings)} onChange={(e) => update("reserve_pending_bookings", e.target.checked)} className="h-4 w-4 accent-cocoa" />
          Nieuwe aanvragen meteen laten meetellen als bezet
          <FieldHelp>Zet uit als alleen bevestigde boekingen de maand-drukte moeten bepalen.</FieldHelp>
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-coffee">
          <input type="checkbox" checked={Boolean(values.show_booking_counts_publicly)} onChange={(e) => update("show_booking_counts_publicly", e.target.checked)} className="h-4 w-4 accent-cocoa" />
          Exacte aantallen boekingen publiek tonen
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-coffee">
          <input type="checkbox" checked={Boolean(values.show_exact_available_slots_publicly)} onChange={(e) => update("show_exact_available_slots_publicly", e.target.checked)} className="h-4 w-4 accent-cocoa" />
          Exact aantal resterende plekken publiek tonen
        </label>
      </div>
      {feedback && (
        <p className={`mt-4 rounded-lg px-4 py-3 text-sm ${feedback.type === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"}`}>
          {feedback.message}
        </p>
      )}
      <AdminButton type="button" onClick={handleSave} disabled={saving} className="mt-4">
        {saving ? "Opslaan..." : "Instellingen opslaan"}
      </AdminButton>
    </div>
  );
}

export default function AdminMonthPlanning() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);

  const load = () => {
    setLoading(true);
    const now = new Date();
    getMonthsStatusAdmin(now.getFullYear(), now.getMonth() + 1, 12)
      .then(setMonths)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminLayout>
      <h1 className="display-title text-3xl font-semibold text-coffee">Maandplanning</h1>
      <p className="mt-2 text-sm text-coffee/70">
        Overzicht van de komende 12 maanden. Klik op "Beheren" om een maand handmatig te sluiten, de status te
        overschrijven of een publieke melding toe te voegen.
      </p>

      <div className="mt-6 grid gap-6">
        {selectedMonth && (
          <MonthPlanningCard
            month={selectedMonth}
            onClose={() => setSelectedMonth(null)}
            onSaved={() => {
              load();
              setSelectedMonth(null);
            }}
          />
        )}

        <MonthPlanningTable months={months} loading={loading} onSelect={setSelectedMonth} />

        <DisplaySettingsSection />
      </div>
    </AdminLayout>
  );
}
