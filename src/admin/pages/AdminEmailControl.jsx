import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Clock3, MailCheck, RefreshCw, RotateCcw, Save, Send, X } from "lucide-react";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import DataTable from "../components/DataTable.jsx";
import { supabase } from "../../lib/supabaseClient.js";
import { emailTemplateDefaults, renderTemplate } from "../../lib/emailTemplates.js";
import { formatDate, formatDateTime } from "../../lib/formatDate.js";
import { useAdminAuth } from "../hooks/useAdminAuth.js";

const inactiveBookingStatuses = new Set(["Geannuleerd", "Gearchiveerd", "Afgerond"]);

export default function AdminEmailControl() {
  const { user } = useAdminAuth();
  const [templates, setTemplates] = useState([]);
  const [logs, setLogs] = useState([]);
  const [planned, setPlanned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState("");
  const [testEmail, setTestEmail] = useState(user?.email || "");
  const [testTemplate, setTestTemplate] = useState("booking_received");
  const [selectedPlanned, setSelectedPlanned] = useState(null);
  const [selectedSent, setSelectedSent] = useState(null);
  const [sentAudience, setSentAudience] = useState("customer");
  const [plannedDraft, setPlannedDraft] = useState({ subject: "", body: "" });
  const [savingOverride, setSavingOverride] = useState(false);

  useEffect(() => {
    if (user?.email && !testEmail) setTestEmail(user.email);
  }, [user?.email, testEmail]);

  const load = async () => {
    setLoading(true);
    setError("");
    const [templateResult, logResult, bookingResult, invoiceResult, overrideResult] = await Promise.all([
      supabase.from("email_templates").select("*").order("label", { ascending: true }),
      supabase.from("email_logs").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("bookings").select("id,customer_name,customer_email,shoot_type,booking_date,start_time,location,status,portal_token,deposit_amount,deposit_due_date,deposit_status").order("booking_date", { ascending: true, nullsFirst: false }),
      supabase.from("invoices").select("id,booking_id,invoice_number,total_amount,due_at,status").order("due_at", { ascending: true, nullsFirst: false }),
      supabase.from("scheduled_email_overrides").select("id,booking_id,template_key,subject,body,updated_at"),
    ]);
    const firstError = templateResult.error || logResult.error || bookingResult.error || invoiceResult.error || overrideResult.error;
    if (firstError) {
      setError(firstError.message);
      setLoading(false);
      return;
    }

    const mergedTemplates = mergeTemplates(templateResult.data || []);
    const emailLogs = logResult.data || [];
    setTemplates(mergedTemplates);
    setLogs(emailLogs);
    setPlanned(buildPlannedEmails(bookingResult.data || [], invoiceResult.data || [], emailLogs, mergedTemplates, overrideResult.data || []));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const failedLogs = useMemo(() => logs.filter((log) => log.status === "failed"), [logs]);
  const allSentLogs = useMemo(() => logs.filter((log) => log.status === "sent"), [logs]);
  const sentCounts = useMemo(() => ({
    all: allSentLogs.length,
    customer: allSentLogs.filter((log) => !isAdminTemplate(log.template_key)).length,
    admin: allSentLogs.filter((log) => isAdminTemplate(log.template_key)).length,
  }), [allSentLogs]);
  const sentLogs = useMemo(() => allSentLogs.filter((log) => sentAudience === "all" || (sentAudience === "admin") === isAdminTemplate(log.template_key)), [allSentLogs, sentAudience]);
  const sentLastSevenDays = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return logs.filter((log) => log.status === "sent" && new Date(log.created_at).getTime() >= since).length;
  }, [logs]);

  const callControl = async (payload, busyKey) => {
    setBusyId(busyKey);
    setError("");
    setNotice("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch("/api/email-control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session?.access_token || ""}`,
        },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.ok) throw new Error(body.message || "E-mailactie is mislukt.");
      setNotice(body.message || "E-mailactie is uitgevoerd.");
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "E-mailactie is mislukt.");
    } finally {
      setBusyId("");
    }
  };

  const openPlannedEmail = (row) => {
    const template = templates.find((item) => item.template_key === row.template_key);
    setSelectedPlanned(row);
    setPlannedDraft({
      subject: row.override?.subject || template?.subject || "",
      body: row.override?.body || template?.body || "",
    });
    setError("");
    setNotice("");
  };

  const savePlannedOverride = async () => {
    if (!selectedPlanned || !plannedDraft.subject.trim() || !plannedDraft.body.trim()) return;
    setSavingOverride(true);
    setError("");
    const { error: saveError } = await supabase.from("scheduled_email_overrides").upsert({
      booking_id: selectedPlanned.booking_id,
      template_key: selectedPlanned.template_key,
      subject: plannedDraft.subject.trim(),
      body: plannedDraft.body.trim(),
    }, { onConflict: "booking_id,template_key" });
    setSavingOverride(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setSelectedPlanned(null);
    setNotice(`De geplande mail voor ${selectedPlanned.customer_name} is aangepast.`);
    await load();
  };

  const resetPlannedOverride = async () => {
    if (!selectedPlanned?.override) return;
    setSavingOverride(true);
    setError("");
    const { error: deleteError } = await supabase
      .from("scheduled_email_overrides")
      .delete()
      .eq("booking_id", selectedPlanned.booking_id)
      .eq("template_key", selectedPlanned.template_key);
    setSavingOverride(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setSelectedPlanned(null);
    setNotice("De geplande mail gebruikt weer de standaardtemplate.");
    await load();
  };

  const plannedColumns = [
    { key: "send_date", label: "Verzenden", render: (row) => <><span className="font-semibold">{formatDate(row.send_date)}</span><span className="ml-2 text-xs text-coffee/55">07:00</span></> },
    { key: "recipient_email", label: "Ontvanger", render: (row) => <div><p>{row.customer_name}</p><p className="text-xs text-coffee/55">{row.recipient_email}</p></div> },
    { key: "label", label: "Automatische mail" },
    { key: "reason", label: "Waarom gepland" },
    { key: "enabled", label: "Status", render: (row) => <div className="flex flex-wrap gap-2"><StatusBadge status={row.enabled ? "planned" : "disabled"} />{row.override && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Aangepast</span>}</div> },
    { key: "open", label: "", render: () => <ChevronRight size={18} className="text-cocoa/50" /> },
  ];

  const failedColumns = [
    { key: "created_at", label: "Mislukt op", render: (row) => formatDateTime(row.created_at) },
    { key: "recipient_email", label: "Ontvanger" },
    { key: "template_key", label: "Template", render: (row) => templateLabel(templates, row.template_key) },
    { key: "error_message", label: "Fout", render: (row) => <span className="text-red-800">{row.error_message || "Onbekende verzendfout"}</span> },
    { key: "retry", label: "", render: (row) => <button type="button" onClick={(event) => { event.stopPropagation(); callControl({ action: "retry", log_id: row.id }, row.id); }} disabled={busyId === row.id} className="inline-flex items-center gap-2 rounded-full border border-cocoa/25 px-3 py-2 text-xs font-semibold text-coffee transition hover:bg-linen disabled:opacity-50"><RotateCcw size={14} className={busyId === row.id ? "animate-spin" : ""} />{busyId === row.id ? "Bezig..." : "Opnieuw"}</button> },
  ];

  const sentColumns = [
    { key: "created_at", label: "Verzonden op", render: (row) => <span className="font-semibold">{formatDateTime(row.created_at)}</span> },
    { key: "recipient_email", label: "Ontvanger" },
    { key: "audience", label: "Soort", render: (row) => <AudienceBadge admin={isAdminTemplate(row.template_key)} /> },
    { key: "template_key", label: "E-mail", render: (row) => templateLabel(templates, row.template_key) },
    { key: "subject", label: "Onderwerp", render: (row) => row.subject || "Geen onderwerp opgeslagen" },
    { key: "open", label: "", render: () => <ChevronRight size={18} className="text-cocoa/50" /> },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="fine-label text-cocoa">Communicatie</p>
          <h1 className="display-title mt-2 text-3xl font-semibold text-coffee">E-mailcontrolecentrum</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-coffee/65">Bekijk wat automatisch klaarstaat, controleer verzendfouten en verstuur een echte testmail met de gekozen template.</p>
        </div>
        <AdminButton variant="secondary" onClick={load} disabled={loading}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Vernieuwen</AdminButton>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {notice && <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Summary icon={Clock3} label="Gepland" value={planned.filter((row) => row.enabled).length} text="Toekomstige herinneringen die nog niet zijn verzonden." />
        <Summary icon={AlertCircle} label="Mislukt" value={failedLogs.length} text="Mails die aandacht nodig hebben en opnieuw kunnen worden verzonden." danger={failedLogs.length > 0} />
        <Summary icon={MailCheck} label="Verzonden" value={sentLastSevenDays} text="Succesvol verzonden in de afgelopen zeven dagen." />
      </div>

      <section className="mt-7 rounded-lg bg-card p-5 shadow-soft warm-border">
        <div className="flex items-start gap-3"><Send className="mt-0.5 text-cocoa" size={20} /><div><h2 className="display-title text-2xl font-semibold text-coffee">Testmail versturen</h2><p className="mt-1 text-xs leading-5 text-coffee/55">De test gebruikt voorbeeldgegevens en de echte huisstijl. Ook een uitgeschakeld template kan hiermee veilig worden getest.</p></div></div>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="grid gap-2 text-sm font-semibold text-coffee">E-mailadres<span className="text-xs font-normal text-coffee/55">Hier komt de testmail werkelijk binnen.</span><input type="email" value={testEmail} onChange={(event) => setTestEmail(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2.5 text-sm outline-none focus:border-cocoa" /></label>
          <label className="grid gap-2 text-sm font-semibold text-coffee">Template<span className="text-xs font-normal text-coffee/55">Kies welke onderwerpregel, tekst en opmaak je wilt testen.</span><select value={testTemplate} onChange={(event) => setTestTemplate(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2.5 text-sm outline-none focus:border-cocoa">{templates.map((template) => <option key={template.template_key} value={template.template_key}>{template.label}{template.is_active ? "" : " (uitgeschakeld)"}</option>)}</select></label>
          <AdminButton type="button" onClick={() => callControl({ action: "test", recipient_email: testEmail, template_key: testTemplate }, "test")} disabled={busyId === "test" || !testEmail || !testTemplate}><Send size={14} /> {busyId === "test" ? "Versturen..." : "Testmail"}</AdminButton>
        </div>
      </section>

      <section className="mt-8">
        <p className="fine-label text-cocoa">Automatische verzendrij</p>
        <h2 className="display-title mt-1 text-2xl font-semibold text-coffee">Geplande mails</h2>
        <p className="mt-2 text-sm leading-6 text-coffee/60">Herinneringen worden dagelijks rond 07:00 gecontroleerd. Uitgeschakelde templates blijven zichtbaar, maar worden niet verzonden.</p>
        <div className="mt-4"><DataTable loading={loading} rows={planned} columns={plannedColumns} getRowKey={(row) => row.id} onRowClick={openPlannedEmail} emptyLabel="Er staan momenteel geen automatische mails gepland." /></div>
      </section>

      {selectedPlanned && (
        <PlannedEmailDialog
          row={selectedPlanned}
          draft={plannedDraft}
          setDraft={setPlannedDraft}
          saving={savingOverride}
          onClose={() => setSelectedPlanned(null)}
          onSave={savePlannedOverride}
          onReset={resetPlannedOverride}
        />
      )}

      <section className="mt-8">
        <p className="fine-label text-cocoa">Verzendgeschiedenis</p>
        <h2 className="display-title mt-1 text-2xl font-semibold text-coffee">Verzonden mails</h2>
        <p className="mt-2 text-sm leading-6 text-coffee/60">Klantmails en interne adminmeldingen staan apart. Klik op een mail om de ontvanger, het onderwerp en de volledige inhoud te bekijken.</p>
        <div className="mt-4 inline-flex max-w-full overflow-x-auto rounded-lg border border-cocoa/15 bg-card p-1" role="tablist" aria-label="Verzonden mails filteren">
          <HistoryFilter active={sentAudience === "customer"} onClick={() => setSentAudience("customer")}>Klantmails {sentCounts.customer}</HistoryFilter>
          <HistoryFilter active={sentAudience === "admin"} onClick={() => setSentAudience("admin")}>Adminmails {sentCounts.admin}</HistoryFilter>
          <HistoryFilter active={sentAudience === "all"} onClick={() => setSentAudience("all")}>Alles {sentCounts.all}</HistoryFilter>
        </div>
        <div className="mt-4"><DataTable loading={loading} rows={sentLogs} columns={sentColumns} getRowKey={(row) => row.id} onRowClick={setSelectedSent} emptyLabel="Er zijn nog geen verzonden mails opgeslagen." /></div>
      </section>

      {selectedSent && (
        <SentEmailDialog
          row={selectedSent}
          templates={templates}
          onClose={() => setSelectedSent(null)}
        />
      )}

      <section className="mt-8">
        <p className="fine-label text-cocoa">Aandacht nodig</p>
        <h2 className="display-title mt-1 text-2xl font-semibold text-coffee">Mislukte mails</h2>
        <p className="mt-2 text-sm leading-6 text-coffee/60">Opnieuw verzenden gebruikt de oorspronkelijke variabelen. Bij oudere logs worden klant- en boekingsgegevens automatisch opnieuw opgebouwd.</p>
        <div className="mt-4"><DataTable loading={loading} rows={failedLogs} columns={failedColumns} getRowKey={(row) => row.id} emptyLabel="Mooi: er zijn geen mislukte mails." /></div>
      </section>

      <section className="mt-8 grid gap-3 md:grid-cols-3">
        <Rule title="Direct na een actie" text="Aanvragen, bevestigingen, galerijen en betaalkeuzes worden meteen na de betreffende actie verstuurd." />
        <Rule title="Dagelijks om 07:00" text="Voorbereidingstips, shoot-reminders en betaalherinneringen worden iedere ochtend gecontroleerd." />
        <Rule title="Iedere 15 minuten" text="De wachtlijst controleert regelmatig of er een passende vrije plek is ontstaan." />
      </section>
    </AdminLayout>
  );
}

function SentEmailDialog({ row, templates, onClose }) {
  const template = templates.find((item) => item.template_key === row.template_key);
  const variables = row.variables && typeof row.variables === "object" ? row.variables : {};
  const subject = row.subject || renderTemplate(template?.subject || row.template_key || "Verzonden e-mail", variables);
  const body = row.body_text || renderTemplate(template?.body || "De inhoud van deze oudere mail is niet meer beschikbaar.", variables);
  const exactCopy = Boolean(row.body_text);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-coffee/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="sent-email-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-t-lg bg-card shadow-2xl warm-border sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cocoa/15 bg-card px-5 py-4 sm:px-6">
          <div>
            <p className="fine-label text-cocoa">Verzonden mail bekijken</p>
            <h2 id="sent-email-title" className="display-title mt-1 text-2xl font-semibold text-coffee">{templateLabel(templates, row.template_key)}</h2>
            <p className="mt-1 text-xs text-coffee/55">Verzonden naar {row.recipient_email} op {formatDateTime(row.created_at)}</p>
          </div>
          <button type="button" onClick={onClose} title="Sluiten" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cocoa/20 text-coffee transition hover:bg-linen"><X size={18} /></button>
        </div>

        <div className="p-5 sm:p-6">
          {!exactCopy && (
            <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Dit is een oudere mail. De inhoud is opnieuw opgebouwd met de opgeslagen gegevens en de huidige template en kan daarom iets afwijken van wat destijds is verzonden.</p>
          )}

          <div className="grid gap-3 rounded-lg bg-linen p-4 text-sm text-coffee/70 warm-border sm:grid-cols-2">
            <p><strong className="text-coffee">Ontvanger:</strong><br />{row.recipient_email}</p>
            <p><strong className="text-coffee">Verzonden:</strong><br />{formatDateTime(row.created_at)}</p>
            <p><strong className="text-coffee">Template:</strong><br />{templateLabel(templates, row.template_key)}</p>
            <p><strong className="text-coffee">Status:</strong><br />Succesvol verzonden</p>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-[#e7d8ca] bg-[#fffaf4] shadow-soft">
            <div className="bg-[#eadbce] px-6 py-5">
              <p className="font-serif text-2xl text-[#4e3b2f]">Cuddling Memories</p>
              <p className="mt-1 text-[0.62rem] uppercase tracking-[0.22em] text-[#9a7359]">Fotografie</p>
            </div>
            <div className="px-6 py-6">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9a7359]">Onderwerp</p>
              <h3 className="mt-2 font-serif text-2xl leading-tight text-[#3f2c22]">{subject}</h3>
              <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#5f4b40]">{body}</div>
              <p className="mt-6 border-t border-[#eadbce] pt-4 text-xs leading-5 text-[#8a6b55]">Liefs,<br />Cuddling Memories Fotografie</p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-coffee/50">Een verzonden mail kan niet meer worden aangepast. Wijzig toekomstige mails via Geplande mails of E-mailtemplates.</p>
        </div>

        <div className="sticky bottom-0 border-t border-cocoa/15 bg-card px-5 py-4 sm:px-6">
          <AdminButton type="button" variant="secondary" onClick={onClose}>Sluiten</AdminButton>
        </div>
      </div>
    </div>
  );
}

function buildPlannedEmails(bookings, invoices, logs, templates, overrides) {
  const today = dateKey(new Date());
  const sent = new Set(logs.filter((log) => log.status === "sent" && log.related_booking_id).map((log) => `${log.related_booking_id}|${log.template_key}`));
  const activeByKey = new Map(templates.map((template) => [template.template_key, template.is_active !== false]));
  const labelByKey = new Map(templates.map((template) => [template.template_key, template.label]));
  const overrideByKey = new Map(overrides.map((override) => [`${override.booking_id}|${override.template_key}`, override]));
  const queue = [];
  const add = (booking, templateKey, sendDate, reason, extra = {}) => {
    if (!sendDate || sendDate < today || sent.has(`${booking.id}|${templateKey}`)) return;
    const { variables: extraVariables = {}, ...extraFields } = extra;
    const commonVariables = {
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      shoot_type: booking.shoot_type,
      booking_date: formatDate(booking.booking_date),
      booking_time: String(booking.start_time || "").slice(0, 5) || "de afgesproken tijd",
      location: booking.location || "Volgens afspraak",
      portal_link: booking.portal_token ? `${window.location.origin}/klantportaal/${booking.portal_token}` : window.location.origin,
    };
    queue.push({ id: `${booking.id}-${templateKey}-${sendDate}`, booking_id: booking.id, customer_name: booking.customer_name, recipient_email: booking.customer_email, template_key: templateKey, label: labelByKey.get(templateKey) || templateKey, send_date: sendDate, reason, enabled: activeByKey.get(templateKey) !== false, override: overrideByKey.get(`${booking.id}|${templateKey}`) || null, variables: { ...commonVariables, ...extraVariables }, ...extraFields });
  };

  bookings.filter((booking) => booking.customer_email && !inactiveBookingStatuses.has(booking.status)).forEach((booking) => {
    if (booking.booking_date) {
      add(booking, "preparation_tips", addDays(booking.booking_date, -7), `7 dagen voor de ${booking.shoot_type}`);
      add(booking, "shoot_reminder", addDays(booking.booking_date, -1), `1 dag voor de ${booking.shoot_type}`);
    }
    if (Number(booking.deposit_amount || 0) > 0 && !["Betaald", "Terugbetaald"].includes(booking.deposit_status)) {
      add(booking, "deposit_due_reminder", booking.deposit_due_date, "Uiterste betaaldatum van de aanbetaling", { variables: { deposit_amount: formatEuro(booking.deposit_amount), deposit_due_date: formatDate(booking.deposit_due_date) } });
    }
  });

  const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));
  invoices.filter((invoice) => invoice.due_at && !["Betaald", "Gecrediteerd"].includes(invoice.status)).forEach((invoice) => {
    const booking = bookingsById.get(invoice.booking_id);
    if (booking && !inactiveBookingStatuses.has(booking.status)) {
      const paidDeposit = booking.deposit_status === "Betaald" ? Math.min(Number(booking.deposit_amount || 0), Number(invoice.total_amount || 0)) : 0;
      add(booking, "invoice_due_reminder", invoice.due_at, `Vervaldatum factuur ${invoice.invoice_number}`, { variables: { invoice_number: invoice.invoice_number, invoice_amount: formatEuro(Math.max(0, Number(invoice.total_amount || 0) - paidDeposit)), invoice_due_date: formatDate(invoice.due_at) } });
    }
  });
  return queue.sort((a, b) => a.send_date.localeCompare(b.send_date)).slice(0, 250);
}

function PlannedEmailDialog({ row, draft, setDraft, saving, onClose, onSave, onReset }) {
  const renderedSubject = renderTemplate(draft.subject, row.variables);
  const renderedBody = renderTemplate(draft.body, row.variables);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-coffee/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="planned-email-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-lg bg-card shadow-2xl warm-border sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-cocoa/15 bg-card px-5 py-4 sm:px-6">
          <div>
            <p className="fine-label text-cocoa">Geplande mail bekijken</p>
            <h2 id="planned-email-title" className="display-title mt-1 text-2xl font-semibold text-coffee">{row.label}</h2>
            <p className="mt-1 text-xs text-coffee/55">Naar {row.customer_name} op {formatDate(row.send_date)} rond 07:00</p>
          </div>
          <button type="button" onClick={onClose} title="Sluiten" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cocoa/20 text-coffee transition hover:bg-linen"><X size={18} /></button>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-5">
            <div className="rounded-lg bg-linen p-4 text-sm leading-6 text-coffee/70 warm-border">
              <p><strong className="text-coffee">Ontvanger:</strong> {row.recipient_email}</p>
              <p><strong className="text-coffee">Waarom:</strong> {row.reason}</p>
              <p className="mt-2 text-xs">Deze wijziging geldt alleen voor deze geplande mail. Andere klanten blijven de standaardtemplate ontvangen.</p>
            </div>

            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Onderwerp
              <span className="text-xs font-normal leading-5 text-coffee/55">Dit ziet de klant als onderwerpregel. Variabelen zoals {"{{customer_name}}"} mogen blijven staan.</span>
              <input value={draft.subject} onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2.5 text-sm outline-none focus:border-cocoa" />
            </label>

            <label className="grid gap-2 text-sm font-semibold text-coffee">
              E-mailtekst
              <span className="text-xs font-normal leading-5 text-coffee/55">Pas alleen de inhoud van deze mail aan. De vaste huisstijl en afsluiting worden automatisch toegevoegd.</span>
              <textarea rows={13} value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} className="resize-y rounded-lg border border-cocoa/20 bg-cream px-3 py-2.5 text-sm leading-6 outline-none focus:border-cocoa" />
            </label>
          </div>

          <div>
            <p className="fine-label text-cocoa">Voorbeeld voor deze klant</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-[#e7d8ca] bg-[#fffaf4] shadow-soft">
              <div className="bg-[#eadbce] px-6 py-5">
                <p className="font-serif text-2xl text-[#4e3b2f]">Cuddling Memories</p>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.22em] text-[#9a7359]">Fotografie</p>
              </div>
              <div className="px-6 py-6">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#9a7359]">Onderwerp</p>
                <h3 className="mt-2 font-serif text-2xl leading-tight text-[#3f2c22]">{renderedSubject || "Nog geen onderwerp"}</h3>
                <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[#5f4b40]">{renderedBody || "Nog geen e-mailtekst"}</div>
                <p className="mt-6 border-t border-[#eadbce] pt-4 text-xs leading-5 text-[#8a6b55]">Liefs,<br />Cuddling Memories Fotografie</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-cocoa/15 bg-card px-5 py-4 sm:px-6">
          <AdminButton type="button" onClick={onSave} disabled={saving || !draft.subject.trim() || !draft.body.trim()}><Save size={15} />{saving ? "Opslaan..." : "Alleen deze mail opslaan"}</AdminButton>
          {row.override && <AdminButton type="button" variant="secondary" onClick={onReset} disabled={saving}><RotateCcw size={15} /> Standaardtekst herstellen</AdminButton>}
          <AdminButton type="button" variant="secondary" onClick={onClose} disabled={saving}>Sluiten</AdminButton>
        </div>
      </div>
    </div>
  );
}

function mergeTemplates(databaseRows) {
  const byKey = new Map(databaseRows.map((row) => [row.template_key, row]));
  const builtIn = emailTemplateDefaults.map((fallback) => ({ ...fallback, is_active: true, ...(byKey.get(fallback.template_key) || {}) }));
  const builtInKeys = new Set(emailTemplateDefaults.map((row) => row.template_key));
  return [...builtIn, ...databaseRows.filter((row) => !builtInKeys.has(row.template_key))].sort((a, b) => a.label.localeCompare(b.label, "nl"));
}

function Summary({ icon: Icon, label, value, text, danger }) {
  return <div className={`rounded-lg border p-5 shadow-soft ${danger ? "border-red-200 bg-red-50" : "border-cocoa/15 bg-card"}`}><Icon size={20} className={danger ? "text-red-700" : "text-cocoa"} /><p className="mt-4 fine-label text-cocoa">{label}</p><p className="mt-1 text-3xl font-semibold text-coffee">{value}</p><p className="mt-2 text-xs leading-5 text-coffee/55">{text}</p></div>;
}

function StatusBadge({ status }) {
  if (status === "disabled") return <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Template uit</span>;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"><CheckCircle2 size={13} /> Gepland</span>;
}

function HistoryFilter({ active, onClick, children }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`whitespace-nowrap rounded-md px-4 py-2 text-xs font-semibold transition ${active ? "bg-cocoa text-card shadow-sm" : "text-coffee/65 hover:bg-linen"}`}>{children}</button>;
}

function AudienceBadge({ admin }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${admin ? "bg-stone-100 text-stone-700" : "bg-emerald-50 text-emerald-800"}`}>{admin ? "Admin" : "Klant"}</span>;
}

function isAdminTemplate(templateKey) {
  return String(templateKey || "").startsWith("admin_");
}

function Rule({ title, text }) { return <div className="rounded-lg bg-linen p-4 warm-border"><p className="font-semibold text-coffee">{title}</p><p className="mt-2 text-xs leading-5 text-coffee/60">{text}</p></div>; }
function templateLabel(templates, key) { return templates.find((template) => template.template_key === key)?.label || key; }
function addDays(value, amount) { const date = new Date(`${String(value).slice(0, 10)}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0, 10); }
function dateKey(value) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value); const get = (type) => parts.find((part) => part.type === type)?.value || ""; return `${get("year")}-${get("month")}-${get("day")}`; }
function formatEuro(value) { return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value || 0)); }
