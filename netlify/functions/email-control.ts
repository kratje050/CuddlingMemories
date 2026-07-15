import { clean, getSupabaseAdmin, isEmail, json, sendTemplateMail } from "./email-utils.ts";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });

  try {
    const supabase = getSupabaseAdmin();
    await requireAdmin(req, supabase);
    const payload = await req.json();
    const action = clean(payload.action, 30);

    if (action === "test") {
      const recipientEmail = clean(payload.recipient_email, 180);
      const templateKey = clean(payload.template_key, 100);
      if (!isEmail(recipientEmail) || !templateKey) return json(400, { ok: false, message: "Kies een template en vul een geldig testadres in." });
      const result = await sendTemplateMail({
        recipientEmail,
        templateKey,
        variables: testVariables(),
        force: true,
        allowInactive: true,
      });
      return json(200, { ok: Boolean(result?.ok), message: result?.ok ? "Testmail is verzonden." : "Testmail is overgeslagen." });
    }

    if (action === "retry") {
      const logId = clean(payload.log_id, 80);
      const { data: log, error } = await supabase.from("email_logs").select("*").eq("id", logId).maybeSingle();
      if (error) throw error;
      if (!log) return json(404, { ok: false, message: "Deze e-maillog bestaat niet meer." });

      const variables = await rebuildVariables(supabase, log);
      const result = await sendTemplateMail({
        recipientEmail: log.recipient_email,
        templateKey: log.template_key,
        variables,
        relatedBookingId: log.related_booking_id,
        relatedGalleryId: log.related_gallery_id,
        force: true,
      });
      if (!result?.ok) return json(409, { ok: false, message: "De mail is niet verzonden. Controleer of het template actief is." });
      return json(200, { ok: true, message: `Mail opnieuw verzonden naar ${log.recipient_email}.` });
    }

    return json(400, { ok: false, message: "Onbekende e-mailactie." });
  } catch (error) {
    console.error(error);
    return json(500, { ok: false, message: error instanceof Error ? error.message : "E-mailactie is mislukt." });
  }
};

async function requireAdmin(req: Request, supabase: ReturnType<typeof getSupabaseAdmin>) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!token) throw new Error("Je adminsessie ontbreekt. Log opnieuw in.");
  const { data: userResult, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userResult.user) throw new Error("Je adminsessie is verlopen. Log opnieuw in.");
  const { data: admin, error: adminError } = await supabase.from("admin_profiles").select("id").eq("user_id", userResult.user.id).maybeSingle();
  if (adminError || !admin) throw new Error("Je hebt geen toegang tot het e-mailcontrolecentrum.");
}

async function rebuildVariables(supabase: ReturnType<typeof getSupabaseAdmin>, log: Record<string, any>) {
  let variables: Record<string, unknown> = { ...testVariables(), ...(log.variables || {}) };

  if (log.related_booking_id) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id,customer_name,customer_email,shoot_type,booking_date,start_time,location,status,portal_token,deposit_amount,deposit_due_date,deposit_payment_reference")
      .eq("id", log.related_booking_id)
      .maybeSingle();
    const { data: invoice } = await supabase
      .from("invoices")
      .select("invoice_number,total_amount,due_at")
      .eq("booking_id", log.related_booking_id)
      .order("issued_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (booking) {
      variables = {
        ...variables,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        shoot_type: booking.shoot_type,
        booking_date: formatDate(booking.booking_date),
        booking_time: String(booking.start_time || "").slice(0, 5) || "de afgesproken tijd",
        location: booking.location || "Volgens afspraak",
        request_status: booking.status,
        portal_link: booking.portal_token ? `${siteUrl()}/klantportaal/${booking.portal_token}` : siteUrl(),
        deposit_amount: formatEuro(booking.deposit_amount),
        deposit_due_date: formatDate(booking.deposit_due_date),
        payment_reference: booking.deposit_payment_reference || "Volgens afspraak",
        invoice_number: invoice?.invoice_number || "Volgens afspraak",
        invoice_amount: formatEuro(invoice?.total_amount),
        invoice_due_date: formatDate(invoice?.due_at),
        admin_link: `${siteUrl()}/admin/bookings/${booking.id}`,
        ...(log.variables || {}),
      };
    }
  }

  if (log.related_gallery_id) {
    const { data: gallery } = await supabase
      .from("client_galleries")
      .select("id,title,client_name,client_email,secure_token,included_images")
      .eq("id", log.related_gallery_id)
      .maybeSingle();
    if (gallery) {
      variables = {
        ...variables,
        customer_name: gallery.client_name,
        customer_email: gallery.client_email,
        gallery_title: gallery.title,
        gallery_link: `${siteUrl()}/galerij/${gallery.secure_token}`,
        included_images: gallery.included_images,
        admin_link: `${siteUrl()}/admin/galleries/${gallery.id}`,
        ...(log.variables || {}),
      };
    }
  }
  return variables;
}

function testVariables() {
  return {
    customer_name: "Testklant",
    customer_email: "test@example.com",
    shoot_type: "Gezinsshoot",
    booking_date: "25/07/26",
    booking_time: "14:00",
    location: "Zoutkamp",
    package_name: "Gezinsshoot",
    deposit_amount: "€ 60,00",
    deposit_due_date: "18/07/26",
    deposit_line: "30% aanbetaling direct bij boeken",
    payment_method: "Bankoverschrijving",
    payment_reference: "CM-TEST123",
    invoice_number: "CM-2026-TEST",
    invoice_amount: "€ 140,00",
    invoice_due_date: "23/07/26",
    portal_link: `${siteUrl()}/klantportaal/test`,
    gallery_title: "Voorbeeldgalerij",
    gallery_link: `${siteUrl()}/galerij/test`,
    included_images: 7,
    selected_count: 7,
    extra_count: 0,
    extra_images: 0,
    giftcard_amount: "€ 50,00",
    mini_session_title: "Voorbeeld mini-shoot",
    request_status: "Bevestigd",
    status_message: "Dit is een voorbeeld van de e-mailopmaak.",
    admin_link: `${siteUrl()}/admin/dashboard`,
    booking_link: `${siteUrl()}/boek-een-shoot`,
    offered_date: "25/07/26",
    offered_start_time: "14:00",
    offered_end_time: "14:45",
    offer_expires_at: "morgen om 14:00",
  };
}

function formatDate(value: unknown) {
  const [year, month, day] = String(value || "").slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year.slice(-2)}` : "Volgens afspraak";
}

function formatEuro(value: unknown) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function siteUrl() {
  return globalThis.Netlify?.env?.get("URL") || "https://cuddlingmemories.nl";
}

export const config = { path: "/api/email-control" };
