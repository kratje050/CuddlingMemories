import { clean, isEmail, json, sendTemplateMail } from "./email-utils.ts";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });

  try {
    const payload = await req.json();
    const recipientEmail = clean(payload.recipient_email || payload.to, 180);
    const templateKey = clean(payload.template_key, 80);
    if (!isEmail(recipientEmail) || !templateKey) {
      return json(400, { ok: false, message: "E-mailadres of template ontbreekt." });
    }
    await sendTemplateMail({
      recipientEmail,
      templateKey,
      variables: payload.variables || {},
      relatedBookingId: clean(payload.related_booking_id, 80) || null,
      relatedGalleryId: clean(payload.related_gallery_id, 80) || null,
      force: payload.force === true,
    });
    return json(200, { ok: true });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Mail versturen is niet gelukt." });
  }
};

export const config = { path: "/api/send-email" };
