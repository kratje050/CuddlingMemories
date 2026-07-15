import { Check, Circle, ListChecks, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { formatDate } from "../../lib/formatDate.js";
import AdminButton from "./AdminButton.jsx";

export default function BookingTasksCard({ bookingId, userEmail }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase.from("booking_tasks").select("*").eq("booking_id", bookingId).order("sort_order", { ascending: true });
    if (queryError) setError(queryError.message);
    else { setTasks(data || []); setError(""); }
    setLoading(false);
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  async function toggle(task) {
    const done = task.status !== "done";
    const { error: updateError } = await supabase.from("booking_tasks").update({
      status: done ? "done" : "open",
      completed_at: done ? new Date().toISOString() : null,
      completed_by: done ? userEmail || "admin" : null,
    }).eq("id", task.id);
    if (updateError) setError(updateError.message); else load();
  }

  async function addTask(event) {
    event.preventDefault();
    if (!title.trim()) return;
    const { error: insertError } = await supabase.from("booking_tasks").insert({ booking_id: bookingId, title: title.trim(), due_date: dueDate || null, sort_order: 90 + tasks.length });
    if (insertError) setError(insertError.message);
    else { setTitle(""); setDueDate(""); load(); }
  }

  async function remove(task) {
    if (!window.confirm(`Taak “${task.title}” verwijderen?`)) return;
    const { error: deleteError } = await supabase.from("booking_tasks").delete().eq("id", task.id);
    if (deleteError) setError(deleteError.message); else load();
  }

  const completed = tasks.filter((task) => task.status === "done").length;

  return (
    <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linen text-cocoa"><ListChecks size={21} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="display-title text-xl font-semibold text-coffee">Taken voor deze boeking</h2>
            <span className="rounded-full bg-linen px-3 py-1 text-xs font-semibold text-cocoa">{completed}/{tasks.length} klaar</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-coffee/60">Automatische taken bewegen mee wanneer de shootdatum verandert. Je kunt ook eigen taken toevoegen.</p>
        </div>
      </div>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-4 text-sm text-coffee/60">Taken laden...</p>}
      <div className="mt-5 grid gap-2">
        {tasks.map((task) => {
          const done = task.status === "done";
          const overdue = !done && task.due_date && task.due_date < new Date().toISOString().slice(0, 10);
          return (
            <div key={task.id} className={`flex items-start gap-3 rounded-lg border p-3 ${done ? "border-cocoa/10 bg-linen/35" : overdue ? "border-red-200 bg-red-50/45" : "border-cocoa/15 bg-cream"}`}>
              <button type="button" onClick={() => toggle(task)} className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${done ? "border-cocoa bg-cocoa text-card" : "border-cocoa/30 text-cocoa"}`} aria-label={done ? "Taak opnieuw openen" : "Taak afronden"}>{done ? <Check size={14} /> : <Circle size={13} />}</button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${done ? "text-coffee/45 line-through" : "text-coffee"}`}>{task.title}</p>
                {task.description && <p className="mt-1 text-xs leading-5 text-coffee/55">{task.description}</p>}
                {task.due_date && <p className={`mt-1 text-[0.68rem] font-semibold ${overdue ? "text-red-700" : "text-cocoa"}`}>{overdue ? "Verlopen · " : "Uiterlijk · "}{formatDate(task.due_date)}</p>}
              </div>
              <div className="flex shrink-0 gap-1">
                {done && <button type="button" onClick={() => toggle(task)} title="Opnieuw openen" className="grid h-8 w-8 place-items-center text-coffee/45 hover:text-cocoa"><RotateCcw size={14} /></button>}
                <button type="button" onClick={() => remove(task)} title="Verwijderen" className="grid h-8 w-8 place-items-center text-coffee/35 hover:text-red-700"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={addTask} className="mt-5 grid gap-3 rounded-lg bg-linen/55 p-4 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
        <label className="grid gap-1.5 text-xs font-semibold text-coffee">Nieuwe taak<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Bijv. decoratie klaarzetten" className="rounded-lg border border-cocoa/20 bg-card px-3 py-2 text-sm outline-none focus:border-cocoa" /></label>
        <label className="grid gap-1.5 text-xs font-semibold text-coffee">Uiterste datum<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="rounded-lg border border-cocoa/20 bg-card px-3 py-2 text-sm outline-none focus:border-cocoa" /></label>
        <AdminButton type="submit" disabled={!title.trim()}><Plus size={14} /> Toevoegen</AdminButton>
      </form>
    </div>
  );
}
