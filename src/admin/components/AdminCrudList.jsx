import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import DataTable from "./DataTable.jsx";
import AdminButton from "./AdminButton.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

function emptyValues(fields) {
  const values = {};
  fields.forEach((field) => {
    values[field.name] = field.type === "checkbox" ? false : "";
  });
  return values;
}

export default function AdminCrudList({
  title,
  table,
  fields,
  columns,
  orderBy = "sort_order",
  emptyLabel = "Nog geen items.",
  newLabel = "Nieuw toevoegen",
}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(() => emptyValues(fields));
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const reload = async () => {
    setLoading(true);
    const { data, error: queryError } = await supabase.from(table).select("*").order(orderBy, { ascending: true });
    if (queryError) setError(queryError.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const openNew = () => {
    setEditingId(null);
    setValues(emptyValues(fields));
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    const nextValues = {};
    fields.forEach((field) => {
      nextValues[field.name] = row[field.name] ?? (field.type === "checkbox" ? false : "");
    });
    setValues(nextValues);
    setFormOpen(true);
  };

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = { ...values };
    fields.forEach((field) => {
      if (field.type === "number") {
        payload[field.name] = payload[field.name] === "" ? null : Number(payload[field.name]);
      }
      if (field.type === "select" && payload[field.name] === "") {
        payload[field.name] = null;
      }
    });

    const query = editingId
      ? supabase.from(table).update(payload).eq("id", editingId)
      : supabase.from(table).insert(payload);

    const { error: saveError } = await query;
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setFormOpen(false);
    reload();
  };

  const handleDelete = async () => {
    await supabase.from(table).delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    reload();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-title text-3xl font-semibold text-coffee">{title}</h1>
        <AdminButton onClick={openNew}>
          <Plus size={14} /> {newLabel}
        </AdminButton>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border sm:grid-cols-2"
        >
          {fields.map((field) => (
            <label
              key={field.name}
              className={`grid gap-2 text-sm font-semibold text-coffee ${field.wide ? "sm:col-span-2" : ""}`}
            >
              {field.label}
              {field.type === "textarea" && (
                <textarea
                  rows={field.rows || 4}
                  required={field.required}
                  value={values[field.name]}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                />
              )}
              {field.type === "select" && (
                <select
                  required={field.required}
                  value={values[field.name]}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                >
                  <option value="">Kies...</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              {field.type === "checkbox" && (
                <input
                  type="checkbox"
                  checked={Boolean(values[field.name])}
                  onChange={(event) => handleChange(field.name, event.target.checked)}
                  className="h-4 w-4 accent-cocoa"
                />
              )}
              {["text", "number", "date", "datetime-local", "time"].includes(field.type || "text") && (
                <input
                  type={field.type || "text"}
                  step={field.step}
                  required={field.required}
                  value={values[field.name]}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                />
              )}
            </label>
          ))}
          <div className="flex gap-3 sm:col-span-2">
            <AdminButton type="submit" disabled={saving}>
              {saving ? "Opslaan..." : "Opslaan"}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Annuleren
            </AdminButton>
          </div>
        </form>
      )}

      <div className="mt-5">
        <DataTable
          loading={loading}
          rows={rows}
          getRowKey={(row) => row.id}
          emptyLabel={emptyLabel}
          columns={[
            ...columns,
            {
              key: "actions",
              label: "",
              render: (row) => (
                <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-cocoa/25 text-coffee transition hover:bg-linen"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-red-300 text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Item verwijderen?"
        description="Deze actie kan niet ongedaan worden gemaakt."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
