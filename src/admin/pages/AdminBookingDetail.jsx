import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Archive, CalendarCheck, Mail, Pencil, RefreshCw, Save, Star, Trash2, XCircle } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useAdminAuth } from "../hooks/useAdminAuth.js";
import {
  addBookingNote,
  deleteBooking,
  getBookingDetail,
  toggleBookingImportant,
  updateBookingStatus,
} from "../hooks/useBookings.js";
import { bookingStatuses, shootTypeOptions } from "../utils/bookingStatuses.js";
import { formatDate, formatDateTime } from "../../lib/formatDate.js";
import BookingWeatherCard from "../components/BookingWeatherCard.jsx";
import BookingTasksCard from "../components/BookingTasksCard.jsx";
import ClientPortalAdminCard from "../components/ClientPortalAdminCard.jsx";

const depositStatuses = ["Niet gevraagd", "Gevraagd", "Betaald", "Terugbetaald", "Vervallen"];
const questionnaireLabels = {
  children: "Namen en leeftijden kinderen",
  participants: "Wie komen op de foto",
  allergies: "Allergieën of voedingswensen",
  specialDetails: "Bijzonderheden",
  photographerNotes: "Verder vooraf weten",
};

export default function AdminBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [notes, setNotes] = useState([]);
  const [history, setHistory] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [giftcard, setGiftcard] = useState(null);
  const [showResendMail, setShowResendMail] = useState(false);
  const [resendTemplate, setResendTemplate] = useState("booking_received");
  const [resendMessage, setResendMessage] = useState("");
  const [actualShootDate, setActualShootDate] = useState("");
  const [packages, setPackages] = useState([]);
  const [editMessage, setEditMessage] = useState("");
  const [editValues, setEditValues] = useState({ shoot_type: "", package_id: "", booking_date: "", start_time: "", end_time: "", location: "", model_discount: false });

  const load = useCallback(async () => {
    setLoading(true);
    const [result, packageResult] = await Promise.all([
      getBookingDetail(id),
      supabase.from("packages").select("id,title,price,shoot_type,price_unit,is_addon,is_published,model_discount_eligible,deposit_type,deposit_value").eq("price_unit", "shoot").eq("is_addon", false).order("sort_order", { ascending: true }),
    ]);
    setBooking(result.booking);
    setNotes(result.notes);
    setHistory(result.history);
    setAdminNotes(result.booking?.admin_notes || "");
    setActualShootDate(result.booking?.actual_shoot_date || "");
    setGiftcard(result.giftcard);
    setPackages(packageResult.data || []);
    setEditValues({
      shoot_type: result.booking?.shoot_type || "",
      package_id: result.booking?.package_id || "",
      booking_date: result.booking?.booking_date || "",
      start_time: String(result.booking?.start_time || "").slice(0, 5),
      end_time: String(result.booking?.end_time || "").slice(0, 5),
      location: result.booking?.location || "",
      model_discount: Boolean(result.booking?.model_discount),
    });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveActualShootDate = async (dateValue, sendInvoiceMail = true) => {
    if (!dateValue) return;
    setSaving(true);
    const { data: existingInvoice } = await supabase.from("invoices").select("id").eq("booking_id", booking.id).limit(1).maybeSingle();
    const { error } = await supabase.from("bookings").update({ actual_shoot_date: dateValue }).eq("id", booking.id);
    if (!error && booking.portal_token) {
      await fetch(`/api/client-portal?token=${encodeURIComponent(booking.portal_token)}`).catch(() => null);
      if (!existingInvoice && sendInvoiceMail) {
        const { data: createdInvoice } = await supabase.from("invoices").select("invoice_number,total_amount").eq("booking_id", booking.id).order("issued_at", { ascending: false }).limit(1).maybeSingle();
        if (createdInvoice) {
          const paidDeposit = booking.deposit_status === "Betaald" ? Math.min(Number(booking.deposit_amount || 0), Number(createdInvoice.total_amount || 0)) : 0;
          await sendBookingTemplate(booking, "invoice_ready", false, {
            invoice_number: createdInvoice.invoice_number,
            invoice_amount: `EUR ${Math.max(0, Number(createdInvoice.total_amount || 0) - paidDeposit).toFixed(2)}`,
          });
        }
      }
    }
    await load();
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-sm text-coffee/70">Laden...</p>
      </AdminLayout>
    );
  }

  if (!booking) {
    return (
      <AdminLayout>
        <p className="text-sm text-coffee/70">Boeking niet gevonden.</p>
        <AdminButton variant="secondary" className="mt-4" onClick={() => navigate("/admin/bookings")}>
          <ArrowLeft size={14} /> Terug naar boekingen
        </AdminButton>
      </AdminLayout>
    );
  }

  const handleStatusChange = async (event) => {
    const nextStatus = event.target.value;
    setSaving(true);
    await updateBookingStatus(booking.id, nextStatus, user?.email);
    if (nextStatus === "Datum ingepland" && booking.status !== "Datum ingepland" && !booking.confirmed_at) {
      await supabase.from("bookings").update({ confirmed_at: new Date().toISOString() }).eq("id", booking.id);
      await sendBookingConfirmedMail(booking);
    } else if (nextStatus === "Geannuleerd" && booking.status !== "Geannuleerd") {
      await supabase.from("bookings").update({ cancelled_at: new Date().toISOString() }).eq("id", booking.id);
      await sendBookingTemplate(booking, "booking_cancelled");
    } else if (nextStatus === "Shoot geweest" && !booking.actual_shoot_date) {
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      setActualShootDate(today);
      await saveActualShootDate(today);
    }
    await load();
    setSaving(false);
  };

  const handleAddNote = async (event) => {
    event.preventDefault();
    if (!noteText.trim()) return;
    setSaving(true);
    await addBookingNote(booking.id, noteText.trim(), user?.email);
    setNoteText("");
    await load();
    setSaving(false);
  };

  const handleToggleImportant = async () => {
    setSaving(true);
    await toggleBookingImportant(booking.id, !booking.is_important);
    await load();
    setSaving(false);
  };

  const handleArchive = async () => {
    setSaving(true);
    await updateBookingStatus(booking.id, "Gearchiveerd", user?.email);
    await load();
    setSaving(false);
  };

  const handleConfirm = async () => {
    if (booking.confirmed_at) return;
    setSaving(true);
    if (booking.status !== "Datum ingepland") {
      await updateBookingStatus(booking.id, "Datum ingepland", user?.email);
    }
    await supabase.from("bookings").update({ confirmed_at: new Date().toISOString() }).eq("id", booking.id);
    await sendBookingConfirmedMail(booking);
    await load();
    setSaving(false);
  };

  const handleCancel = async () => {
    setSaving(true);
    await updateBookingStatus(booking.id, "Geannuleerd", user?.email);
    await supabase.from("bookings").update({ cancelled_at: new Date().toISOString() }).eq("id", booking.id);
    await sendBookingTemplate(booking, "booking_cancelled");
    await load();
    setSaving(false);
  };

  const handleSaveAdminNotes = async () => {
    setSaving(true);
    await supabase.from("bookings").update({ admin_notes: adminNotes }).eq("id", booking.id);
    setSaving(false);
  };

  const handleSaveBookingDetails = async () => {
    if (!editValues.shoot_type || !editValues.booking_date || !editValues.start_time || !editValues.end_time || !editValues.location) {
      setEditMessage("Vul shoot, datum, begin- en eindtijd en locatie in.");
      return;
    }
    setSaving(true);
    setEditMessage("");
    const selectedPackage = packages.find((item) => item.id === editValues.package_id) || null;
    const addonTotal = (booking.booking_addons || []).reduce((sum, addon) => sum + Number(addon.price_snapshot || 0), 0);
    const packagePrice = selectedPackage ? Number(selectedPackage.price || 0) * (editValues.model_discount ? 0.5 : 1) : 0;
    const budget = Math.round((packagePrice + addonTotal + Number.EPSILON) * 100) / 100;
    const firstUpdate = await supabase.from("bookings").update({
      shoot_type: editValues.shoot_type,
      package_id: editValues.package_id || null,
      booking_date: editValues.booking_date,
      start_time: editValues.start_time,
      end_time: editValues.end_time,
      location: editValues.location.trim(),
      model_discount: Boolean(editValues.model_discount),
      auto_invoice_disabled: false,
    }).eq("id", booking.id);
    if (firstUpdate.error) {
      setEditMessage(firstUpdate.error.message);
      setSaving(false);
      return;
    }

    let depositAmount = null;
    if (selectedPackage?.deposit_type === "percentage") depositAmount = Math.round(budget * Number(selectedPackage.deposit_value || 0)) / 100;
    if (selectedPackage?.deposit_type === "fixed") depositAmount = Math.min(Number(selectedPackage.deposit_value || 0), budget);
    const secondUpdate = await supabase.from("bookings").update({ budget, deposit_amount: depositAmount }).eq("id", booking.id);
    if (secondUpdate.error) {
      setEditMessage(secondUpdate.error.message);
      setSaving(false);
      return;
    }

    const invoiceTotal = Math.max(0, budget - Number(giftcard?.amount || 0));
    const invoiceNotes = JSON.stringify({
      automatic: true,
      package_title: selectedPackage?.title || editValues.shoot_type,
      package_price: packagePrice,
      addons: (booking.booking_addons || []).map((addon) => ({ title: addon.title_snapshot, price: Number(addon.price_snapshot || 0) })),
      addon_total: addonTotal,
      giftcard_code: giftcard?.code || null,
      giftcard_amount: Number(giftcard?.amount || 0),
    });
    const { error: invoiceError } = await supabase.from("invoices").update({
      title: selectedPackage?.title || editValues.shoot_type,
      amount_excl: invoiceTotal,
      vat_rate: 0,
      vat_amount: 0,
      total_amount: invoiceTotal,
      notes: invoiceNotes,
    }).eq("booking_id", booking.id).neq("status", "Betaald");
    if (invoiceError) {
      setEditMessage(`Boeking opgeslagen, maar de openstaande factuur kon niet worden bijgewerkt: ${invoiceError.message}`);
    } else {
      setEditMessage("De shoot, het hoofdpakket en de bijbehorende bedragen zijn bijgewerkt.");
    }
    if (booking.portal_token) await fetch(`/api/client-portal?token=${encodeURIComponent(booking.portal_token)}`).catch(() => null);
    await load();
    setSaving(false);
  };

  const handleDepositStatusChange = async (event) => {
    const nextStatus = event.target.value;
    if (nextStatus === "Terugbetaald") {
      setConfirmRefund(true);
      return;
    }
    await updateDepositStatus(nextStatus);
  };

  const updateDepositStatus = async (nextStatus) => {
    setSaving(true);
    const { data: existingInvoice } = nextStatus === "Betaald"
      ? await supabase.from("invoices").select("id").eq("booking_id", booking.id).limit(1).maybeSingle()
      : { data: null };
    const { error } = await supabase.from("bookings").update({ deposit_status: nextStatus }).eq("id", booking.id);
    if (!error) {
      const templates = {
        Gevraagd: "deposit_requested",
        Betaald: "deposit_received",
        Terugbetaald: "deposit_refunded",
        Vervallen: "deposit_expired",
      };
      if (templates[nextStatus] && booking.deposit_status !== nextStatus) {
        await sendBookingTemplate(booking, templates[nextStatus]);
      }
      if (nextStatus === "Betaald" && !existingInvoice && booking.portal_token) {
        await fetch(`/api/client-portal?token=${encodeURIComponent(booking.portal_token)}`).catch(() => null);
        const { data: createdInvoice } = await supabase
          .from("invoices")
          .select("invoice_number,total_amount")
          .eq("booking_id", booking.id)
          .order("issued_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (createdInvoice) {
          const receivedDeposit = Math.min(Number(booking.deposit_amount || 0), Number(createdInvoice.total_amount || 0));
          await sendBookingTemplate({ ...booking, deposit_status: "Betaald" }, "invoice_ready", false, {
            invoice_number: createdInvoice.invoice_number,
            invoice_amount: `EUR ${Math.max(0, Number(createdInvoice.total_amount || 0) - receivedDeposit).toFixed(2)}`,
          });
        }
      }
      await load();
    }
    setSaving(false);
  };

  const handleResendMail = async () => {
    setSaving(true);
    setResendMessage("");
    let extraVariables = {};
    if (resendTemplate === "invoice_ready") {
      const { data: invoice } = await supabase
        .from("invoices")
        .select("invoice_number,total_amount")
        .eq("booking_id", booking.id)
        .order("issued_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!invoice) {
        setResendMessage("Er is nog geen factuur voor deze boeking.");
        setSaving(false);
        return;
      }
      const paidDeposit = booking.deposit_status === "Betaald" ? Math.min(Number(booking.deposit_amount || 0), Number(invoice.total_amount || 0)) : 0;
      const remainingAmount = Math.max(0, Number(invoice.total_amount || 0) - paidDeposit);
      extraVariables = { invoice_number: invoice.invoice_number, invoice_amount: `EUR ${remainingAmount.toFixed(2)}` };
    }
    const result = await sendBookingTemplate(booking, resendTemplate, true, extraVariables);
    setResendMessage(result ? "De mail is opnieuw verstuurd en staat in het e-maillogboek." : "De mail kon niet worden verstuurd. Controleer het e-maillogboek voor de foutmelding.");
    setSaving(false);
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

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-title text-3xl font-semibold text-coffee">{booking.customer_name}</h1>
          <p className="mt-1 text-sm text-coffee/70">
            Aangevraagd op {formatDateTime(booking.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <p className="basis-full text-xs leading-5 text-coffee/55">
            Deze acties passen de status of interne markering van de boeking aan. De bevestigingsmail wordt alleen bij de eerste bevestiging verstuurd.
          </p>
          <AdminButton variant="secondary" onClick={handleConfirm} disabled={saving || Boolean(booking.confirmed_at)}>
            <CalendarCheck size={14} /> {booking.confirmed_at ? "Al bevestigd" : "Bevestigen"}
          </AdminButton>
          <AdminButton variant="secondary" onClick={handleCancel} disabled={saving}>
            <XCircle size={14} /> Annuleren
          </AdminButton>
          <AdminButton variant="secondary" onClick={handleToggleImportant} disabled={saving}>
            <Star size={14} className={booking.is_important ? "fill-cocoa" : ""} />
            {booking.is_important ? "Belangrijk" : "Markeer belangrijk"}
          </AdminButton>
          <AdminButton variant="secondary" href={`mailto:${booking.customer_email}`}>
            <Mail size={14} /> Mail klant
          </AdminButton>
          <AdminButton variant="secondary" type="button" onClick={() => setShowResendMail((current) => !current)}>
            <RefreshCw size={14} /> Mail opnieuw sturen
          </AdminButton>
          <AdminButton variant="secondary" onClick={handleArchive} disabled={saving}>
            <Archive size={14} /> Archiveer
          </AdminButton>
          <AdminButton variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} /> Verwijder
          </AdminButton>
        </div>
      </div>

      {showResendMail && (
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg bg-linen p-4 warm-border">
          <label className="grid min-w-[16rem] flex-1 gap-2 text-xs font-semibold text-coffee">
            Welke mail wil je opnieuw sturen?
            <span className="text-xs font-normal leading-5 text-coffee/55">De mail wordt direct naar {booking.customer_email} gestuurd.</span>
            <select value={resendTemplate} onChange={(event) => { setResendTemplate(event.target.value); setResendMessage(""); }} className="rounded-lg border border-cocoa/20 bg-card px-3 py-2.5 text-sm outline-none focus:border-cocoa">
              <option value="booking_received">Aanvraag ontvangen</option>
              <option value="booking_confirmed">Boeking bevestigd</option>
              <option value="client_portal_ready">Klantportaallink</option>
              {Number(booking.deposit_amount || 0) > 0 && <option value="deposit_requested">Aanbetaling gevraagd</option>}
              <option value="invoice_ready">Factuur beschikbaar</option>
              <option value="booking_cancelled">Boeking geannuleerd</option>
            </select>
          </label>
          <AdminButton type="button" onClick={handleResendMail} disabled={saving}>
            <Mail size={14} /> {saving ? "Versturen..." : "Nu opnieuw sturen"}
          </AdminButton>
          {resendMessage && <p className="basis-full rounded-lg bg-card px-4 py-3 text-sm text-coffee/75 warm-border">{resendMessage}</p>}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-6">
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Aanvraag</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Field label="E-mail" value={booking.customer_email} />
              <Field label="Gewenste shoot" value={booking.shoot_type} />
              <Field
                label="Datum shoot"
                value={booking.booking_date ? `${formatDate(booking.booking_date)} · ${booking.start_time?.slice(0, 5)}-${booking.end_time?.slice(0, 5)}` : "Nog niet ingepland"}
              />
              <Field label="Duur / buffer" value={booking.duration_minutes ? `${booking.duration_minutes} min (buffer ${booking.buffer_before_minutes}/${booking.buffer_after_minutes} min)` : "-"} />
              <Field label="Locatie" value={booking.location || "-"} />
              <Field label="Gekozen pakket" value={booking.packages?.title || "Geen voorkeur"} />
              <Field label="Add-ons" value={booking.booking_addons?.length ? booking.booking_addons.map((addon) => `${addon.title_snapshot} (EUR ${Number(addon.price_snapshot).toFixed(2)})`).join(", ") : "Geen"} />
              <Field label="Modelkorting" value={booking.model_discount ? "Ja" : "Nee"} />
              <Field label="Toestemming modelfoto's" value={booking.model_usage_consent ? "Ja, social media en portfolio" : "Nee / niet van toepassing"} />
              <Field label="Toestemming gegeven op" value={booking.model_usage_consent_at ? formatDateTime(booking.model_usage_consent_at) : "-"} />
              <Field label="Toestemmingsversie" value={booking.model_usage_consent_version || "-"} />
              <Field label="Bron" value={booking.source} />
              <Field label="Privacy geaccepteerd" value={booking.privacy_accepted ? "Ja" : "Nee"} />
              <Field label="Bevestigd op" value={booking.confirmed_at ? formatDateTime(booking.confirmed_at) : "-"} />
              <Field label="Geannuleerd op" value={booking.cancelled_at ? formatDateTime(booking.cancelled_at) : "-"} />
              <Field label="Laatste wijziging" value={formatDateTime(booking.updated_at)} />
              <Field label="Voorwaardenversie" value={booking.terms_version || "Niet vastgelegd"} />
              <Field label="Voorwaarden geaccepteerd" value={booking.terms_accepted_at ? formatDateTime(booking.terms_accepted_at) : "Nee"} />
              <Field label="Geaccepteerd door" value={booking.terms_accepted_by || "-"} />
            </dl>
            {giftcard && (
              <p className="mt-4 rounded-lg bg-linen/70 px-4 py-3 text-sm text-coffee">
                <span className="fine-label text-[0.6rem] text-cocoa">Cadeaubon verzilverd</span>
                <br />
                Code <strong>{giftcard.code}</strong> ({giftcard.giftcard_type}
                {giftcard.amount ? `, €${Number(giftcard.amount).toFixed(2)}` : ""})
              </p>
            )}
            <div className="mt-4">
              <p className="fine-label text-[0.62rem] text-cocoa">Bericht</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-7 text-coffee/85">{booking.message}</p>
            </div>
            {booking.questionnaire_answers && Object.values(booking.questionnaire_answers).some(Boolean) && (
              <div className="mt-5 rounded-lg bg-linen/55 p-4">
                <p className="fine-label text-[0.62rem] text-cocoa">Vragenlijst vóór de shoot</p>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  {Object.entries(questionnaireLabels).map(([key, label]) => booking.questionnaire_answers[key] ? <Field key={key} label={label} value={booking.questionnaire_answers[key]} /> : null)}
                </dl>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linen text-cocoa"><Pencil size={17} /></span>
              <div>
                <h2 className="display-title text-xl font-semibold text-coffee">Boeking aanpassen</h2>
                <p className="mt-1 text-xs leading-5 text-coffee/60">Wijzig de shoot of koppel alsnog een hoofdpakket. Bij modelkorting wordt 50% van de normale pakketprijs gebruikt. Openstaande facturen en de aanbetaling worden opnieuw berekend.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-coffee">Soort shoot<span className="text-xs font-normal leading-5 text-coffee/55">Bepaalt om welk type fotosessie deze boeking gaat.</span><select value={editValues.shoot_type} onChange={(event)=>{ const shootType = event.target.value; const isModel = shootType.toLowerCase().includes("model") && shootType.toLowerCase().includes("korting"); setEditValues((current)=>({...current,shoot_type:shootType,package_id:"",model_discount:isModel})); }} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2.5 text-sm outline-none focus:border-cocoa">{[...new Set([...shootTypeOptions, ...packages.map((item)=>item.shoot_type).filter(Boolean), booking.shoot_type])].map((option)=><option key={option}>{option}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold text-coffee">Hoofdpakket<span className="text-xs font-normal leading-5 text-coffee/55">Koppel hier alsnog het pakket waarop prijs, aanbetaling en factuur worden gebaseerd.</span><select value={editValues.package_id} onChange={(event)=>setEditValues((current)=>({...current,package_id:event.target.value}))} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2.5 text-sm outline-none focus:border-cocoa"><option value="">Geen hoofdpakket</option>{packages.filter((item)=>{ if (!editValues.model_discount) return item.shoot_type === editValues.shoot_type || item.id === booking.package_id; const label = `${item.title || ""} ${item.shoot_type || ""}`.toLowerCase(); return !label.includes("bevalling") && (item.model_discount_eligible || item.id === booking.package_id); }).map((item)=><option key={item.id} value={item.id}>{item.title} · EUR {(Number(item.price || 0) * (editValues.model_discount ? 0.5 : 1)).toFixed(2)}{editValues.model_discount ? " (50% korting)" : ""}</option>)}</select></label>
              <EditBookingField label="Datum shoot" help="De geplande datum van de fotoshoot." type="date" value={editValues.booking_date} onChange={(value)=>setEditValues((current)=>({...current,booking_date:value}))}/>
              <div className="grid grid-cols-2 gap-3"><EditBookingField label="Begintijd" help="Start van de shoot." type="time" value={editValues.start_time} onChange={(value)=>setEditValues((current)=>({...current,start_time:value}))}/><EditBookingField label="Eindtijd" help="Einde van de shoot." type="time" value={editValues.end_time} onChange={(value)=>setEditValues((current)=>({...current,end_time:value}))}/></div>
              <EditBookingField label="Locatie" help="De locatie die klant en admin bij deze boeking zien." value={editValues.location} onChange={(value)=>setEditValues((current)=>({...current,location:value}))} wide/>
              <label className="flex gap-3 rounded-lg border border-cocoa/15 bg-linen/60 p-4 text-sm text-coffee sm:col-span-2"><input type="checkbox" checked={editValues.model_discount} onChange={(event)=>setEditValues((current)=>({...current,model_discount:event.target.checked,package_id:""}))} className="mt-1 h-4 w-4 accent-cocoa"/><span><strong>Modelkorting van 50% toepassen</strong><small className="mt-1 block leading-5 text-coffee/55">Halveert de prijs van het gekoppelde hoofdpakket. Bevalling kan niet als modelpakket worden gekozen.</small></span></label>
            </div>
            <AdminButton type="button" onClick={handleSaveBookingDetails} disabled={saving} className="mt-5"><Save size={14}/> {saving ? "Opslaan..." : "Wijzigingen opslaan"}</AdminButton>
            {editMessage && <p className="mt-4 rounded-lg bg-linen px-4 py-3 text-sm leading-6 text-coffee/75">{editMessage}</p>}
          </div>

          <BookingWeatherCard booking={booking} />

          <BookingTasksCard bookingId={booking.id} userEmail={user?.email} />

          <ClientPortalAdminCard booking={booking} onReload={load} />

          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Interne notitie</h2>
            <p className="mt-1 text-xs text-coffee/60">Een vastgepinde notitie voor jezelf. Deze tekst is niet zichtbaar voor de klant.</p>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={3}
              className="mt-3 w-full resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
            <AdminButton type="button" variant="secondary" onClick={handleSaveAdminNotes} disabled={saving} className="mt-3">
              Opslaan
            </AdminButton>
          </div>

          {booking.deposit_type && booking.deposit_type !== "none" && (
            <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
              <h2 className="display-title text-xl font-semibold text-coffee">Aanbetaling</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Field label="Bedrag" value={booking.deposit_amount != null ? `EUR ${Number(booking.deposit_amount).toFixed(2)}` : "-"} />
                <Field label="Uiterlijk betalen" value={booking.deposit_due_date ? formatDate(booking.deposit_due_date) : "Nog niet bepaald"} />
                <Field label="Regel" value={booking.deposit_type === "percentage" ? `${Number(booking.deposit_value || 0)}% van pakketprijs` : "Vast bedrag"} />
                <Field label="Betaalmoment" value={booking.deposit_due_mode === "booking" ? "Direct bij boeken" : "Voor de shoot"} />
                <Field label="Moment restbedrag" value={booking.full_payment_due_mode === "after_shoot" ? "Na de werkelijke shootdatum" : booking.full_payment_due_mode === "booking" ? "Direct bij boeken" : "Voor de shoot"} />
                <Field label="Het volledige bedrag uiterlijk" value={booking.full_payment_due_date ? formatDate(booking.full_payment_due_date) : "Nog niet bepaald"} />
                <Field label="Betaald op" value={booking.deposit_paid_at ? formatDateTime(booking.deposit_paid_at) : "-"} />
              </dl>
              {booking.full_payment_due_mode === "after_shoot" && (
                <div className="mt-4 rounded-lg bg-linen/65 p-4">
                  <label className="grid gap-2 text-xs font-semibold text-coffee">
                    Werkelijke shootdatum
                    <span className="font-normal leading-5 text-coffee/55">De uitgerekende datum blijft alleen voor de planning. Na opslaan wordt de eindfactuur gemaakt en begint de ingestelde betaaltermijn.</span>
                    <input type="date" value={actualShootDate} onChange={(event) => setActualShootDate(event.target.value)} className="rounded-lg border border-cocoa/20 bg-card px-3 py-2 text-sm" />
                  </label>
                  <AdminButton type="button" variant="secondary" onClick={() => saveActualShootDate(actualShootDate)} disabled={saving || !actualShootDate} className="mt-3">
                    Werkelijke datum opslaan
                  </AdminButton>
                </div>
              )}
              <label className="mt-4 grid gap-2 text-xs font-semibold text-coffee">
                Betaalstatus
                <select value={booking.deposit_status || "Niet gevraagd"} onChange={handleDepositStatusChange} disabled={saving} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa">
                  {depositStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              {booking.cancellation_terms && (
                <div className="mt-4 rounded-lg bg-linen/65 p-4">
                  <p className="fine-label text-[0.6rem] text-cocoa">Annuleringsvoorwaarden</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-coffee/75">{booking.cancellation_terms}</p>
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Notities</h2>
            <p className="mt-1 text-xs text-coffee/60">Losse interne tijdlijnnotities. Handig voor belafspraken, bijzonderheden of opvolging.</p>
            <form onSubmit={handleAddNote} className="mt-3 grid gap-2">
              <textarea
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                rows={3}
                placeholder="Interne notitie toevoegen..."
                className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
              <AdminButton type="submit" className="justify-self-start" disabled={saving || !noteText.trim()}>
                Notitie toevoegen
              </AdminButton>
            </form>
            <div className="mt-4 grid gap-3">
              {notes.length === 0 && <p className="text-sm text-coffee/60">Nog geen notities.</p>}
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg bg-linen/60 p-3 text-sm">
                  <p className="text-coffee/85">{note.note}</p>
                  <p className="mt-1 text-xs text-coffee/50">
                    {note.created_by || "Onbekend"} · {formatDateTime(note.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Status</h2>
            <p className="mt-1 text-xs leading-5 text-coffee/60">
              De status helpt jou bij opvolging. Bevestigen en annuleren vullen ook de bevestigings- of annuleringsdatum.
            </p>
            <select
              value={booking.status}
              onChange={handleStatusChange}
              disabled={saving}
              className="mt-3 w-full rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            >
              {bookingStatuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Statusgeschiedenis</h2>
            <div className="mt-3 grid gap-3">
              {history.length === 0 && <p className="text-sm text-coffee/60">Nog geen statuswijzigingen.</p>}
              {history.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <p className="text-coffee/85">
                    {entry.old_status ? `${entry.old_status} → ` : ""}
                    <span className="font-semibold">{entry.new_status}</span>
                  </p>
                  <p className="text-xs text-coffee/50">
                    {entry.changed_by || "Onbekend"} · {formatDateTime(entry.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Boeking verwijderen?"
        description={`De boeking van ${booking.customer_name} wordt definitief verwijderd.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteBooking(booking.id);
          navigate("/admin/bookings");
        }}
      />
      <ConfirmDialog
        open={confirmRefund}
        title="Terugbetaling registreren?"
        description="Controleer eerst of het bedrag daadwerkelijk is terugbetaald. Deze actie wijzigt alleen de betaalstatus in het beheer en voert zelf geen bankbetaling uit."
        confirmLabel={saving ? "Opslaan..." : "Markeer terugbetaald"}
        confirmationText="TERUGBETALEN"
        onCancel={() => setConfirmRefund(false)}
        onConfirm={async () => {
          await updateDepositStatus("Terugbetaald");
          setConfirmRefund(false);
        }}
      />
    </AdminLayout>
  );
}

async function sendBookingConfirmedMail(booking) {
  return sendBookingTemplate(booking, "booking_confirmed");
}

async function sendBookingTemplate(booking, templateKey, force = false, extraVariables = {}) {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_email: booking.customer_email,
        template_key: templateKey,
        related_booking_id: booking.id,
        variables: {
          customer_name: booking.customer_name,
          shoot_type: booking.shoot_type,
          booking_date: booking.booking_date ? formatDate(booking.booking_date) : "de afgesproken datum",
          booking_time: booking.start_time ? booking.start_time.slice(0, 5) : "de afgesproken tijd",
          package_name: [booking.packages?.title, ...(booking.booking_addons || []).map((addon) => addon.title_snapshot)].filter(Boolean).join(" + "),
          portal_link: booking.portal_token ? `${window.location.origin}/klantportaal/${booking.portal_token}` : "",
          deposit_amount: booking.deposit_amount != null ? `EUR ${Number(booking.deposit_amount).toFixed(2)}` : "-",
          deposit_due_date: booking.deposit_due_date ? formatDate(booking.deposit_due_date) : "de afgesproken datum",
          invoice_number: "",
          invoice_amount: "",
          ...extraVariables,
        },
        force,
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.error(`Mail ${templateKey} versturen is mislukt:`, result.message || response.statusText);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Mail ${templateKey} versturen is mislukt:`, error);
    return false;
  }
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="fine-label text-[0.6rem] text-cocoa">{label}</dt>
      <dd className="mt-1 text-coffee/85">{value}</dd>
    </div>
  );
}

function EditBookingField({ label, help, value, onChange, type = "text", wide = false }) {
  return (
    <label className={`grid gap-2 text-sm font-semibold text-coffee ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      <span className="text-xs font-normal leading-5 text-coffee/55">{help}</span>
      <input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2.5 text-sm font-normal outline-none focus:border-cocoa" />
    </label>
  );
}
