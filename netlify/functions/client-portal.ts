import { clean, getSupabaseAdmin, json } from "./email-utils.ts";
import { DEFAULT_CONTRACT_TEXT } from "../../src/data/legalTerms.js";
import { ensureAutomaticInvoice } from "./invoice-utils.ts";

export default async (req: Request) => {
  if (req.method !== "GET") return json(405, { ok: false, message: "Alleen GET is toegestaan." });
  try {
    const token = clean(new URL(req.url).searchParams.get("token"), 160);
    if (!token) return json(400, { ok: false, message: "Portaalcode ontbreekt." });
    const supabase = getSupabaseAdmin();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, packages(id,title,price,included_images)")
      .eq("portal_token", token)
      .eq("portal_enabled", true)
      .maybeSingle();
    if (error) throw error;
    if (!booking || (booking.portal_expires_at && new Date(booking.portal_expires_at) < new Date())) {
      return json(404, { ok: false, message: "Deze klantlink is niet beschikbaar of verlopen." });
    }

    try {
      await ensureAutomaticInvoice(supabase, booking);
    } catch (invoiceError) {
      // Het portaal blijft bruikbaar als de automatische factuur door een
      // tijdelijke databasefout nog niet kan worden toegevoegd.
      console.error("Automatische factuur in klantportaal is mislukt:", invoiceError);
    }

    // Galerijen die alleen via hetzelfde e-mailadres zijn aangemaakt worden
    // automatisch aan deze boeking gekoppeld. Gepubliceerd + Concept wordt
    // genormaliseerd zodat de klantlink en het portaal meteen werken.
    const normalizedEmail = String(booking.customer_email || "").trim();
    if (normalizedEmail) {
      const { data: matchingGalleries } = await supabase
        .from("client_galleries")
        .select("id,booking_id,status,is_published")
        .ilike("client_email", normalizedEmail);
      for (const gallery of matchingGalleries || []) {
        const updates: Record<string, unknown> = {};
        if (!gallery.booking_id) updates.booking_id = booking.id;
        if (gallery.is_published && gallery.status === "Concept") updates.status = "Gepubliceerd";
        if (Object.keys(updates).length) {
          await supabase.from("client_galleries").update(updates).eq("id", gallery.id);
        }
      }
    }

    const [{ data: linked }, { data: byEmail }, { data: invoices }, { data: requests }, { data: payments }, { data: addons }] = await Promise.all([
      supabase.from("client_galleries").select("id,title,secure_token,status,included_images,expires_at,is_published").eq("booking_id", booking.id),
      supabase.from("client_galleries").select("id,title,secure_token,status,included_images,expires_at,is_published").ilike("client_email", booking.customer_email),
      supabase.from("invoices").select("id,invoice_number,title,total_amount,issued_at,due_at,status,paid_at").eq("booking_id", booking.id).order("issued_at", { ascending: false }),
      supabase.from("booking_change_requests").select("id,request_type,preferred_date,preferred_period,reason,status,created_at").eq("booking_id", booking.id).order("created_at", { ascending: false }),
      supabase.from("payment_transactions").select("id,payment_type,amount,currency,status,paid_at,created_at").eq("booking_id", booking.id).order("created_at", { ascending: false }),
      supabase.from("booking_addons").select("id,title_snapshot,price_snapshot").eq("booking_id", booking.id).order("created_at", { ascending: true }),
    ]);

    const fullPaymentReceived = (invoices || []).some((invoice) => invoice.status === "Betaald");
    const galleryPaymentLocked = booking.full_payment_due_mode === "after_shoot" && !fullPaymentReceived;
    const galleries = [...(linked || []), ...(byEmail || [])]
      .filter((gallery, index, all) => all.findIndex((item) => item.id === gallery.id) === index)
      .filter((gallery) => gallery.is_published && !["Verborgen", "Verlopen"].includes(gallery.status))
      .filter((gallery) => !gallery.expires_at || gallery.expires_at >= new Date().toISOString().slice(0, 10))
      .filter(() => !galleryPaymentLocked);

    const paidDeposit = booking.deposit_status === "Betaald"
      ? Math.min(Number(booking.deposit_amount || 0), Number(invoices?.[0]?.total_amount || 0))
      : 0;
    const invoicesWithBalance = (invoices || []).map((invoice, index) => {
      const depositApplied = index === 0 && invoice.status !== "Betaald" ? paidDeposit : 0;
      const totalAmount = Number(invoice.total_amount || 0);
      const openDeposit = index === 0 && invoice.status !== "Betaald" && booking.deposit_status !== "Betaald"
        ? Math.min(Number(booking.deposit_amount || 0), totalAmount)
        : 0;
      const remainingAfterDeposit = Math.max(0, totalAmount - (depositApplied || openDeposit));
      return {
        ...invoice,
        deposit_applied: depositApplied,
        deposit_due_now: openDeposit,
        remaining_after_deposit: invoice.status === "Betaald" ? 0 : remainingAfterDeposit,
        current_due_amount: invoice.status === "Betaald" ? 0 : openDeposit || Math.max(0, totalAmount - depositApplied),
        payment_phase: invoice.status === "Betaald" ? "paid" : openDeposit > 0 ? "deposit" : "balance",
        remaining_amount: invoice.status === "Betaald" ? 0 : Math.max(0, totalAmount - depositApplied),
      };
    });

    await supabase.from("client_portal_events").insert({
      booking_id: booking.id,
      event_type: "portal_viewed",
      ip_address: readIp(req),
      user_agent: req.headers.get("user-agent") || null,
    });

    return json(200, {
      ok: true,
      portal: {
        booking: {
          id: booking.id,
          customer_name: booking.customer_name,
          customer_email: booking.customer_email,
          shoot_type: booking.shoot_type,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          location: booking.location,
          status: booking.status,
          package: booking.packages || null,
          addons: addons || [],
          deposit_amount: booking.deposit_amount,
          deposit_due_mode: booking.deposit_due_mode,
          deposit_due_date: booking.deposit_due_date,
          deposit_status: booking.deposit_status,
          deposit_payment_method: booking.deposit_payment_method,
          deposit_payment_reference: booking.deposit_payment_reference,
          full_payment_method: booking.full_payment_method,
          full_payment_due_date: booking.full_payment_due_date,
          full_payment_due_mode: booking.full_payment_due_mode,
          actual_shoot_date: booking.actual_shoot_date,
          location_type: booking.location_type,
          questionnaire_answers: booking.questionnaire_answers || {},
          questionnaire_locked: booking.questionnaire_locked,
          terms_version: booking.terms_version,
          terms_accepted_at: booking.terms_accepted_at,
          terms_accepted_by: booking.terms_accepted_by,
          contract_title: booking.contract_title,
          contract_version: booking.contract_version,
          contract_text: booking.contract_text || booking.cancellation_terms || DEFAULT_CONTRACT_TEXT,
          contract_signed_at: booking.contract_signed_at,
          contract_signer_name: booking.contract_signer_name,
        },
        galleries,
        gallery_payment_locked: galleryPaymentLocked,
        invoices: invoicesWithBalance,
        change_requests: requests || [],
        payments: payments || [],
        payment_details: {
          iban: readEnv("INVOICE_IBAN") || readEnv("BANK_IBAN"),
          account_holder: readEnv("BANK_ACCOUNT_HOLDER") || readEnv("INVOICE_BUSINESS_NAME") || "Cuddling Memories Fotografie",
        },
      },
    });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Klantportaal laden is niet gelukt." });
  }
};

function readIp(req: Request) {
  return clean(req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for"), 100) || null;
}

const readEnv = (name: string) => globalThis.Netlify?.env?.get(name) || "";

export const config = { path: "/api/client-portal" };
