import tls from "node:tls";

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

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const readEnv = (name) => globalThis.Netlify?.env?.get(name) || "";

const clean = (value, maxLength = 1000) => String(value || "").trim().slice(0, maxLength);

const escapeHtml = (value) =>
  clean(value, 4000)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getEmailAddress = (value) => {
  const text = clean(value, 200);
  const match = text.match(/<([^>]+)>/);
  return match ? match[1] : text;
};

const encodeHeader = (value) => `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;

const normalizePayload = (payload) => {
  const values = {
    naam: clean(payload.naam, 120),
    email: clean(payload.email, 180),
    shoot: clean(payload.shoot, 80),
    periode: clean(payload.periode, 160),
    omgeving: clean(payload.omgeving, 160),
    bericht: clean(payload.bericht, 2500),
    privacy: payload.privacy === true || payload.privacy === "on" || payload.privacy === "true",
    botField: clean(payload["bot-field"], 200),
  };

  if (values.botField) {
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

function createSmtpClient({ host, port }) {
  const socket = tls.connect({ host, port, servername: host });
  socket.setEncoding("utf8");

  let buffer = "";
  const waitForResponse = () =>
    new Promise((resolve, reject) => {
      const onData = (chunk) => {
        buffer += chunk;
        const lines = buffer.split(/\r?\n/).filter(Boolean);
        const lastLine = lines.at(-1) || "";
        if (/^\d{3} /.test(lastLine)) {
          socket.off("data", onData);
          socket.off("error", onError);
          const response = buffer;
          buffer = "";
          resolve({ code: Number(lastLine.slice(0, 3)), response });
        }
      };
      const onError = (error) => {
        socket.off("data", onData);
        reject(error);
      };
      socket.on("data", onData);
      socket.once("error", onError);
    });

  const command = async (line, expectedCodes = []) => {
    socket.write(`${line}\r\n`);
    const result = await waitForResponse();
    if (expectedCodes.length && !expectedCodes.includes(result.code)) {
      throw new Error(`SMTP gaf een melding terug: ${result.response.replace(/\s+/g, " ").slice(0, 220)}`);
    }
    return result;
  };

  return {
    command,
    waitForResponse,
    close: () => socket.end(),
  };
}

const dotStuff = (message) =>
  message
    .replace(/\r?\n/g, "\r\n")
    .split("\r\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");

const composeEmail = ({ from, to, replyTo, subject, text, html }) => {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="cuddling-memories-boundary"',
  ];

  return dotStuff(`${headers.join("\r\n")}

--cuddling-memories-boundary
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 8bit

${text}

--cuddling-memories-boundary
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 8bit

${html}

--cuddling-memories-boundary--`);
};

async function sendWithSmtp({ to, subject, text, html, replyTo }) {
  const host = readEnv("SMTP_HOST") || "smtp.gmail.com";
  const port = Number(readEnv("SMTP_PORT") || 465);
  const user = readEnv("SMTP_USER") || "ddytuber@gmail.com";
  const pass = readEnv("SMTP_PASS");
  const from = readEnv("EMAIL_FROM") || `Cuddling Memories Fotografie <${user}>`;

  if (!user || !pass || !from) {
    throw new Error("Gmail SMTP is nog niet compleet ingesteld. Vul SMTP_PASS in bij de Netlify omgevingsvariabelen.");
  }

  if (port !== 465) {
    throw new Error("Gebruik voor Gmail SMTP poort 465 met beveiligde verbinding.");
  }

  const client = createSmtpClient({ host, port });

  try {
    const greeting = await client.waitForResponse();
    if (greeting.code !== 220) {
      throw new Error(`SMTP gaf een melding terug: ${greeting.response.replace(/\s+/g, " ").slice(0, 220)}`);
    }

    await client.command("EHLO cuddling-memories-website.netlify.app", [250]);
    await client.command(`AUTH PLAIN ${Buffer.from(`\u0000${user}\u0000${pass}`).toString("base64")}`, [235]);
    await client.command(`MAIL FROM:<${getEmailAddress(from)}>`, [250]);
    await client.command(`RCPT TO:<${to}>`, [250, 251]);
    await client.command("DATA", [354]);
    await client.command(`${composeEmail({ from, to, replyTo, subject, text, html })}\r\n.`, [250]);
    await client.command("QUIT", [221]);
  } finally {
    client.close();
  }
}

const renderText = (values) => `Nieuwe boekingsaanvraag via Cuddling Memories Fotografie

Naam: ${values.naam}
E-mailadres: ${values.email}
Gewenste shoot: ${values.shoot}
Gewenste periode of datum: ${values.periode}
Locatie of omgeving: ${values.omgeving}

Bericht:
${values.bericht}
`;

const renderHtml = (values) => `<!doctype html>
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

export default async (req) => {
  if (req.method !== "POST") {
    return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  }

  try {
    const payload = await req.json();
    const { spam, values } = normalizePayload(payload);

    if (spam) {
      return json(200, { ok: true });
    }

    const to = readEnv("ADMIN_NOTIFICATION_EMAIL") || readEnv("MAIL_TO") || "ddytuber@gmail.com";
    await sendWithSmtp({
      to,
      subject: `Nieuwe boekingsaanvraag - ${values.shoot}`,
      text: renderText(values),
      html: renderHtml(values),
      replyTo: values.email,
    });

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
