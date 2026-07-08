import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import { shootTypeOptions } from "../utils/bookingStatuses.js";

const dayLabels = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
const dayShort = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];

const inputClass = "rounded-lg border border-cocoa/20 bg-cream px-2.5 py-1.5 text-sm outline-none focus:border-cocoa";

function Feedback({ feedback }) {
  if (!feedback) return null;
  return (
    <p className={`mt-3 rounded-lg px-4 py-3 text-sm ${feedback.type === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"}`}>
      {feedback.message}
    </p>
  );
}

function WeekScheduleSection() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    supabase
      .from("availability_rules")
      .select("*")
      .order("day_of_week", { ascending: true })
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      });
  }, []);

  const update = (dayOfWeek, field, value) => {
    setRows((prev) => prev.map((row) => (row.day_of_week === dayOfWeek ? { ...row, [field]: value } : row)));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    const results = await Promise.all(
      rows.map((row) =>
        supabase
          .from("availability_rules")
          .update({
            start_time: row.start_time,
            end_time: row.end_time,
            break_start_time: row.break_start_time || null,
            break_end_time: row.break_end_time || null,
            is_available: row.is_available,
            max_bookings_per_day: Number(row.max_bookings_per_day) || 0,
          })
          .eq("id", row.id)
      )
    );
    setSaving(false);
    const failed = results.find((r) => r.error);
    setFeedback(failed ? { type: "error", message: failed.error.message } : { type: "success", message: "Weekrooster opgeslagen." });
  };

  if (loading) return <p className="text-sm text-coffee/70">Laden...</p>;

  return (
    <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
      <h2 className="fine-label text-[0.65rem] text-cocoa">Weekrooster</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-coffee/50">
              <th className="pb-2 pr-3">Dag</th>
              <th className="pb-2 pr-3">Open</th>
              <th className="pb-2 pr-3">Start</th>
              <th className="pb-2 pr-3">Einde</th>
              <th className="pb-2 pr-3">Pauze start</th>
              <th className="pb-2 pr-3">Pauze einde</th>
              <th className="pb-2 pr-3">Max/dag</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-cocoa/10">
                <td className="py-2 pr-3 font-semibold text-coffee">{dayLabels[row.day_of_week]}</td>
                <td className="py-2 pr-3">
                  <input
                    type="checkbox"
                    checked={row.is_available}
                    onChange={(e) => update(row.day_of_week, "is_available", e.target.checked)}
                    className="h-4 w-4 accent-cocoa"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input type="time" value={row.start_time?.slice(0, 5) || ""} onChange={(e) => update(row.day_of_week, "start_time", e.target.value)} className={inputClass} />
                </td>
                <td className="py-2 pr-3">
                  <input type="time" value={row.end_time?.slice(0, 5) || ""} onChange={(e) => update(row.day_of_week, "end_time", e.target.value)} className={inputClass} />
                </td>
                <td className="py-2 pr-3">
                  <input type="time" value={row.break_start_time?.slice(0, 5) || ""} onChange={(e) => update(row.day_of_week, "break_start_time", e.target.value)} className={inputClass} />
                </td>
                <td className="py-2 pr-3">
                  <input type="time" value={row.break_end_time?.slice(0, 5) || ""} onChange={(e) => update(row.day_of_week, "break_end_time", e.target.value)} className={inputClass} />
                </td>
                <td className="py-2 pr-3">
                  <input type="number" min="0" value={row.max_bookings_per_day} onChange={(e) => update(row.day_of_week, "max_bookings_per_day", e.target.value)} className={`${inputClass} w-20`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Feedback feedback={feedback} />
      <AdminButton type="button" onClick={handleSave} disabled={saving} className="mt-4">
        {saving ? "Opslaan..." : "Weekrooster opslaan"}
      </AdminButton>
    </div>
  );
}

function ShootTypeSection() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    supabase
      .from("shoot_type_settings")
      .select("*")
      .order("shoot_type", { ascending: true })
      .then(({ data }) => {
        setRows(data || []);
        setLoading(false);
      });
  }, []);

  const update = (shootType, field, value) => {
    setRows((prev) => prev.map((row) => (row.shoot_type === shootType ? { ...row, [field]: value } : row)));
  };

  const toggleDay = (shootType, dayIndex) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.shoot_type !== shootType) return row;
        const days = row.allowed_days || [];
        const next = days.includes(dayIndex) ? days.filter((d) => d !== dayIndex) : [...days, dayIndex];
        return { ...row, allowed_days: next };
      })
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    const results = await Promise.all(
      rows.map((row) =>
        supabase
          .from("shoot_type_settings")
          .update({
            duration_minutes: Number(row.duration_minutes) || 0,
            buffer_before_minutes: Number(row.buffer_before_minutes) || 0,
            buffer_after_minutes: Number(row.buffer_after_minutes) || 0,
            max_per_day: Number(row.max_per_day) || 0,
            is_bookable: row.is_bookable,
            allowed_days: row.allowed_days,
          })
          .eq("id", row.id)
      )
    );
    setSaving(false);
    const failed = results.find((r) => r.error);
    setFeedback(failed ? { type: "error", message: failed.error.message } : { type: "success", message: "Shoot-instellingen opgeslagen." });
  };

  if (loading) return <p className="text-sm text-coffee/70">Laden...</p>;

  return (
    <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
      <h2 className="fine-label text-[0.65rem] text-cocoa">Beschikbaarheid per shoot-type</h2>
      <div className="mt-4 grid gap-4">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-cocoa/15 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-coffee">{row.shoot_type}</p>
              <label className="flex items-center gap-2 text-xs font-semibold text-coffee">
                <input type="checkbox" checked={row.is_bookable} onChange={(e) => update(row.shoot_type, "is_bookable", e.target.checked)} className="h-4 w-4 accent-cocoa" />
                Zichtbaar op boekingspagina
              </label>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="grid gap-1 text-xs font-semibold text-coffee/70">
                Duur (min)
                <input type="number" min="5" value={row.duration_minutes} onChange={(e) => update(row.shoot_type, "duration_minutes", e.target.value)} className={inputClass} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-coffee/70">
                Buffer vóór (min)
                <input type="number" min="0" value={row.buffer_before_minutes} onChange={(e) => update(row.shoot_type, "buffer_before_minutes", e.target.value)} className={inputClass} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-coffee/70">
                Buffer na (min)
                <input type="number" min="0" value={row.buffer_after_minutes} onChange={(e) => update(row.shoot_type, "buffer_after_minutes", e.target.value)} className={inputClass} />
              </label>
              <label className="grid gap-1 text-xs font-semibold text-coffee/70">
                Max per dag
                <input type="number" min="0" value={row.max_per_day} onChange={(e) => update(row.shoot_type, "max_per_day", e.target.value)} className={inputClass} />
              </label>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold text-coffee/70">Toegestane dagen</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {dayShort.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleDay(row.shoot_type, index)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                      (row.allowed_days || []).includes(index)
                        ? "border-cocoa bg-cocoa text-card"
                        : "border-cocoa/25 bg-cream text-coffee/60"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Feedback feedback={feedback} />
      <AdminButton type="button" onClick={handleSave} disabled={saving} className="mt-4">
        {saving ? "Opslaan..." : "Shoot-instellingen opslaan"}
      </AdminButton>
    </div>
  );
}

function GeneralSettingsSection() {
  const [id, setId] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    supabase
      .from("booking_settings")
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
      .from("booking_settings")
      .update({
        min_days_notice: Number(values.min_days_notice) || 0,
        max_months_ahead: Number(values.max_months_ahead) || 1,
        default_buffer_minutes: Number(values.default_buffer_minutes) || 0,
        default_duration_minutes: Number(values.default_duration_minutes) || 30,
        allow_same_day_booking: values.allow_same_day_booking,
        booking_mode: values.booking_mode,
      })
      .eq("id", id);
    setSaving(false);
    setFeedback(error ? { type: "error", message: error.message } : { type: "success", message: "Algemene regels opgeslagen." });
  };

  if (loading) return <p className="text-sm text-coffee/70">Laden...</p>;

  return (
    <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
      <h2 className="fine-label text-[0.65rem] text-cocoa">Algemene boekingsregels</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Minimaal aantal dagen vooruit boeken
          <input type="number" min="0" value={values.min_days_notice ?? ""} onChange={(e) => update("min_days_notice", e.target.value)} className={inputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Maximaal aantal maanden vooruit boeken
          <input type="number" min="1" value={values.max_months_ahead ?? ""} onChange={(e) => update("max_months_ahead", e.target.value)} className={inputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Standaard buffer (min)
          <input type="number" min="0" value={values.default_buffer_minutes ?? ""} onChange={(e) => update("default_buffer_minutes", e.target.value)} className={inputClass} />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Standaard shootduur (min)
          <input type="number" min="5" value={values.default_duration_minutes ?? ""} onChange={(e) => update("default_duration_minutes", e.target.value)} className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-coffee">
          <input type="checkbox" checked={Boolean(values.allow_same_day_booking)} onChange={(e) => update("allow_same_day_booking", e.target.checked)} className="h-4 w-4 accent-cocoa" />
          Boeken op dezelfde dag toestaan
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Boekingsmodus
          <select value={values.booking_mode || "request_only"} onChange={(e) => update("booking_mode", e.target.value)} className={inputClass}>
            <option value="request_only">Alleen aanvraag (admin bevestigt)</option>
            <option value="admin_confirmation_required">Aanvraag met verplichte bevestiging</option>
            <option value="direct_booking">Direct boeken</option>
          </select>
        </label>
      </div>
      <Feedback feedback={feedback} />
      <AdminButton type="button" onClick={handleSave} disabled={saving} className="mt-4">
        {saving ? "Opslaan..." : "Algemene regels opslaan"}
      </AdminButton>
    </div>
  );
}

export default function AdminAvailability() {
  return (
    <AdminLayout>
      <h1 className="display-title text-3xl font-semibold text-coffee">Beschikbaarheid</h1>
      <p className="mt-2 text-sm text-coffee/70">
        Stel hier je standaard openingstijden, shoot-instellingen en algemene boekingsregels in. Voor vakanties en
        losse blokkades: zie{" "}
        <span className="font-semibold">Geblokkeerde dagen</span>. Voor extra openingen buiten het rooster: zie{" "}
        <span className="font-semibold">Tijdslots</span>.
      </p>
      <div className="mt-6 grid gap-6">
        <WeekScheduleSection />
        <ShootTypeSection />
        <GeneralSettingsSection />
      </div>
    </AdminLayout>
  );
}
