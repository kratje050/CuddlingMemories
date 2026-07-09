import { clean, getSupabaseAdmin, isEmail, json, sendTemplateMail } from "./email-utils.ts";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  try {
    const payload = await req.json();
    if (clean(payload.botField)) return json(200, { ok: true });
    const amountText = clean(payload.amount, 80);
    const amount = Number(amountText.replace(",", "."));
    const row = {
      purchaser_name: clean(payload.purchaser_name, 120),
      purchaser_email: clean(payload.purchaser_email, 180),
      recipient_name: clean(payload.recipient_name, 120),
      giftcard_type: clean(payload.giftcard_type, 80),
      amount: Number.isFinite(amount) ? amount : null,
      personal_message: clean(payload.personal_message, 2500),
      delivery_method: clean(payload.delivery_method, 80),
      internal_note: clean(payload.message, 2500),
      status: "Nieuw",
    };
    if (!row.purchaser_name || !isEmail(row.purchaser_email) || !row.recipient_name || !row.giftcard_type) {
      return json(400, { ok: false, message: "Vul alle verplichte cadeaubonvelden in." });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("giftcards").insert(row);
    if (error) throw error;
    try {
      await sendTemplateMail({
        recipientEmail: row.purchaser_email,
        templateKey: "giftcard_received",
        variables: { customer_name: row.purchaser_name, giftcard_amount: row.amount ? `EUR ${row.amount}` : row.giftcard_type },
      });
    } catch (mailError) {
      console.error("Cadeaubonmail versturen is mislukt:", mailError);
    }
    return json(200, { ok: true });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Cadeaubon aanvraag is niet gelukt." });
  }
};

export const config = { path: "/api/submit-giftcard-request" };
