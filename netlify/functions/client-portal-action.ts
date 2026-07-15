import { clean, getAdminNotificationEmail, getSupabaseAdmin, json, sendTemplateMailSafely } from "./email-utils.ts";
import { DEFAULT_CONTRACT_TEXT } from "../../src/data/legalTerms.js";

const allowedQuestionnaireKeys = ["children", "participants", "allergies", "specialDetails", "photographerNotes"];

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  try {
    const payload = await req.json();
    const token = clean(payload.token, 160);
    const action = clean(payload.action, 40);
    const supabase = getSupabaseAdmin();
    const { data: booking, error } = await supabase.from("bookings").select("*").eq("portal_token", token).eq("portal_enabled", true).maybeSingle();
    if (error) throw error;
    if (!booking) return json(404, { ok: false, message: "Boeking niet gevonden." });
    const origin = new URL(req.url).origin;
    const portalLink = `${origin}/klantportaal/${booking.portal_token}`;
    const adminLink = `${origin}/admin/bookings/${booking.id}`;

    if (action === "questionnaire") {
      if (booking.questionnaire_locked) return json(409, { ok: false, message: "De voorbereidingsvragen zijn inmiddels vergrendeld." });
      const source = payload.answers && typeof payload.answers === "object" ? payload.answers : {};
      const answers = Object.fromEntries(allowedQuestionnaireKeys.map((key) => [key, clean(source[key], 1000)]));
      const { error: updateError } = await supabase.from("bookings").update({ questionnaire_answers: answers }).eq("id", booking.id);
      if (updateError) throw updateError;
      await logEvent(supabase, booking.id, "questionnaire_updated", req);
      const adminEmail = getAdminNotificationEmail();
      if (adminEmail) {
        await sendTemplateMailSafely({
          recipientEmail: adminEmail,
          templateKey: "admin_questionnaire_updated",
          relatedBookingId: booking.id,
          variables: { customer_name: booking.customer_name, shoot_type: booking.shoot_type, admin_link: adminLink },
        }, "Adminmelding voorbereidingsvragen versturen is mislukt");
      }
      return json(200, { ok: true, message: "Je voorbereidingsvragen zijn opgeslagen." });
    }

    if (action === "reschedule") {
      const preferredDate = clean(payload.preferred_date, 10);
      const preferredPeriod = clean(payload.preferred_period, 100);
      const reason = clean(payload.reason, 1500);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) return json(400, { ok: false, message: "Kies een gewenste datum." });
      const { error: insertError } = await supabase.from("booking_change_requests").insert({ booking_id: booking.id, preferred_date: preferredDate, preferred_period: preferredPeriod || null, reason: reason || null });
      if (insertError) throw insertError;
      await logEvent(supabase, booking.id, "reschedule_requested", req, { preferred_date: preferredDate });
      const variables = { customer_name: booking.customer_name, shoot_type: booking.shoot_type, preferred_date: formatDate(preferredDate), preferred_period: preferredPeriod || "Geen voorkeur", reason: reason || "Niet ingevuld", admin_link: adminLink };
      await sendTemplateMailSafely({ recipientEmail: booking.customer_email, templateKey: "reschedule_requested", relatedBookingId: booking.id, variables }, "Bevestiging verplaatsingsverzoek versturen is mislukt");
      const adminEmail = getAdminNotificationEmail();
      if (adminEmail) await sendTemplateMailSafely({ recipientEmail: adminEmail, templateKey: "admin_reschedule_requested", relatedBookingId: booking.id, variables }, "Adminmelding verplaatsingsverzoek versturen is mislukt");
      return json(200, { ok: true, message: "Je verzoek is verstuurd. De afspraak verandert pas na bevestiging." });
    }

    if (action === "payment_method") {
      const method = clean(payload.method, 30);
      if (method !== "bank_transfer") return json(400, { ok: false, message: "De aanbetaling kan alleen via bankoverschrijving worden voldaan." });
      if (booking.deposit_status === "Betaald") return json(409, { ok: false, message: "De aanbetaling staat al als betaald geregistreerd." });
      const amount = Number(booking.deposit_amount || 0);
      if (amount <= 0) return json(400, { ok: false, message: "Voor deze boeking staat geen aanbetaling open." });
      const reference = booking.deposit_payment_reference || `CM-${booking.id.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
      const { error: updateError } = await supabase.from("bookings").update({ deposit_payment_method: method, deposit_payment_reference: reference, deposit_status: "Gevraagd" }).eq("id", booking.id);
      if (updateError) throw updateError;
      await supabase.from("payment_transactions").delete().eq("booking_id", booking.id).eq("payment_type", "deposit").eq("status", "pending");
      await supabase.from("payment_transactions").insert({ booking_id: booking.id, provider: method, payment_type: "deposit", amount, status: "pending", provider_payload: { reference } });
      await logEvent(supabase, booking.id, "payment_method_selected", req, { method, reference });
      return json(200, { ok: true, message: "De aanbetaling wordt via bankoverschrijving voldaan. Gebruik het betalingskenmerk bij de overschrijving." });
    }

    if (action === "balance_payment_method") {
      const method = clean(payload.method, 30);
      if (!["bank_transfer", "cash"].includes(method)) return json(400, { ok: false, message: "Kies bankoverschrijving of contant betalen." });
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("id,total_amount,status")
        .eq("booking_id", booking.id)
        .not("status", "in", "(Betaald,Gecrediteerd)")
        .order("issued_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (invoiceError) throw invoiceError;
      if (!invoice) return json(400, { ok: false, message: "Er staat nog geen openstaand restbedrag klaar." });
      const amount = Math.max(0, Number(invoice.total_amount || 0) - Math.min(Number(booking.deposit_amount || 0), Number(invoice.total_amount || 0)));
      if (amount <= 0) return json(400, { ok: false, message: "Er staat geen resterend bedrag open." });
      const reference = booking.deposit_payment_reference || `CM-${booking.id.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
      const { error: updateError } = await supabase.from("bookings").update({ full_payment_method: method }).eq("id", booking.id);
      if (updateError) throw updateError;
      await supabase.from("payment_transactions").delete().eq("booking_id", booking.id).eq("payment_type", "invoice").eq("status", "pending");
      const { error: transactionError } = await supabase.from("payment_transactions").insert({ booking_id: booking.id, invoice_id: invoice.id, provider: method, payment_type: "invoice", amount, status: "pending", provider_payload: { reference } });
      if (transactionError) throw transactionError;
      await logEvent(supabase, booking.id, "balance_payment_method_selected", req, { method, reference, amount });
      return json(200, { ok: true, message: method === "cash" ? "Contant betalen van het resterende bedrag is doorgegeven." : "Bankoverschrijving voor het resterende bedrag is gekozen." });
    }

    if (action === "sign_contract") {
      if (booking.contract_signed_at) return json(409, { ok: false, message: "De overeenkomst is al ondertekend." });
      const signerName = clean(payload.signer_name, 160);
      if (signerName.length < 2 || payload.accepted !== true) return json(400, { ok: false, message: "Vul je volledige naam in en accepteer de overeenkomst." });
      const { error: updateError } = await supabase.from("bookings").update({
        contract_text: booking.contract_text || booking.cancellation_terms || DEFAULT_CONTRACT_TEXT,
        contract_signed_at: new Date().toISOString(),
        contract_signer_name: signerName,
        contract_signature_ip: readIp(req),
        contract_signature_user_agent: req.headers.get("user-agent") || null,
      }).eq("id", booking.id);
      if (updateError) throw updateError;
      const signedAt = new Date();
      await logEvent(supabase, booking.id, "contract_signed", req, { signer_name: signerName, version: booking.contract_version });
      const variables = { customer_name: booking.customer_name, shoot_type: booking.shoot_type, signer_name: signerName, contract_version: booking.contract_version || "Actuele versie", signed_at: formatDateTime(signedAt), admin_link: adminLink };
      await sendTemplateMailSafely({ recipientEmail: booking.customer_email, templateKey: "contract_signed", relatedBookingId: booking.id, variables }, "Bevestiging ondertekening versturen is mislukt");
      const adminEmail = getAdminNotificationEmail();
      if (adminEmail) await sendTemplateMailSafely({ recipientEmail: adminEmail, templateKey: "admin_contract_signed", relatedBookingId: booking.id, variables }, "Adminmelding ondertekening versturen is mislukt");
      return json(200, { ok: true, message: "De overeenkomst is ondertekend en opgeslagen." });
    }

    return json(400, { ok: false, message: "Onbekende actie." });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Actie verwerken is niet gelukt." });
  }
};

const readIp = (req: Request) => clean(req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for"), 100) || null;
const pad = (value: number) => String(value).padStart(2, "0");
const formatDate = (value: string) => {
  const [year, month, day] = String(value || "").slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year.slice(-2)}` : "-";
};
const formatDateTime = (value: Date) => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(value);
  const result = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${result.day}/${result.month}/${String(result.year).slice(-2)} ${pad(Number(result.hour))}:${pad(Number(result.minute))}`;
};
async function logEvent(supabase: ReturnType<typeof getSupabaseAdmin>, bookingId: string, eventType: string, req: Request, details = {}) {
  await supabase.from("client_portal_events").insert({ booking_id: bookingId, event_type: eventType, details, ip_address: readIp(req), user_agent: req.headers.get("user-agent") || null });
}

export const config = { path: "/api/client-portal-action" };
