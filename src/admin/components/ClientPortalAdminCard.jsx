import { Copy, ExternalLink, FilePlus2, Mail, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { DEFAULT_CONTRACT_TEXT } from "../../data/legalTerms.js";
import { formatDate } from "../../lib/formatDate.js";
import AdminButton from "./AdminButton.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function ClientPortalAdminCard({ booking, onReload }) {
  const [settings, setSettings] = useState({ portal_enabled: booking.portal_enabled !== false, questionnaire_locked: Boolean(booking.questionnaire_locked), contract_title: booking.contract_title || "Overeenkomst fotoshoot", contract_version: booking.contract_version || "2026-07-11-v1", contract_text: booking.contract_text || booking.cancellation_terms || DEFAULT_CONTRACT_TEXT });
  const [invoices, setInvoices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invoice, setInvoice] = useState({ title: booking.packages?.title || booking.shoot_type, description: "Fotoshoot volgens afspraak", total_amount: booking.packages?.price || booking.deposit_amount || "", due_at: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const portalUrl = useMemo(() => booking.portal_token ? `${window.location.origin}/klantportaal/${booking.portal_token}` : "", [booking.portal_token]);

  const loadRelated = async () => {
    const [{ data: invoiceRows }, { data: requestRows }] = await Promise.all([
      supabase.from("invoices").select("*").eq("booking_id", booking.id).order("issued_at", { ascending: false }),
      supabase.from("booking_change_requests").select("*").eq("booking_id", booking.id).order("created_at", { ascending: false }),
    ]);
    setInvoices(invoiceRows || []); setRequests(requestRows || []);
  };
  useEffect(() => { loadRelated(); }, [booking.id]);

  const saveSettings = async () => {
    setSaving(true); setMessage("");
    const { error } = await supabase.from("bookings").update(settings).eq("id", booking.id);
    setSaving(false); setMessage(error ? error.message : "Klantportaalinstellingen opgeslagen.");
    if (!error) onReload?.();
  };

  const createInvoice = async () => {
    const total = Number(invoice.total_amount || 0); if (total <= 0) { setMessage("Vul een geldig factuurbedrag in."); return; }
    setSaving(true); setMessage("");
    const number = `CM-${new Date().getFullYear()}-${Date.now().toString().slice(-7)}`;
    const { error } = await supabase.from("invoices").insert({ booking_id: booking.id, invoice_number: number, title: invoice.title, description: invoice.description || null, amount_excl: total, vat_rate: 0, vat_amount: 0, total_amount: total, due_at: invoice.due_at || null, status: "Verzonden" });
    const paidDeposit = booking.deposit_status === "Betaald" ? Math.min(Number(booking.deposit_amount || 0), total) : 0;
    const remainingAmount = Math.max(0, total - paidDeposit);
    setSaving(false); setMessage(error ? error.message : `Factuur ${number} aangemaakt.`); if (!error) { await sendCustomerTemplate("invoice_ready", { invoice_number: number, invoice_amount: `EUR ${remainingAmount.toFixed(2)}` }); loadRelated(); }
  };

  const updateInvoiceStatus = async (invoiceId, status) => {
    setSaving(true); setMessage("");
    const { error } = await supabase.from("invoices").update({ status, paid_at: status === "Betaald" ? new Date().toISOString() : null }).eq("id", invoiceId);
    setSaving(false);
    setMessage(error ? error.message : status === "Betaald" ? "Volledige betaling geregistreerd. Een geblokkeerde galerij is nu beschikbaar." : "Factuurstatus bijgewerkt.");
    if (!error) loadRelated();
  };

  const deleteInvoice = async () => {
    if (!invoiceToDelete) return;
    setSaving(true); setMessage("");
    const { error: deleteError } = await supabase.from("invoices").delete().eq("id", invoiceToDelete.id).eq("booking_id", booking.id);
    let bookingError = null;
    if (!deleteError) {
      const result = await supabase.from("bookings").update({ auto_invoice_disabled: true }).eq("id", booking.id);
      bookingError = result.error;
    }
    setSaving(false);
    if (deleteError || bookingError) {
      setMessage(deleteError?.message || bookingError?.message || "Factuur verwijderen is niet gelukt.");
      return;
    }
    setMessage(`Factuur ${invoiceToDelete.invoice_number} is verwijderd en verdwijnt uit het klantportaal.`);
    setInvoiceToDelete(null);
    await loadRelated();
    onReload?.();
  };

  const sendPortalMail = async () => {
    setSaving(true); setMessage("");
    const response = await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient_email: booking.customer_email, template_key: "client_portal_ready", related_booking_id: booking.id, variables: { customer_name: booking.customer_name, shoot_type: booking.shoot_type, portal_link: portalUrl } }) });
    const body = await response.json().catch(() => ({})); setSaving(false); setMessage(response.ok ? "Klantportaalmail verstuurd." : body.message || "Mail versturen is niet gelukt.");
  };

  const sendCustomerTemplate = async (templateKey, variables = {}) => {
    try {
      await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipient_email: booking.customer_email, template_key: templateKey, related_booking_id: booking.id, variables: { customer_name: booking.customer_name, shoot_type: booking.shoot_type, portal_link: portalUrl, ...variables } }) });
    } catch (error) {
      console.error(`Mail ${templateKey} versturen is mislukt:`, error);
    }
  };

  const updateRequest = async (id, status) => {
    const request = requests.find((row) => row.id === id);
    const { error } = await supabase.from("booking_change_requests").update({ status }).eq("id", id);
    if (!error && request) {
      const statusMessage = status === "Goedgekeurd"
        ? "Je verzoek is goedgekeurd. Controleer je actuele afspraak in het klantportaal."
        : status === "Afgewezen"
          ? "Je verzoek kon helaas niet worden goedgekeurd. Neem gerust contact op om andere mogelijkheden te bespreken."
          : "Ik heb je verzoek bijgewerkt en neem contact op als er aanvullende informatie nodig is.";
      await sendCustomerTemplate("reschedule_status", { preferred_date: formatDate(request.preferred_date), request_status: status, status_message: statusMessage });
    }
    loadRelated();
  };

  return <div className="rounded-lg bg-card p-6 shadow-soft warm-border"><h2 className="display-title text-xl font-semibold text-coffee">Klantportaal</h2><p className="mt-1 text-xs leading-5 text-coffee/60">Beheer hier de beveiligde klantlink, overeenkomst, voorbereiding, betaalwijze, facturen en wijzigingsverzoeken.</p>
    {portalUrl && <div className="mt-4 rounded-lg bg-linen p-4 text-sm"><p className="break-all text-coffee/70">{portalUrl}</p><div className="mt-3 flex flex-wrap gap-2"><AdminButton type="button" variant="secondary" onClick={()=>navigator.clipboard.writeText(portalUrl)}><Copy size={14}/> Kopieer</AdminButton><AdminButton href={portalUrl} target="_blank" rel="noreferrer" variant="secondary"><ExternalLink size={14}/> Open</AdminButton><AdminButton type="button" onClick={sendPortalMail} disabled={saving}><Mail size={14}/> Mail klant</AdminButton></div></div>}
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><Toggle label="Portaal actief" help="Schakel uit om de klantlink direct te blokkeren." checked={settings.portal_enabled} onChange={(value)=>setSettings({...settings,portal_enabled:value})}/><Toggle label="Vragenlijst vergrendeld" help="Na vergrendelen kan de klant antwoorden alleen nog bekijken." checked={settings.questionnaire_locked} onChange={(value)=>setSettings({...settings,questionnaire_locked:value})}/><Field label="Titel overeenkomst" help="Kop boven de overeenkomst in het portaal." value={settings.contract_title} onChange={(value)=>setSettings({...settings,contract_title:value})}/><Field label="Versie overeenkomst" help="Wordt samen met de ondertekening bewaard." value={settings.contract_version} onChange={(value)=>setSettings({...settings,contract_version:value})}/><label className="grid gap-2 text-sm font-semibold text-coffee sm:col-span-2">Tekst overeenkomst<span className="text-xs font-normal text-coffee/55">De klant leest en ondertekent precies deze tekst.</span><textarea rows={8} value={settings.contract_text} onChange={(e)=>setSettings({...settings,contract_text:e.target.value})} className="resize-y rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm font-normal"/></label></div><AdminButton type="button" onClick={saveSettings} disabled={saving} className="mt-4"><Save size={14}/> Opslaan</AdminButton>
    <div className="mt-6 border-t border-cocoa/15 pt-5"><h3 className="font-semibold text-coffee">Factuur aanmaken</h3><p className="mt-1 text-xs text-coffee/55">De klant kan de factuur daarna direct als PDF downloaden. Het ingevulde bedrag wordt rechtstreeks als totaalbedrag gebruikt.</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Omschrijving" value={invoice.title} onChange={(value)=>setInvoice({...invoice,title:value})}/><Field type="number" label="Totaalbedrag" value={invoice.total_amount} onChange={(value)=>setInvoice({...invoice,total_amount:value})}/><Field type="date" label="Vervaldatum" value={invoice.due_at} onChange={(value)=>setInvoice({...invoice,due_at:value})}/><Field wide label="Toelichting" value={invoice.description} onChange={(value)=>setInvoice({...invoice,description:value})}/></div><AdminButton type="button" onClick={createInvoice} disabled={saving} className="mt-3"><FilePlus2 size={14}/> Factuur maken</AdminButton>{invoices.map((row)=><div key={row.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-linen px-3 py-3 text-sm text-coffee/70"><span>{row.invoice_number} · EUR {Number(row.total_amount).toFixed(2)}</span><div className="flex items-center gap-2"><select value={row.status} onChange={(event)=>updateInvoiceStatus(row.id,event.target.value)} disabled={saving} className="rounded-lg border border-cocoa/20 bg-card px-3 py-2 text-xs text-coffee">{["Concept","Verzonden","Betaald","Vervallen","Gecrediteerd"].map((status)=><option key={status}>{status}</option>)}</select><button type="button" title={`Factuur ${row.invoice_number} verwijderen`} onClick={()=>setInvoiceToDelete(row)} disabled={saving} className="grid h-9 w-9 place-items-center rounded-full border border-red-200 bg-card text-red-600 transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={15}/></button></div></div>)}</div>
    {requests.length>0&&<div className="mt-6 border-t border-cocoa/15 pt-5"><h3 className="font-semibold text-coffee">Verplaatsingsverzoeken</h3>{requests.map((row)=><div key={row.id} className="mt-3 rounded-lg bg-linen p-3 text-sm"><p className="font-semibold text-coffee">{formatDate(row.preferred_date)} · {row.preferred_period||"Geen voorkeur"}</p><p className="mt-1 text-coffee/60">{row.reason||"Geen toelichting"}</p><select value={row.status} onChange={(e)=>updateRequest(row.id,e.target.value)} className="mt-2 rounded-lg border border-cocoa/20 bg-card px-3 py-2 text-xs">{["Nieuw","In behandeling","Goedgekeurd","Afgewezen","Afgerond"].map((status)=><option key={status}>{status}</option>)}</select></div>)}</div>}
    {message&&<p className="mt-4 rounded-lg bg-linen px-4 py-3 text-sm text-coffee">{message}</p>}
    <ConfirmDialog open={Boolean(invoiceToDelete)} title="Factuur verwijderen?" description={invoiceToDelete ? `Factuur ${invoiceToDelete.invoice_number} wordt definitief verwijderd en is daarna niet meer zichtbaar in het klantportaal.` : ""} confirmLabel={saving ? "Verwijderen..." : "Factuur verwijderen"} onConfirm={deleteInvoice} onCancel={()=>{ if (!saving) setInvoiceToDelete(null); }}/>
  </div>;
}

function Field({label,help,value,onChange,type="text",wide}) { return <label className={`grid gap-2 text-sm font-semibold text-coffee ${wide?"sm:col-span-2":""}`}>{label}{help&&<span className="text-xs font-normal text-coffee/55">{help}</span>}<input type={type} step={type==="number"?"0.01":undefined} value={value||""} onChange={(e)=>onChange(e.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm font-normal"/></label>; }
function Toggle({label,help,checked,onChange}) { return <label className="flex gap-3 rounded-lg border border-cocoa/15 bg-cream p-3 text-sm text-coffee"><input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} className="mt-1 h-4 w-4 accent-cocoa"/><span><strong>{label}</strong><small className="mt-1 block leading-5 text-coffee/55">{help}</small></span></label>; }
