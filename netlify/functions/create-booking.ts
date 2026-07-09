import nodemailer from "nodemailer";
import { getStore } from "@netlify/blobs";
import { createClient } from "@supabase/supabase-js";
import { shootTypeOptions } from "../../src/lib/constants.js";
import { sendTemplateMail } from "./email-utils.ts";

const RATE_LIMIT_WINDOW_MS = 60_000;
const MIN_FILL_TIME_MS = 2500;

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

const normalizePayload = (payload: Record<string, unknown>) => {
  const values = {
    naam: clean(payload.naam, 120),
    email: clean(payload.email, 180),
    shoot: clean(payload.shoot, 80),
    bookingDate: clean(payload.bookingDate, 10),
    startTime: clean(payload.startTime, 5),
    omgeving: clean(payload.omgeving, 160),
    bericht: clean(payload.bericht, 2500),
    privacy: payload.privacy === true || payload.privacy === "on" || payload.privacy === "true",
    packageId: clean(payload.packageId, 60) || null,
    botField: clean(payload["bot-field"], 200),
    renderedAt: Number(payload.renderedAt) || 0,
  };

  const tooFast = values.renderedAt > 0 && Date.now() - values.renderedAt < MIN_FILL_TIME_MS;
  if (values.botField || tooFast) {
    return { spam: true, values };
  }

  if (!values.naam || !isEmail(values.email) || !shootTypeOptions.includes(values.shoot)) {
    throw new Error("Controleer je naam, e-mailadres en gewenste shoot.");
  }

  if (!isDate(values.bookingDate) || !isTime(values.startTime)) {
    throw new Error("Kies een datum en tijdslot uit de kalender.");
  }

  if (!values.omgeving || !values.bericht || !values.privacy) {
    throw new Error("Vul alle verplichte velden in en accepteer de privacyverklaring.");
  }

  return { spam: false, values };
};

const formatDateTime = (dateStr: string, timeStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}, ${timeStr}`;
};

const renderText = (values: ReturnType<typeof normalizePayload>["values"]) => `Nieuwe boekingsaanvraag via Cuddling Memories Fotografie

Naam: ${values.naam}
E-mailadres: ${values.email}
Gewenste shoot: ${values.shoot}
Datum en tijd: ${formatDateTime(values.bookingDate, values.startTime)}
Locatie of omgeving: ${values.omgeving}

Bericht:
${values.bericht}
`;

const renderHtml = (values: ReturnType<typeof normalizePayload>["values"]) => `<!doctype html>
<html lang="nl">
  <body style="margin:0;background:#f7efe7;color:#3b2418;font-family:Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;padding:28px;">
      <div style="background:#fffaf4;border:1px solid #e6d1bd;border-radius:12px;padding:28px;">
        <p style="margin:0 0 8px;color:#a8764d;letter-spacing:1px;text-transform:uppercase;font-size:12px;">Cuddling Memories Fotografie</p>
        <h1 style="margin:0 0 24px;font-size:26px;font-weight:500;">Nieuwe boekingsaanvraag</h1>
        <p><strong>Naam:</strong> ${escapeHtml(values.naam)}</p>
        <p><strong>E-mailadres:</strong> ${escapeHtml(values.email)}</p>
        <p><strong>Gewenste shoot:</strong> ${escapeHtml(values.shoot)}</p>
        <p><strong>Datum en tijd:</strong> ${escapeHtml(formatDateTime(values.bookingDate, values.startTime))}</p>
        <p><strong>Locatie of omgeving:</strong> ${escapeHtml(values.omgeving)}</p>
        <div style="margin-top:20px;padding-top:18px;border-top:1px solid #e6d1bd;">
          <strong>Bericht:</strong>
          <p style="line-height:1.7;">${escapeHtml(values.bericht)}</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

async function sendBookingEmail(values: ReturnType<typeof normalizePayload>["values"]) {
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
    text: renderText(values),
    html: renderHtml(values),
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
};

async function bookSlot(values: ReturnType<typeof normalizePayload>["values"]) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.rpc("book_slot", {
    p_payload: {
      customer_name: values.naam,
      customer_email: values.email,
      shoot_type: values.shoot,
      booking_date: values.bookingDate,
      start_time: values.startTime,
      package_id: values.packageId,
      location: values.omgeving,
      message: values.bericht,
      privacy_accepted: values.privacy,
    },
  });

  if (error) {
    const message = BOOKING_ERROR_MESSAGES[error.message] || "Boeken is niet gelukt. Probeer het opnieuw of kies een ander moment.";
    throw new Error(message);
  }

  return data;
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

    // De boeking in Supabase (via book_slot(), inclusief conflict-check) is
    // de bron van waarheid; als dit faalt, faalt de hele aanvraag. De
    // e-mailnotificatie is secundair: als die faalt, wordt dat gelogd maar
    // blokkeert de (al opgeslagen) boeking niet.
    const booking = await bookSlot(values);

    try {
      await sendBookingEmail(values);
    } catch (mailError) {
      console.error("Boeking opgeslagen, maar e-mail versturen is mislukt:", mailError);
    }

    try {
      await sendTemplateMail({
        recipientEmail: values.email,
        templateKey: "booking_received",
        relatedBookingId: getBookingId(booking),
        variables: {
          customer_name: values.naam,
          shoot_type: values.shoot,
          booking_date: values.bookingDate,
          booking_time: values.startTime,
        },
      });
    } catch (mailError) {
      console.error("Boeking opgeslagen, maar klantbevestiging versturen is mislukt:", mailError);
    }

    return json(200, { ok: true });
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
