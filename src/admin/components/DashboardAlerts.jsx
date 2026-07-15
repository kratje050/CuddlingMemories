import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, ClipboardList, Image, Images } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient.js";
import { formatDate } from "../../lib/formatDate.js";

const inactiveBookingStatuses = new Set(["Geannuleerd", "Gearchiveerd", "Afgerond"]);
const activeGalleryStatuses = new Set(["Gepubliceerd", "Wacht op keuze klant", "Keuze ontvangen", "Extra beelden aangevraagd"]);

export default function DashboardAlerts() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [extraPhotos, setExtraPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const [bookingResult, invoiceResult, galleryResult, photoResult] = await Promise.all([
        supabase.from("bookings").select("id,customer_name,shoot_type,booking_date,start_time,status,deposit_amount,deposit_due_date,deposit_status,questionnaire_answers"),
        supabase.from("invoices").select("id,booking_id,invoice_number,due_at,status,total_amount"),
        supabase.from("client_galleries").select("id,title,client_name,status,expires_at,included_images"),
        supabase.from("gallery_photos").select("id,gallery_id").eq("is_extra_requested", true),
      ]);
      if (!active) return;
      const firstError = bookingResult.error || invoiceResult.error || galleryResult.error || photoResult.error;
      if (firstError) {
        setError(firstError.message);
      } else {
        setBookings(bookingResult.data || []);
        setInvoices(invoiceResult.data || []);
        setGalleries(galleryResult.data || []);
        setExtraPhotos(photoResult.data || []);
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  const alerts = useMemo(() => buildAlerts(bookings, invoices, galleries, extraPhotos), [bookings, invoices, galleries, extraPhotos]);
  const urgentCount = alerts.filter((alert) => alert.level === "urgent").length;

  return (
    <section className="mt-6 rounded-lg bg-card p-5 shadow-soft warm-border md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="fine-label text-cocoa">Actie nodig</p>
          <h2 className="display-title mt-1 text-2xl font-semibold text-coffee">Waarschuwingen</h2>
          <p className="mt-1 text-sm leading-6 text-coffee/60">Belangrijke betalingen, shoots, vragenlijsten en galerijkeuzes op één plek.</p>
        </div>
        {!loading && alerts.length > 0 && <div className="flex gap-2"><CountBadge label={`${alerts.length} totaal`} /><CountBadge label={`${urgentCount} dringend`} urgent={urgentCount > 0} /></div>}
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-coffee/60">Waarschuwingen controleren...</p>
      ) : error ? (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">Waarschuwingen laden is niet gelukt: {error}</p>
      ) : alerts.length === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-4 text-emerald-900">
          <CheckCircle2 size={20} />
          <p className="text-sm font-semibold">Alles is bijgewerkt. Er zijn nu geen waarschuwingen.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {alerts.map((alert) => {
            const AlertIcon = alert.icon;
            return <button
              key={alert.id}
              type="button"
              onClick={() => navigate(alert.to)}
              className={`group flex min-h-24 items-start gap-4 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${alert.level === "urgent" ? "border-red-200 bg-red-50" : alert.level === "attention" ? "border-amber-200 bg-amber-50" : "border-cocoa/15 bg-cream"}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${alert.level === "urgent" ? "bg-red-100 text-red-800" : alert.level === "attention" ? "bg-amber-100 text-amber-900" : "bg-linen text-cocoa"}`}><AlertIcon size={18} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-coffee">{alert.title}</span>
                <span className="mt-1 block text-xs leading-5 text-coffee/62">{alert.text}</span>
              </span>
              <ChevronRight size={18} className="mt-2 shrink-0 text-cocoa/55 transition group-hover:translate-x-0.5" />
            </button>;
          })}
        </div>
      )}
    </section>
  );
}

function buildAlerts(bookings, invoices, galleries, extraPhotos) {
  const today = dateKey(new Date());
  const tomorrow = addDays(today, 1);
  const questionnaireLimit = addDays(today, 14);
  const galleryLimit = addDays(today, 3);
  const alerts = [];
  const bookingsById = new Map(bookings.map((booking) => [booking.id, booking]));

  bookings.filter((booking) => !inactiveBookingStatuses.has(booking.status)).forEach((booking) => {
    const depositOverdue = Number(booking.deposit_amount || 0) > 0 && !["Betaald", "Terugbetaald"].includes(booking.deposit_status) && booking.deposit_due_date && booking.deposit_due_date < today;
    if (depositOverdue) alerts.push({ id: `deposit-${booking.id}`, level: "urgent", icon: AlertTriangle, title: `Aanbetaling verlopen: ${booking.customer_name}`, text: `${booking.shoot_type} · uiterlijk ${formatDate(booking.deposit_due_date)}. Open de boeking om de betaling te controleren.`, to: `/admin/bookings/${booking.id}`, sort: `0-${booking.deposit_due_date}` });

    if (booking.booking_date === tomorrow) alerts.push({ id: `tomorrow-${booking.id}`, level: "attention", icon: CalendarClock, title: `Shoot morgen: ${booking.customer_name}`, text: `${booking.shoot_type} om ${String(booking.start_time || "").slice(0, 5) || "de afgesproken tijd"}.`, to: `/admin/bookings/${booking.id}`, sort: `1-${booking.start_time || ""}` });

    const upcomingForQuestionnaire = booking.booking_date && booking.booking_date >= today && booking.booking_date <= questionnaireLimit;
    if (upcomingForQuestionnaire && !hasQuestionnaireAnswers(booking.questionnaire_answers)) alerts.push({ id: `questionnaire-${booking.id}`, level: "normal", icon: ClipboardList, title: `Vragenlijst niet ingevuld: ${booking.customer_name}`, text: `${booking.shoot_type} staat gepland op ${formatDate(booking.booking_date)}. Controleer welke informatie nog ontbreekt.`, to: `/admin/bookings/${booking.id}`, sort: `3-${booking.booking_date}` });
  });

  invoices.filter((invoice) => !["Betaald", "Gecrediteerd"].includes(invoice.status) && invoice.due_at && invoice.due_at < today).forEach((invoice) => {
    const booking = bookingsById.get(invoice.booking_id);
    if (!booking || inactiveBookingStatuses.has(booking.status)) return;
    alerts.push({ id: `invoice-${invoice.id}`, level: "urgent", icon: AlertTriangle, title: `Restbedrag verlopen: ${booking.customer_name}`, text: `Factuur ${invoice.invoice_number} van ${formatEuro(invoice.total_amount)} had uiterlijk ${formatDate(invoice.due_at)} betaald moeten zijn.`, to: `/admin/bookings/${booking.id}`, sort: `0-${invoice.due_at}` });
  });

  const extraCountByGallery = new Map();
  extraPhotos.forEach((photo) => extraCountByGallery.set(photo.gallery_id, (extraCountByGallery.get(photo.gallery_id) || 0) + 1));
  galleries.filter((gallery) => activeGalleryStatuses.has(gallery.status)).forEach((gallery) => {
    if (gallery.expires_at && gallery.expires_at >= today && gallery.expires_at <= galleryLimit) alerts.push({ id: `expires-${gallery.id}`, level: "attention", icon: Image, title: `Galerij verloopt bijna: ${gallery.client_name}`, text: `${gallery.title} verloopt op ${formatDate(gallery.expires_at)}. Verleng de datum of rond de galerij af.`, to: `/admin/galleries/${gallery.id}`, sort: `2-${gallery.expires_at}` });
    const extraCount = extraCountByGallery.get(gallery.id) || 0;
    if (gallery.status === "Extra beelden aangevraagd" || extraCount > 0) alerts.push({ id: `extra-${gallery.id}`, level: "attention", icon: Images, title: `Extra beelden gekozen: ${gallery.client_name}`, text: `${extraCount || "Er zijn"} extra beeld${extraCount === 1 ? "" : "en"} aangevraagd in ${gallery.title}.`, to: `/admin/galleries/${gallery.id}`, sort: `1-extra-${gallery.title}` });
  });

  return alerts.sort((a, b) => a.sort.localeCompare(b.sort)).slice(0, 20);
}

function hasQuestionnaireAnswers(value) {
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((answer) => String(answer || "").trim().length > 0);
}

function CountBadge({ label, urgent }) { return <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${urgent ? "bg-red-100 text-red-800" : "bg-linen text-coffee"}`}>{label}</span>; }
function addDays(value, amount) { const date = new Date(`${value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + amount); return date.toISOString().slice(0, 10); }
function dateKey(value) { const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value); const get = (type) => parts.find((part) => part.type === type)?.value || ""; return `${get("year")}-${get("month")}-${get("day")}`; }
function formatEuro(value) { return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value || 0)); }
