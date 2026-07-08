import nodemailer from "nodemailer";
import { getStore } from "@netlify/blobs";

const shootOptions = [
  "Portretshoot",
  "Cakesmash",
  "Zwangerschapsshoot",
  "Gezinsshoot",
  "Newbornshoot",
  "Motherhood",
  "Buiten shoot",
  "Model staan met 50% korting",
  "Anders",
];

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

const normalizePayload = (payload: Record<string, unknown>) => {
  const values = {
    naam: clean(payload.naam, 120),
    email: clean(payload.email, 180),
    shoot: clean(payload.shoot, 80),
    periode: clean(payload.periode, 160),
    omgeving: clean(payload.omgeving, 160),
    bericht: clean(payload.bericht, 2500),
    privacy: payload.privacy === true || payload.privacy === "on" || payload.privacy === "true",
    botField: clean(payload["bot-field"], 200),
    renderedAt: Number(payload.renderedAt) || 0,
  };

  const tooFast = values.renderedAt > 0 && Date.now() - values.renderedAt < MIN_FILL_TIME_MS;
  if (values.botField || tooFast) {
    return { spam: true, values };
  }

  if (!values.naam || !isEmail(values.email) || !shootOptions.includes(values.shoot)) {
    throw new Error("Controleer je naam, e-mailadres en gewenste shoot.");
  }

  if (!values.periode || !values.omgeving || !values.bericht || !values.privacy) {
    throw new Error("Vul alle verplichte velden in en accepteer de privacyverklaring.");
  }

  return { spam: false, values };
};

const renderText = (values: ReturnType<typeof normalizePayload>["values"]) => `Nieuwe boekingsaanvraag via Cuddling Memories Fotografie

Naam: ${values.naam}
E-mailadres: ${values.email}
Gewenste shoot: ${values.shoot}
Gewenste periode of datum: ${values.periode}
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
        <p><strong>Gewenste periode of datum:</strong> ${escapeHtml(values.periode)}</p>
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

    await sendBookingEmail(values);

    return json(200, { ok: true });
  } catch (error) {
    console.error(error);
    return json(500, {
      ok: false,
      message: error instanceof Error ? error.message : "Verzenden is niet gelukt.",
    });
  }
};

export const config = {
  path: "/api/send-booking",
};
