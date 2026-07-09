import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import { emailTemplateDefaults, renderTemplate } from "../../src/lib/emailTemplates.js";

const readEnv = (name: string) => globalThis.Netlify?.env?.get(name) || "";

export const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export const clean = (value: unknown, maxLength = 1000) => String(value ?? "").trim().slice(0, maxLength);
export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function getSupabaseAdmin() {
  const url = readEnv("VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Supabase mist VITE_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

const escapeHtml = (value: string) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderEmailText = (value: string) =>
  String(value || "")
    .split(/(https?:\/\/[^\s]+)/g)
    .map((part) => {
      if (!part.startsWith("http")) return escapeHtml(part).replaceAll("\n", "<br>");
      const safeUrl = escapeHtml(part);
      return `<a href="${safeUrl}" style="color:#9a7359;font-weight:700;text-decoration:underline;">${safeUrl}</a>`;
    })
    .join("");

const renderBrandedEmail = (subject: string, body: string) => {
  const cleanBody = body.replace(/\n*\s*Liefs,?\s*\n\s*Cuddling Memories Fotografie\s*$/i, "");
  const paragraphs = cleanBody
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p style="margin:0 0 18px;line-height:1.75;">${renderEmailText(part)}</p>`)
    .join("");

  return `<!doctype html>
<html lang="nl">
  <body style="margin:0;background:#f7f1ea;color:#4e3b2f;font-family:Arial,sans-serif;">
    <div style="padding:32px 16px;">
      <div style="max-width:640px;margin:0 auto;overflow:hidden;border:1px solid #e7d8ca;border-radius:18px;background:#fffaf4;box-shadow:0 18px 50px rgba(78,59,47,0.12);">
        <div style="padding:30px 32px 22px;background:#eadbce;">
          <div style="font-family:Georgia,serif;font-size:31px;line-height:1;color:#4e3b2f;">Cuddling Memories</div>
          <div style="margin-top:8px;letter-spacing:4px;text-transform:uppercase;font-size:11px;color:#9a7359;">Fotografie</div>
        </div>
        <div style="padding:34px 32px 26px;">
          <div style="margin:0 0 8px;letter-spacing:3px;text-transform:uppercase;font-size:11px;font-weight:700;color:#9a7359;">Cuddling Memories</div>
          <h1 style="margin:0 0 22px;font-family:Georgia,serif;font-size:30px;line-height:1.15;font-weight:500;color:#3f2c22;">${escapeHtml(subject)}</h1>
          <div style="font-size:15px;color:#5f4b40;">${paragraphs}</div>
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #eadbce;color:#8a6b55;font-size:13px;line-height:1.7;">
            Liefs,<br>
            Cuddling Memories Fotografie
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
};

async function deliverMail(to: string, subject: string, text: string, html?: string) {
  const apiKey = readEnv("EMAIL_API_KEY");
  const provider = (readEnv("EMAIL_PROVIDER") || "resend").toLowerCase();
  const from = readEnv("EMAIL_FROM_ADDRESS") || readEnv("EMAIL_FROM");

  if (apiKey && provider === "resend") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
    if (!response.ok) throw new Error(`Resend error: ${response.status}`);
    return;
  }

  const smtpUser = readEnv("SMTP_USER");
  const smtpPass = readEnv("SMTP_PASS");
  if (!smtpUser || !smtpPass || !from) {
    throw new Error("Mailprovider mist EMAIL_API_KEY of SMTP_USER/SMTP_PASS/EMAIL_FROM_ADDRESS.");
  }

  const port = Number(readEnv("SMTP_PORT") || 465);
  const transporter = nodemailer.createTransport({
    host: readEnv("SMTP_HOST") || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });
  await transporter.sendMail({ from, to, subject, text, html });
}

async function logEmail(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  row: {
    recipient_email: string;
    template_key: string;
    subject: string;
    status: string;
    error_message?: string;
    related_booking_id?: string | null;
    related_gallery_id?: string | null;
  }
) {
  try {
    await supabase.from("email_logs").insert(row);
  } catch (error) {
    console.error("E-mail log opslaan is mislukt:", error);
  }
}

export async function sendTemplateMail({
  recipientEmail,
  templateKey,
  variables = {},
  relatedBookingId = null,
  relatedGalleryId = null,
}: {
  recipientEmail: string;
  templateKey: string;
  variables?: Record<string, unknown>;
  relatedBookingId?: string | null;
  relatedGalleryId?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  let template = null;

  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_key", templateKey)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("E-mailtemplate ophalen is mislukt:", error);
    } else {
      template = data;
    }
  } catch (error) {
    console.error("E-mailtemplate ophalen is mislukt:", error);
  }

  const fallbackTemplate = emailTemplateDefaults.find((item) => item.template_key === templateKey);
  const effectiveTemplate = template || fallbackTemplate;

  if (!effectiveTemplate) {
    await logEmail(supabase, {
      recipient_email: recipientEmail,
      template_key: templateKey,
      subject: templateKey,
      status: "skipped",
      error_message: "Template ontbreekt.",
      related_booking_id: relatedBookingId,
      related_gallery_id: relatedGalleryId,
    });
    return { skipped: true, reason: "template_missing" };
  }

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  let recent = [];

  try {
    const { data, error } = await supabase
      .from("email_logs")
      .select("id")
      .eq("recipient_email", recipientEmail)
      .eq("template_key", templateKey)
      .gte("created_at", since)
      .limit(1);

    if (error) {
      console.error("E-mail duplicaatcontrole is mislukt:", error);
    } else {
      recent = data || [];
    }
  } catch (error) {
    console.error("E-mail duplicaatcontrole is mislukt:", error);
  }

  if (recent.length) {
    await logEmail(supabase, {
      recipient_email: recipientEmail,
      template_key: templateKey,
      subject: effectiveTemplate.subject,
      status: "skipped",
      error_message: "Dubbele mail binnen 15 minuten overgeslagen.",
      related_booking_id: relatedBookingId,
      related_gallery_id: relatedGalleryId,
    });
    return { skipped: true, reason: "duplicate_recent" };
  }

  const subject = renderTemplate(effectiveTemplate.subject, variables);
  const body = renderTemplate(effectiveTemplate.body, variables);
  const html = renderBrandedEmail(subject, body);

  try {
    await deliverMail(recipientEmail, subject, body, html);
    await logEmail(supabase, {
      recipient_email: recipientEmail,
      template_key: templateKey,
      subject,
      status: "sent",
      related_booking_id: relatedBookingId,
      related_gallery_id: relatedGalleryId,
    });
    return { ok: true };
  } catch (error) {
    await logEmail(supabase, {
      recipient_email: recipientEmail,
      template_key: templateKey,
      subject,
      status: "failed",
      error_message: error instanceof Error ? error.message : "Onbekende mailfout",
      related_booking_id: relatedBookingId,
      related_gallery_id: relatedGalleryId,
    });
    throw error;
  }
}
