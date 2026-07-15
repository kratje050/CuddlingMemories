import { getSupabaseAdmin, sendTemplateMailSafely } from "./email-utils.ts";

export default async () => {
  const supabase = getSupabaseAdmin();
  const today = dateInAmsterdam();
  const targets = {
    preparation: addDays(today, 7),
    reminder: addDays(today, 1),
  };

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id,customer_name,customer_email,shoot_type,booking_date,start_time,portal_token,deposit_amount,deposit_due_date,deposit_status,status")
    .not("customer_email", "is", null)
    .not("status", "in", "(Geannuleerd,Gearchiveerd,Afgerond)")
    .gte("booking_date", today);
  if (error) throw error;

  const bookingIds = (bookings || []).map((booking) => booking.id);
  const overrides = await loadOverrides(supabase, bookingIds);

  let sent = 0;
  for (const booking of bookings || []) {
    const common = {
      customer_name: booking.customer_name,
      shoot_type: booking.shoot_type,
      booking_date: formatDate(booking.booking_date),
      booking_time: booking.start_time ? String(booking.start_time).slice(0, 5) : "de afgesproken tijd",
      portal_link: booking.portal_token ? `${siteUrl()}/klantportaal/${booking.portal_token}` : siteUrl(),
    };

    if (booking.booking_date === targets.preparation && !(await wasSent(supabase, booking.id, "preparation_tips"))) {
      const result = await sendTemplateMailSafely({
        recipientEmail: booking.customer_email,
        templateKey: "preparation_tips",
        relatedBookingId: booking.id,
        variables: common,
        ...overrideFor(overrides, booking.id, "preparation_tips"),
      }, "Voorbereidingsmail versturen is mislukt");
      if (result?.ok) sent += 1;
    }

    if (booking.booking_date === targets.reminder && !(await wasSent(supabase, booking.id, "shoot_reminder"))) {
      const result = await sendTemplateMailSafely({
        recipientEmail: booking.customer_email,
        templateKey: "shoot_reminder",
        relatedBookingId: booking.id,
        variables: common,
        ...overrideFor(overrides, booking.id, "shoot_reminder"),
      }, "Shoot-reminder versturen is mislukt");
      if (result?.ok) sent += 1;
    }

    if (
      booking.deposit_due_date === today &&
      Number(booking.deposit_amount || 0) > 0 &&
      !["Betaald", "Terugbetaald"].includes(booking.deposit_status) &&
      !(await wasSent(supabase, booking.id, "deposit_due_reminder"))
    ) {
      const result = await sendTemplateMailSafely({
        recipientEmail: booking.customer_email,
        templateKey: "deposit_due_reminder",
        relatedBookingId: booking.id,
        variables: {
          ...common,
          deposit_amount: formatEuro(booking.deposit_amount),
          deposit_due_date: formatDate(booking.deposit_due_date),
        },
        ...overrideFor(overrides, booking.id, "deposit_due_reminder"),
      }, "Betaalherinnering versturen is mislukt");
      if (result?.ok) sent += 1;
    }
  }

  const { data: dueInvoices, error: invoiceError } = await supabase
    .from("invoices")
    .select("id,booking_id,invoice_number,total_amount,due_at,status,bookings!inner(customer_name,customer_email,shoot_type,portal_token,status,deposit_amount,deposit_status)")
    .eq("due_at", today)
    .neq("status", "Betaald");
  if (invoiceError) throw invoiceError;
  const invoiceOverrides = await loadOverrides(supabase, (dueInvoices || []).map((invoice) => invoice.booking_id));

  for (const invoice of dueInvoices || []) {
    const booking = Array.isArray(invoice.bookings) ? invoice.bookings[0] : invoice.bookings;
    if (!booking?.customer_email || ["Geannuleerd", "Gearchiveerd"].includes(booking.status)) continue;
    if (await wasSent(supabase, invoice.booking_id, "invoice_due_reminder")) continue;
    const paidDeposit = booking.deposit_status === "Betaald" ? Math.min(Number(booking.deposit_amount || 0), Number(invoice.total_amount || 0)) : 0;
    const remainingAmount = Math.max(0, Number(invoice.total_amount || 0) - paidDeposit);
    if (remainingAmount <= 0) continue;
    const result = await sendTemplateMailSafely({
      recipientEmail: booking.customer_email,
      templateKey: "invoice_due_reminder",
      relatedBookingId: invoice.booking_id,
      variables: {
        customer_name: booking.customer_name,
        shoot_type: booking.shoot_type,
        invoice_number: invoice.invoice_number,
        invoice_amount: formatEuro(remainingAmount),
        invoice_due_date: formatDate(invoice.due_at),
        portal_link: booking.portal_token ? `${siteUrl()}/klantportaal/${booking.portal_token}` : siteUrl(),
      },
      ...overrideFor(invoiceOverrides, invoice.booking_id, "invoice_due_reminder"),
    }, "Factuurherinnering versturen is mislukt");
    if (result?.ok) sent += 1;
  }

  return new Response(JSON.stringify({ ok: true, checked: bookings?.length || 0, due_invoices: dueInvoices?.length || 0, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};

async function loadOverrides(supabase: ReturnType<typeof getSupabaseAdmin>, bookingIds: string[]) {
  if (!bookingIds.length) return new Map<string, { subject: string; body: string }>();
  const { data, error } = await supabase
    .from("scheduled_email_overrides")
    .select("booking_id,template_key,subject,body")
    .in("booking_id", bookingIds);
  if (error) throw error;
  return new Map((data || []).map((row) => [`${row.booking_id}|${row.template_key}`, { subject: row.subject, body: row.body }]));
}

function overrideFor(overrides: Map<string, { subject: string; body: string }>, bookingId: string, templateKey: string) {
  const override = overrides.get(`${bookingId}|${templateKey}`);
  return override ? { subjectOverride: override.subject, bodyOverride: override.body } : {};
}

async function wasSent(supabase: ReturnType<typeof getSupabaseAdmin>, bookingId: string, templateKey: string) {
  const { count, error } = await supabase
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("related_booking_id", bookingId)
    .eq("template_key", templateKey)
    .eq("status", "sent");
  if (error) {
    console.error("Controle op eerder verzonden mail is mislukt:", error);
    return false;
  }
  return Number(count || 0) > 0;
}

function dateInAmsterdam() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const formatDate = (value: string) => {
  const [year, month, day] = String(value || "").slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year.slice(-2)}` : "-";
};
const formatEuro = (value: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value || 0));
const siteUrl = () => globalThis.Netlify?.env?.get("URL") || "https://cuddlingmemories.nl";

export const config = { schedule: "0 7 * * *" };
