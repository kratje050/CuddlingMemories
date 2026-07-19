import nodemailer from "nodemailer";
import { getStore } from "@netlify/blobs";
import { createClient } from "@supabase/supabase-js";
import { getAdminNotificationEmail, sendTemplateMailSafely } from "./email-utils.ts";
import { CANCELLATION_TERMS_VERSION } from "../../src/data/legalTerms.js";
import { ensureAutomaticInvoice } from "./invoice-utils.ts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MIN_FILL_TIME_MS = 2500;
const MODEL_USAGE_CONSENT_VERSION = "2026-07-12-v1";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const readEnv = (name: string) => globalThis.Netlify?.env?.get(name) || "";

const clean = (value: unknown, maxLength = 1000) => String(value ?? "").trim().slice(0, maxLength);

const escapeHtml = (value: unknown) =>
  clean(value, 4000)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTime = (value: string) => /^\d{2}:\d{2}$/.test(value);
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const normalizeQuestionnaire = (value: unknown) => {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    children: clean(input.children, 600),
    participants: clean(input.participants, 600),
    allergies: clean(input.allergies, 600),
    specialDetails: clean(input.specialDetails, 1000),
    photographerNotes: clean(input.photographerNotes, 1000),
  };
};

const normalizePayload = (payload: Record<string, unknown>) => {
  const values = {
    naam: clean(payload.naam, 120),
    email: clean(payload.email, 180),
    telefoon: clean(payload.telefoon, 40),
    shoot: clean(payload.shoot, 80),
    bookingDate: clean(payload.bookingDate, 10),
    startTime: clean(payload.startTime, 5),
    omgeving: clean(payload.omgeving, 160),
    locationType: clean(payload.locationType, 20) === "location" ? "location" : "studio",
    locationStreet: clean(payload.locationStreet, 120),
    locationHouseNumber: clean(payload.locationHouseNumber, 20),
    locationPostalCode: clean(payload.locationPostalCode, 12).toUpperCase(),
    locationCity: clean(payload.locationCity, 100),
    locationNotes: clean(payload.locationNotes, 300),
    bericht: clean(payload.bericht, 2500),
    privacy: payload.privacy === true || payload.privacy === "on" || payload.privacy === "true",
    termsAccepted: payload.termsAccepted === true || payload.termsAccepted === "on" || payload.termsAccepted === "true",
    modelUsageConsent: payload.modelUsageConsent === true || payload.modelUsageConsent === "on" || payload.modelUsageConsent === "true",
    termsVersion: clean(payload.termsVersion, 40),
    questionnaire: normalizeQuestionnaire(payload.questionnaire),
    packageId: clean(payload.packageId, 60) || null,
    addonPackageIds: Array.isArray(payload.addonPackageIds)
      ? [...new Set(payload.addonPackageIds.map((value) => clean(value, 60)).filter(isUuid))].slice(0, 12)
      : [],
    giftcardCode: clean(payload.giftcardCode, 40) || null,
    discountCode: clean(payload.discountCode, 40) || null,
    waitlistOfferToken: clean(payload.waitlistOfferToken, 100) || null,
    botField: clean(payload["bot-field"], 200),
    renderedAt: Number(payload.renderedAt) || 0,
  };

  const tooFast = values.renderedAt > 0 && Date.now() - values.renderedAt < MIN_FILL_TIME_MS;
  if (values.botField || tooFast) {
    return { spam: true, values };
  }

  if (!values.naam || !isEmail(values.email) || !values.shoot) {
    throw new Error("Controleer je naam, e-mailadres en gewenste shoot.");
  }

  if (!isDate(values.bookingDate) || !isTime(values.startTime)) {
    throw new Error("Kies een datum en tijdslot uit de kalender.");
  }

  if (!values.omgeving || !values.privacy) {
    throw new Error("Vul alle verplichte velden in en accepteer de privacyverklaring.");
  }

  if (values.locationType === "location" && (!values.locationStreet || !values.locationHouseNumber || !values.locationPostalCode || !values.locationCity)) {
    throw new Error("Vul het volledige adres van de locatie in.");
  }

  if (!values.termsAccepted || values.termsVersion !== CANCELLATION_TERMS_VERSION) {
    throw new Error("Lees en accepteer de actuele annuleringsvoorwaarden voordat je de aanvraag verstuurt.");
  }

  return { spam: false, values };
};

async function requiresModelUsageConsent(values: ReturnType<typeof normalizePayload>["values"]) {
  const labels = [values.shoot];
  const packageIds = [values.packageId, ...values.addonPackageIds].filter((value): value is string => Boolean(value));
  if (packageIds.length) {
    const { data, error } = await getSupabaseAdmin().from("packages").select("title,shoot_type").in("id", packageIds);
    if (error) throw new Error("De toestemming voor het modelpakket kon niet worden gecontroleerd.");
    (data || []).forEach((item) => labels.push(item.title || "", item.shoot_type || ""));
  }
  return labels.some((label) => {
    const value = String(label || "").toLowerCase();
    return value.includes("model") && (value.includes("50%") || value.includes("korting"));
  });
}

const formatDateTime = (dateStr: string, timeStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year.slice(-2)}, ${timeStr}`;
};

const formatDate = (dateStr: string) => {
  const [year, month, day] = String(dateStr || "").slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year.slice(-2)}` : "-";
};

type GiftcardInfo = { amount: number | null; type: string | null; code: string | null } | null;

const questionnaireLabels: Record<string, string> = {
  children: "Namen en leeftijden kinderen",
  participants: "Wie komen op de foto",
  allergies: "Allergieën of voedingswensen",
  specialDetails: "Bijzonderheden",
  photographerNotes: "Verder vooraf weten",
};

const renderQuestionnaireText = (answers: Record<string, string>) => {
  const lines = Object.entries(answers)
    .filter(([, value]) => value)
    .map(([key, value]) => `${questionnaireLabels[key]}: ${value}`);
  return lines.length ? `\nVragenlijst:\n${lines.join("\n")}\n` : "";
};

const renderQuestionnaireHtml = (answers: Record<string, string>) => {
  const rows = Object.entries(answers)
    .filter(([, value]) => value)
    .map(([key, value]) => `<p><strong>${escapeHtml(questionnaireLabels[key])}:</strong> ${escapeHtml(value)}</p>`)
    .join("");
  return rows ? `<div style="margin-top:20px;padding-top:18px;border-top:1px solid #e6d1bd;"><strong>Vragenlijst:</strong>${rows}</div>` : "";
};

const formatEuro = (amount: number | null) => (amount == null ? "" : `€${Number(amount).toFixed(2)}`);

const renderText = (
  values: ReturnType<typeof normalizePayload>["values"],
  giftcard: GiftcardInfo,
  depositLine = ""
) => `Nieuwe boekingsaanvraag via Cuddling Memories Fotografie

Naam: ${values.naam}
E-mailadres: ${values.email}
Telefoonnummer: ${values.telefoon || "-"}
Gewenste shoot: ${values.shoot}
Datum en tijd: ${formatDateTime(values.bookingDate, values.startTime)}
Locatie of omgeving: ${values.omgeving}
${giftcard ? `\nCadeaubon toegepast: ${giftcard.code} (${giftcard.type}) — ${formatEuro(giftcard.amount)} gaat van het totaalbedrag af.\n` : ""}
${depositLine}
${renderQuestionnaireText(values.questionnaire)}
Bericht:
${values.bericht || "-"}
`;

const renderHtml = (
  values: ReturnType<typeof normalizePayload>["values"],
  giftcard: GiftcardInfo,
  depositLine = ""
) => `<!doctype html>
<html lang="nl">
  <body style="margin:0;background:#f7efe7;color:#3b2418;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:28px;">
      <div style="background:#fffaf4;border:1px solid #e6d1bd;border-radius:12px;padding:28px;">
        <p style="margin:0 0 8px;color:#a8764d;letter-spacing:1px;text-transform:uppercase;font-size:12px;">Cuddling Memories Fotografie</p>
        <h1 style="margin:0 0 24px;font-size:26px;font-weight:500;">Nieuwe boekingsaanvraag</h1>
        <p><strong>Naam:</strong> ${escapeHtml(values.naam)}</p>
        <p><strong>E-mailadres:</strong> ${escapeHtml(values.email)}</p>
        <p><strong>Telefoonnummer:</strong> ${escapeHtml(values.telefoon || "-")}</p>
        <p><strong>Gewenste shoot:</strong> ${escapeHtml(values.shoot)}</p>
        <p><strong>Datum en tijd:</strong> ${escapeHtml(formatDateTime(values.bookingDate, values.startTime))}</p>
        <p><strong>Locatie of omgeving:</strong> ${escapeHtml(values.omgeving)}</p>
        ${
          giftcard
            ? `<p style="background:#f3e6d8;border-radius:8px;padding:10px 14px;"><strong>Cadeaubon toegepast:</strong> ${escapeHtml(giftcard.code || "")} (${escapeHtml(giftcard.type || "")}) — <strong>${escapeHtml(formatEuro(giftcard.amount))}</strong> gaat van het totaalbedrag af.</p>`
            : ""
        }
        ${depositLine ? `<p style="background:#f3e6d8;border-radius:8px;padding:10px 14px;"><strong>Aanbetaling:</strong> ${escapeHtml(depositLine)}</p>` : ""}
        ${renderQuestionnaireHtml(values.questionnaire)}
        <div style="margin-top:20px;padding-top:18px;border-top:1px solid #e6d1bd;">
          <strong>Bericht:</strong>
          <p style="line-height:1.7;">${escapeHtml(values.bericht || "-")}</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

async function sendBookingEmail(values: ReturnType<typeof normalizePayload>["values"], giftcard: GiftcardInfo, depositLine = "") {
  const host = readEnv("SMTP_HOST") || "smtp.gmail.com";
  const port = Number(readEnv("SMTP_PORT") || 465);
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");
  const from = readEnv("EMAIL_FROM");
  const to = readEnv("ADMIN_NOTIFICATION_EMAIL") || readEnv("MAIL_TO");

  if (!user || !pass || !from || !to) {
    throw new Error(
      "E-mail is nog niet ingesteld. Vul SMTP_USER, SMTP_PASS, EMAIL_FROM en ADMIN_NOTIFICATION_EMAIL in bij de Netlify omgevingsvariabelen."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to,
    replyTo: values.email,
    subject: `Nieuwe boekingsaanvraag - ${values.shoot}`,
    text: renderText(values, giftcard, depositLine),
    html: renderHtml(values, giftcard, depositLine),
  });
}

function getSupabaseAdmin() {
  const url = readEnv("VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is nog niet ingesteld. Vul VITE_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY in bij de Netlify omgevingsvariabelen."
    );
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Bij een conflict laat de book_slot()-database-functie in Supabase (zie
// supabase/schema.sql) een specifieke foutcode achter (RAISE EXCEPTION
// '<CODE>'). Die code komt hier als error.message binnen en wordt vertaald
// naar een nette Nederlandse melding voor de bezoeker.
const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  SLOT_TAKEN: "Dit tijdslot is net geboekt. Kies een ander moment.",
  DATE_UNAVAILABLE: "Deze datum is helaas niet beschikbaar.",
  MIN_NOTICE: "Je kunt minimaal 2 dagen vooruit boeken.",
  MAX_AHEAD: "Deze datum ligt te ver in de toekomst. Kies een moment dichterbij.",
  NOT_BOOKABLE: "Voor deze shoot zijn geen beschikbare momenten gevonden.",
  GIFTCARD_INVALID: "Deze cadeaubon-code is niet bekend. Controleer de spelling.",
  GIFTCARD_NOT_REDEEMABLE: "Deze cadeaubon is nog niet betaald of al gebruikt/geannuleerd.",
  GIFTCARD_EXPIRED: "Deze cadeaubon is verlopen.",
  DISCOUNT_INVALID: "Deze kortingscode is niet bekend. Controleer de spelling.",
  DISCOUNT_NOT_ACTIVE: "Deze kortingscode is niet meer actief.",
  DISCOUNT_EXPIRED: "Deze kortingscode is verlopen.",
  DISCOUNT_LIMIT_REACHED: "Deze kortingscode is al het maximaal aantal keer gebruikt.",
};

async function bookSlot(values: ReturnType<typeof normalizePayload>["values"]) {
  const supabase = getSupabaseAdmin();
  const message = [values.telefoon ? `Telefoonnummer: ${values.telefoon}` : "", values.bericht].filter(Boolean).join("\n\n");

  const { data, error } = await supabase.rpc("book_slot", {
    p_payload: {
      customer_name: values.naam,
      customer_email: values.email,
      shoot_type: values.shoot,
      booking_date: values.bookingDate,
      start_time: values.startTime,
      package_id: values.packageId,
      location: values.omgeving,
      message,
      privacy_accepted: values.privacy,
      giftcard_code: values.giftcardCode,
      discount_code: values.discountCode,
    },
  });

  if (error) {
    const message = BOOKING_ERROR_MESSAGES[error.message] || "Boeken is niet gelukt. Probeer het opnieuw of kies een ander moment.";
    throw new Error(message);
  }

  return data;
}

async function saveBookingWorkflow(booking: unknown, values: ReturnType<typeof normalizePayload>["values"]) {
  const bookingId = getBookingId(booking);
  if (!bookingId) throw new Error("De aanvullende boekingsgegevens konden niet worden gekoppeld.");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update({
      terms_version: values.termsVersion,
      terms_accepted_at: new Date().toISOString(),
      terms_accepted_by: values.email,
      questionnaire_answers: values.questionnaire,
      location_type: values.locationType,
      location_street: values.locationType === "location" ? values.locationStreet : null,
      location_house_number: values.locationType === "location" ? values.locationHouseNumber : null,
      location_postcode: values.locationType === "location" ? values.locationPostalCode : null,
      location_city: values.locationType === "location" ? values.locationCity : null,
      location_notes: values.locationType === "location" ? values.locationNotes : null,
      model_usage_consent: values.modelUsageConsent,
      model_usage_consent_at: values.modelUsageConsent ? new Date().toISOString() : null,
      model_usage_consent_version: values.modelUsageConsent ? MODEL_USAGE_CONSENT_VERSION : null,
    })
    .eq("id", bookingId)
    .select("portal_token")
    .single();

  if (error) throw new Error("De voorwaardenacceptatie en vragenlijst konden niet worden opgeslagen.");
  return data?.portal_token || null;
}

async function saveBookingAddons(booking: unknown, values: ReturnType<typeof normalizePayload>["values"]) {
  const bookingId = getBookingId(booking);
  if (!bookingId) return booking;
  const supabase = getSupabaseAdmin();
  const addonIds = values.addonPackageIds.filter((id) => id !== values.packageId);
  let addons = [];
  if (addonIds.length) {
    const result = await supabase
      .from("packages")
      .select("id,title,price,price_unit,shoot_type,is_addon")
      .in("id", addonIds)
      .eq("is_published", true)
      .eq("is_addon", true)
      .eq("price_unit", "shoot");
    if (result.error) throw result.error;
    addons = result.data || [];
  }
  const validAddons = (addons || []).filter((addon) => !addon.shoot_type || addon.shoot_type === values.shoot);
  if (validAddons.length !== addonIds.length) throw new Error("Een van de gekozen add-ons is niet meer beschikbaar voor deze shoot.");

  if (validAddons.length) {
    const { error: insertError } = await supabase.from("booking_addons").insert(validAddons.map((addon) => ({
      booking_id: bookingId,
      package_id: addon.id,
      title_snapshot: addon.title,
      price_snapshot: Number(addon.price || 0),
    })));
    if (insertError) throw insertError;
  }

  const { data: primaryPackage, error: primaryError } = values.packageId
    ? await supabase.from("packages").select("title,price,deposit_type,deposit_value,shoot_type,is_addon,is_published,model_discount_eligible").eq("id", values.packageId).maybeSingle()
    : { data: null, error: null };
  if (primaryError) throw primaryError;
  const isModelDiscount = values.shoot.toLowerCase().includes("model") && values.shoot.toLowerCase().includes("korting");
  if (isModelDiscount && !primaryPackage) {
    throw new Error("Kies een pakket voor de modelshoot met 50% korting.");
  }
  if (isModelDiscount && primaryPackage) {
    const packageLabel = `${primaryPackage.title || ""} ${primaryPackage.shoot_type || ""}`.toLowerCase();
    if (!primaryPackage.is_published || primaryPackage.is_addon || !primaryPackage.model_discount_eligible || packageLabel.includes("bevalling")) {
      throw new Error("Dit pakket is niet beschikbaar voor een modelshoot met 50% korting.");
    }
  }
  const addonTotal = validAddons.reduce((sum, addon) => sum + Number(addon.price || 0), 0);
  const primaryPrice = Number(primaryPackage?.price || 0) * (isModelDiscount ? 0.5 : 1);
  const combinedTotal = Math.round((primaryPrice + addonTotal + Number.EPSILON) * 100) / 100;

  // Een toegepaste kortingscode verlaagt, anders dan een cadeaubon, meteen
  // het boekingsbedrag en dus ook de aanbetaling — het percentage/vaste
  // bedrag kan pas nu berekend worden, omdat book_slot() het pakket en de
  // add-ons nog niet kende.
  const discountCodeId = (booking as Record<string, unknown> | null)?.discount_code_id as string | null | undefined;
  let discountAmount = 0;
  if (discountCodeId) {
    const { data: discountRow, error: discountError } = await supabase
      .from("discount_codes")
      .select("discount_type,discount_value")
      .eq("id", discountCodeId)
      .maybeSingle();
    if (discountError) throw discountError;
    if (discountRow) {
      const rawAmount = discountRow.discount_type === "percentage"
        ? combinedTotal * (Number(discountRow.discount_value || 0) / 100)
        : Number(discountRow.discount_value || 0);
      discountAmount = Math.min(combinedTotal, Math.round((rawAmount + Number.EPSILON) * 100) / 100);
    }
  }
  const discountedTotal = Math.round((combinedTotal - discountAmount + Number.EPSILON) * 100) / 100;

  const depositAmount = primaryPackage?.deposit_type === "percentage"
    ? Math.round(discountedTotal * Number(primaryPackage.deposit_value || 0)) / 100
    : primaryPackage?.deposit_type === "fixed"
      ? Math.min(Number(primaryPackage.deposit_value || 0), discountedTotal)
      : null;
  const { data: updatedBooking, error: updateError } = await supabase
    .from("bookings")
    .update({
      budget: discountedTotal,
      discount_amount: discountAmount || null,
      ...(depositAmount == null ? {} : { deposit_amount: depositAmount, deposit_payment_method: "bank_transfer" }),
    })
    .eq("id", bookingId)
    .select("*")
    .single();
  if (updateError) throw updateError;
  const originalBooking = booking && typeof booking === "object" ? booking as Record<string, unknown> : {};
  return { ...originalBooking, ...updatedBooking, primary_package_title: primaryPackage?.title || "", primary_package_price: primaryPrice, addon_packages: validAddons, addon_total: addonTotal };
}

async function completeWaitlistInvitation(booking: unknown, values: ReturnType<typeof normalizePayload>["values"]) {
  if (!values.waitlistOfferToken) return;
  const bookingId = getBookingId(booking);
  if (!bookingId) return;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("waitlist_entries")
    .update({ status: "Omgezet naar boeking", converted_booking_id: bookingId })
    .eq("invitation_token", values.waitlistOfferToken)
    .ilike("customer_email", values.email)
    .eq("offered_date", values.bookingDate)
    .gt("invitation_expires_at", new Date().toISOString());
  if (error) console.error("Wachtlijstuitnodiging afronden is mislukt:", error);
}

function getBookingId(booking: unknown) {
  if (booking && typeof booking === "object" && "id" in booking) {
    return String((booking as { id?: unknown }).id || "") || null;
  }

  return null;
}

async function isRateLimited(req: Request) {
  const ip = req.headers.get("x-nf-client-connection-ip") || "unknown";
  const store = getStore("booking-rate-limit");
  const key = `ip:${ip}`;
  const last = await store.get(key);
  const now = Date.now();

  if (last && now - Number(last) < RATE_LIMIT_WINDOW_MS) {
    return true;
  }

  await store.set(key, String(now));
  return false;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  }

  try {
    if (await isRateLimited(req)) {
      return json(429, { ok: false, message: "Even geduld, probeer het over een minuut opnieuw." });
    }

    const payload = await req.json();
    const { spam, values } = normalizePayload(payload);

    if (spam) {
      return json(200, { ok: true });
    }

    const modelConsentRequired = await requiresModelUsageConsent(values);
    if (modelConsentRequired && !values.modelUsageConsent) {
      return json(400, { ok: false, message: "Voor het modelpakket is toestemming voor gebruik van de foto's op social media en in het portfolio verplicht." });
    }
    if (!modelConsentRequired) values.modelUsageConsent = false;

    // De boeking in Supabase (via book_slot(), inclusief conflict-check) is
    // de bron van waarheid; als dit faalt, faalt de hele aanvraag. De
    // e-mailnotificatie is secundair: als die faalt, wordt dat gelogd maar
    // blokkeert de (al opgeslagen) boeking niet.
    let booking = await bookSlot(values);
    booking = await saveBookingAddons(booking, values);
    const portalToken = await saveBookingWorkflow(booking, values);
    await completeWaitlistInvitation(booking, values);
    const portalLink = portalToken ? `${new URL(req.url).origin}/klantportaal/${portalToken}` : "";
    const giftcard: GiftcardInfo =
      booking && typeof booking === "object" && "giftcard_amount" in (booking as Record<string, unknown>)
        ? {
            amount: (booking as Record<string, unknown>).giftcard_amount as number | null,
            type: (booking as Record<string, unknown>).giftcard_type as string | null,
            code: (booking as Record<string, unknown>).giftcard_code as string | null,
          }
        : null;
    const giftcardLine = giftcard
      ? `\n\nJe cadeaubon ${giftcard.code} is toegepast op deze boeking: ${formatEuro(giftcard.amount)} gaat van het totaalbedrag af.`
      : "";
    const bookingRecord = booking && typeof booking === "object" ? (booking as Record<string, unknown>) : {};
    const discountAmountValue = bookingRecord.discount_amount == null ? null : Number(bookingRecord.discount_amount);
    const discountLine = discountAmountValue && bookingRecord.discount_code
      ? `\n\nJe kortingscode ${bookingRecord.discount_code} is toegepast op deze boeking: ${formatEuro(discountAmountValue)} gaat van het totaalbedrag af.`
      : "";
    const addonPackages = Array.isArray(bookingRecord.addon_packages) ? bookingRecord.addon_packages as Array<Record<string, unknown>> : [];
    let automaticInvoice = null;
    try {
      automaticInvoice = await ensureAutomaticInvoice(getSupabaseAdmin(), bookingRecord);
    } catch (invoiceError) {
      // De boeking blijft geldig als alleen de aanvullende factuur niet kan
      // worden aangemaakt. Bij de eerste portaal-load volgt nog een retry.
      console.error("Boeking opgeslagen, maar automatische factuur maken is mislukt:", invoiceError);
    }
    const packageSummary = [
      String(bookingRecord.primary_package_title || automaticInvoice?.title || (values.packageId ? "Hoofdpakket" : "Geen specifiek hoofdpakket")),
      ...addonPackages.map((addon) => String(addon.title || "Add-on")),
    ].join(" + ");
    const depositAmount = bookingRecord.deposit_amount == null ? null : Number(bookingRecord.deposit_amount);
    const depositDueDate = clean(bookingRecord.deposit_due_date, 10);
    const depositDueMode = clean(bookingRecord.deposit_due_mode, 30);
    const depositLine = depositAmount != null
      ? `Voor dit pakket geldt een aanbetaling van ${formatEuro(depositAmount)}${depositDueMode === "booking" ? ", direct te voldoen na het boeken" : depositDueDate ? `, uiterlijk te betalen op ${formatDate(depositDueDate)}` : ""}.`
      : "";
    const bookingExtrasLine = `${addonPackages.length ? `\n\nGekozen add-ons: ${addonPackages.map((addon) => addon.title).join(", ")}.` : ""}${giftcardLine}${discountLine}${depositLine ? `\n\n${depositLine}` : ""}`;

    const adminEmail = getAdminNotificationEmail();
    if (adminEmail) {
      await sendTemplateMailSafely({
          recipientEmail: adminEmail,
          templateKey: "admin_booking_received",
          relatedBookingId: getBookingId(booking),
          variables: {
            customer_name: values.naam,
            customer_email: values.email,
            shoot_type: values.shoot,
            booking_date: formatDate(values.bookingDate),
            booking_time: values.startTime,
            location: values.omgeving,
            package_name: packageSummary,
            deposit_line: depositLine || "Geen aanbetaling ingesteld",
            admin_link: `${new URL(req.url).origin}/admin/bookings/${getBookingId(booking)}`,
          },
        }, "Adminmelding nieuwe boeking versturen is mislukt");
    }
    await sendTemplateMailSafely({
        recipientEmail: values.email,
        templateKey: "booking_received",
        relatedBookingId: getBookingId(booking),
        variables: {
          customer_name: values.naam,
          shoot_type: values.shoot,
          booking_date: formatDate(values.bookingDate),
          booking_time: values.startTime,
          giftcard_line: bookingExtrasLine,
          portal_link: portalLink,
        },
      }, "Boekingsbevestiging klant versturen is mislukt");
    if (depositDueMode === "booking" && Number(depositAmount || 0) > 0) {
      await sendTemplateMailSafely({
          recipientEmail: values.email,
          templateKey: "deposit_requested",
          relatedBookingId: getBookingId(booking),
          variables: {
            customer_name: values.naam,
            shoot_type: values.shoot,
            deposit_amount: formatEuro(Number(depositAmount)),
            deposit_due_date: depositDueDate ? formatDate(depositDueDate) : "vandaag",
            portal_link: portalLink,
          },
        }, "Directe aanbetalingsmail klant versturen is mislukt");
    }
    if (automaticInvoice?.created) {
      await sendTemplateMailSafely({
          recipientEmail: values.email,
          templateKey: "invoice_ready",
          relatedBookingId: getBookingId(booking),
          variables: {
            customer_name: values.naam,
            invoice_number: automaticInvoice.invoice_number,
            invoice_amount: formatEuro(Number(automaticInvoice.total_amount || 0)),
            portal_link: portalLink,
          },
        }, "Factuurmail klant versturen is mislukt");
    }

    return json(200, { ok: true, portal_url: portalLink });
  } catch (error) {
    console.error(error);
    return json(500, {
      ok: false,
      message: error instanceof Error ? error.message : "Aanvraag versturen is niet gelukt.",
    });
  }
};

export const config = {
  path: "/api/create-booking",
};
