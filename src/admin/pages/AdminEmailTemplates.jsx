import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Plus, RefreshCw } from "lucide-react";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import DataTable from "../components/DataTable.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { emailTemplateDefaults } from "../../lib/emailTemplates.js";

const emptyForm = {
  template_key: "",
  label: "",
  subject: "",
  body: "",
  is_active: true,
};

const defaultKeys = new Set(emailTemplateDefaults.map((template) => template.template_key));

function mergeTemplates(databaseRows = []) {
  const rowsByKey = new Map(databaseRows.map((row) => [row.template_key, row]));
  const builtInRows = emailTemplateDefaults.map((fallback) => {
    const saved = rowsByKey.get(fallback.template_key);
    return {
      ...fallback,
      is_active: true,
      ...saved,
      id: saved?.id || `default-${fallback.template_key}`,
      is_saved: Boolean(saved),
      is_builtin: true,
    };
  });

  const customRows = databaseRows
    .filter((row) => !defaultKeys.has(row.template_key))
    .map((row) => ({ ...row, is_saved: true, is_builtin: false }));

  return [...builtInRows, ...customRows];
}

function FieldHelp({ children }) {
  return <p className="text-xs font-normal leading-5 text-coffee/55">{children}</p>;
}

export default function AdminEmailTemplates() {
  const [databaseRows, setDatabaseRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBuiltIn, setEditingBuiltIn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const rows = useMemo(() => mergeTemplates(databaseRows), [databaseRows]);
  const missingCount = rows.filter((row) => row.is_builtin && !row.is_saved).length;

  const loadTemplates = async () => {
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("email_templates")
      .select("*")
      .order("template_key", { ascending: true });

    if (queryError) setError(queryError.message);
    setDatabaseRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingBuiltIn(false);
    setFormOpen(true);
    setError("");
    setNotice("");
  };

  const openEdit = (row) => {
    setForm({
      template_key: row.template_key,
      label: row.label,
      subject: row.subject,
      body: row.body,
      is_active: row.is_active ?? true,
    });
    setEditingBuiltIn(row.is_builtin);
    setFormOpen(true);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      template_key: form.template_key.trim(),
      label: form.label.trim(),
      subject: form.subject.trim(),
      body: form.body.trim(),
      is_active: Boolean(form.is_active),
    };
    const { error: saveError } = await supabase
      .from("email_templates")
      .upsert(payload, { onConflict: "template_key" });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    setFormOpen(false);
    setNotice(`Template '${payload.label}' is opgeslagen.`);
    await loadTemplates();
  };

  const syncMissingTemplates = async () => {
    const savedKeys = new Set(databaseRows.map((row) => row.template_key));
    const missing = emailTemplateDefaults.filter((template) => !savedKeys.has(template.template_key));
    if (missing.length === 0) {
      setNotice("Alle beschikbare templates staan al in de database.");
      return;
    }

    setSyncing(true);
    setError("");
    setNotice("");
    const payload = missing.map((template) => ({ ...template, is_active: true }));
    const { error: syncError } = await supabase.from("email_templates").insert(payload);
    setSyncing(false);

    if (syncError) {
      setError(syncError.message);
      return;
    }

    setNotice(`${missing.length} ontbrekende template${missing.length === 1 ? "" : "s"} toegevoegd. Bestaande aanpassingen zijn behouden.`);
    await loadTemplates();
  };

  const columns = [
    {
      key: "label",
      label: "Template",
      render: (row) => (
        <div>
          <p className="font-semibold text-coffee">{row.label}</p>
          <p className="mt-1 text-xs text-coffee/55">{row.is_builtin ? "Ingebouwde automatische mail" : "Eigen template"}</p>
        </div>
      ),
    },
    { key: "template_key", label: "Technische sleutel" },
    { key: "subject", label: "Onderwerp" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] ${row.is_active ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"}`}>
            {row.is_active ? "Actief" : "Uitgeschakeld"}
          </span>
          {!row.is_saved && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-amber-800">
              Standaardtekst
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => openEdit(row)}
          title={`Template ${row.label} aanpassen`}
          className="grid h-9 w-9 place-items-center rounded-full border border-cocoa/25 text-coffee transition hover:bg-linen"
        >
          <Pencil size={15} />
        </button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="fine-label text-cocoa">Communicatie</p>
          <h1 className="display-title mt-2 text-3xl font-semibold text-coffee">E-mailtemplates</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-coffee/65">
            Hier beheer je alle automatische mails van de website. Wijzig onderwerp en tekst; de warme huisstijl wordt bij het verzenden automatisch toegevoegd.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton variant="secondary" onClick={syncMissingTemplates} disabled={syncing || missingCount === 0}>
            {missingCount === 0 ? <Check size={15} /> : <RefreshCw size={15} className={syncing ? "animate-spin" : ""} />}
            {missingCount === 0 ? "Alles toegevoegd" : `${missingCount} ontbrekende toevoegen`}
          </AdminButton>
          <AdminButton onClick={openNew}>
            <Plus size={15} /> Eigen template
          </AdminButton>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-lg bg-linen p-4 warm-border sm:grid-cols-3">
        <div>
          <p className="fine-label text-cocoa">Beschikbaar</p>
          <p className="mt-1 text-2xl font-semibold text-coffee">{rows.length}</p>
          <p className="mt-1 text-xs leading-5 text-coffee/55">Alle ingebouwde en zelfgemaakte templates.</p>
        </div>
        <div>
          <p className="fine-label text-cocoa">Opgeslagen</p>
          <p className="mt-1 text-2xl font-semibold text-coffee">{rows.filter((row) => row.is_saved).length}</p>
          <p className="mt-1 text-xs leading-5 text-coffee/55">Templates die in Supabase staan en aangepast kunnen worden.</p>
        </div>
        <div>
          <p className="fine-label text-cocoa">Nog toevoegen</p>
          <p className="mt-1 text-2xl font-semibold text-coffee">{missingCount}</p>
          <p className="mt-1 text-xs leading-5 text-coffee/55">Deze werken al met de standaardtekst en kunnen veilig worden gesynchroniseerd.</p>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {notice && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      {formOpen && (
        <form onSubmit={saveTemplate} className="mt-5 grid gap-5 rounded-lg bg-card p-5 shadow-soft warm-border sm:grid-cols-2">
          <div className="sm:col-span-2">
            <p className="fine-label text-cocoa">{editingBuiltIn ? "Template aanpassen" : "Eigen template maken"}</p>
            <h2 className="display-title mt-2 text-2xl text-coffee">{form.label || "Nieuw e-mailtemplate"}</h2>
          </div>

          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Template sleutel
            <FieldHelp>Technische naam die de mailfunctie gebruikt, bijvoorbeeld gallery_ready. Bij ingebouwde templates kan deze niet worden gewijzigd.</FieldHelp>
            <input
              required
              readOnly={editingBuiltIn}
              value={form.template_key}
              onChange={(event) => setForm((current) => ({ ...current, template_key: event.target.value }))}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none read-only:cursor-not-allowed read-only:opacity-65 focus:border-cocoa"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Naam in admin
            <FieldHelp>Herkenbare naam die alleen in het beheerscherm wordt getoond.</FieldHelp>
            <input
              required
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-coffee sm:col-span-2">
            Onderwerp
            <FieldHelp>Dit is de onderwerpregel die de ontvanger in de inbox ziet. Variabelen mogen ook hier worden gebruikt.</FieldHelp>
            <input
              required
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-coffee sm:col-span-2">
            E-mailtekst
            <FieldHelp>De inhoud van de mail. Witregels blijven behouden en de vaste kop, kleuren en afsluiting worden automatisch toegevoegd.</FieldHelp>
            <textarea
              required
              rows={10}
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              className="resize-y rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm leading-6 outline-none focus:border-cocoa"
            />
          </label>

          <div className="rounded-lg bg-linen p-4 text-xs leading-6 text-coffee/65 sm:col-span-2 warm-border">
            <p className="font-semibold text-coffee">Beschikbare variabelen</p>
            <p className="mt-1 break-words font-mono">{"{{customer_name}}, {{shoot_type}}, {{booking_date}}, {{booking_time}}, {{portal_link}}, {{gallery_link}}, {{included_images}}, {{selected_count}}, {{extra_count}}, {{giftcard_amount}}, {{mini_session_title}}, {{admin_link}}"}</p>
            <p className="mt-1">Niet iedere variabele is bij iedere mail beschikbaar. De ingebouwde templates gebruiken alleen variabelen die bij dat mailmoment worden aangeleverd.</p>
          </div>

          <label className="flex items-start gap-3 rounded-lg bg-linen p-4 text-sm font-semibold text-coffee sm:col-span-2 warm-border">
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              className="mt-0.5 h-4 w-4 accent-cocoa"
            />
            <span>
              Template actief
              <span className="mt-1 block text-xs font-normal leading-5 text-coffee/55">Een uitgeschakeld template wordt niet gebruikt voor automatische mails.</span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <AdminButton type="submit" disabled={saving}>{saving ? "Opslaan..." : "Template opslaan"}</AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => setFormOpen(false)}>Annuleren</AdminButton>
          </div>
        </form>
      )}

      <div className="mt-5">
        <DataTable loading={loading} rows={rows} getRowKey={(row) => row.id} columns={columns} emptyLabel="Nog geen e-mailtemplates." />
      </div>
    </AdminLayout>
  );
}
