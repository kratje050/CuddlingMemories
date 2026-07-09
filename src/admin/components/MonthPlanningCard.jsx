import { useEffect, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { X } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import { saveMonthOverride } from "../../lib/monthAvailability.js";
import AdminButton from "./AdminButton.jsx";

const inputClass = "rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa";

const manualStatusOptions = [
  { value: "automatic", label: "Automatisch (aanbevolen)" },
  { value: "no_bookings", label: "Nog geen boekingen" },
  { value: "available", label: "Ruim beschikbaar" },
  { value: "limited", label: "Beperkt beschikbaar" },
  { value: "almost_full", label: "Bijna vol" },
  { value: "full", label: "Vol" },
  { value: "unavailable", label: "Niet beschikbaar" },
];

const emptyValues = {
  is_closed: false,
  manual_status: "automatic",
  max_bookings: "",
  warning_threshold_slots: "",
  warning_threshold_percentage: "",
  public_message: "",
  internal_note: "",
};

export default function MonthPlanningCard({ month, onClose, onSaved }) {
  const [values, setValues] = useState(emptyValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("monthly_availability_settings")
      .select("*")
      .eq("year", month.year)
      .eq("month", month.month)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setValues(
          data
            ? {
                is_closed: data.is_closed,
                manual_status: data.manual_status,
                max_bookings: data.max_bookings ?? "",
                warning_threshold_slots: data.warning_threshold_slots ?? "",
                warning_threshold_percentage: data.warning_threshold_percentage ?? "",
                public_message: data.public_message || "",
                internal_note: data.internal_note || "",
              }
            : emptyValues
        );
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [month.year, month.month]);

  const update = (field, value) => setValues((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await saveMonthOverride(month.year, month.month, {
        is_closed: values.is_closed,
        manual_status: values.manual_status,
        max_bookings: values.max_bookings === "" ? null : Number(values.max_bookings),
        warning_threshold_slots: values.warning_threshold_slots === "" ? null : Number(values.warning_threshold_slots),
        warning_threshold_percentage:
          values.warning_threshold_percentage === "" ? null : Number(values.warning_threshold_percentage),
        public_message: values.public_message || null,
        internal_note: values.internal_note || null,
      });
      setFeedback({ type: "success", message: "Maandinstellingen opgeslagen." });
      onSaved?.();
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "Opslaan is niet gelukt." });
    } finally {
      setSaving(false);
    }
  };

  const date = new Date(month.year, month.month - 1, 1);

  return (
    <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
      <div className="flex items-center justify-between">
        <h2 className="display-title text-xl font-semibold capitalize text-coffee">
          {format(date, "MMMM yyyy", { locale: nl })} beheren
        </h2>
        <button type="button" onClick={onClose} className="text-coffee/50 transition hover:text-cocoa" aria-label="Sluiten">
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-coffee/70">Laden...</p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-coffee sm:col-span-2">
              <input
                type="checkbox"
                checked={values.is_closed}
                onChange={(e) => update("is_closed", e.target.checked)}
                className="h-4 w-4 accent-cocoa"
              />
              Maand handmatig sluiten
              <span className="text-xs font-normal text-coffee/55">Toont altijd "Niet beschikbaar", ongeacht de andere instellingen.</span>
            </label>

            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Status overschrijven
              <select value={values.manual_status} onChange={(e) => update("manual_status", e.target.value)} className={inputClass}>
                {manualStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Maximaal aantal boekingen deze maand
              <input
                type="number"
                min="0"
                placeholder="Standaard (geen limiet)"
                value={values.max_bookings}
                onChange={(e) => update("max_bookings", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Waarschuwingsdrempel (aantal plekken)
              <input
                type="number"
                min="0"
                placeholder="Standaard drempel gebruiken"
                value={values.warning_threshold_slots}
                onChange={(e) => update("warning_threshold_slots", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Waarschuwingsdrempel (percentage)
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Standaard drempel gebruiken"
                value={values.warning_threshold_percentage}
                onChange={(e) => update("warning_threshold_percentage", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee sm:col-span-2">
              Publieke melding (optioneel)
              <span className="text-xs font-normal text-coffee/55">
                Vervangt de standaardtekst op de site, bv. "Nieuwe data volgen binnenkort."
              </span>
              <textarea
                rows={2}
                value={values.public_message}
                onChange={(e) => update("public_message", e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee sm:col-span-2">
              Interne notitie (alleen zichtbaar in admin)
              <textarea
                rows={2}
                value={values.internal_note}
                onChange={(e) => update("internal_note", e.target.value)}
                className={`${inputClass} resize-none`}
              />
            </label>
          </div>

          {feedback && (
            <p className={`mt-4 rounded-lg px-4 py-3 text-sm ${feedback.type === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"}`}>
              {feedback.message}
            </p>
          )}

          <AdminButton type="button" onClick={handleSave} disabled={saving} className="mt-4">
            {saving ? "Opslaan..." : "Opslaan"}
          </AdminButton>
        </>
      )}
    </div>
  );
}
