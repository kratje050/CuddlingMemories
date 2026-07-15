export async function sendTemplateEmail({ recipientEmail, templateKey, variables = {}, bookingId = null, galleryId = null }) {
  if (!recipientEmail || !templateKey) return { skipped: true };
  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient_email: recipientEmail,
      template_key: templateKey,
      related_booking_id: bookingId,
      related_gallery_id: galleryId,
      variables,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `Mail ${templateKey} versturen is mislukt.`);
  return body;
}
