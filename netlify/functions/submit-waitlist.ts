import { clean, getSupabaseAdmin, isEmail, json, sendTemplateMail } from "./email-utils.ts";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  try {
    const payload = await req.json();
    if (clean(payload.botField)) return json(200, { ok: true });
    const row = {
      customer_name: clean(payload.customer_name, 120),
      customer_email: clean(payload.customer_email, 180),
      shoot_type: clean(payload.shoot_type, 80),
      preferred_date: clean(payload.preferred_date, 10) || null,
      preferred_month: clean(payload.preferred_month, 7) || null,
      flexibility: clean(payload.flexibility, 80),
      message: clean(payload.message, 2500),
      status: "Nieuw",
    };
    if (!row.customer_name || !isEmail(row.customer_email) || !row.shoot_type || !row.flexibility) {
      return json(400, { ok: false, message: "Vul naam, e-mailadres, shoot en flexibiliteit in." });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("waitlist_entries").insert(row);
    if (error) throw error;
    try {
      await sendTemplateMail({
        recipientEmail: row.customer_email,
        templateKey: "waitlist_confirmed",
        variables: { customer_name: row.customer_name, shoot_type: row.shoot_type },
      });
    } catch (mailError) {
      console.error("Wachtlijstmail versturen is mislukt:", mailError);
    }
    return json(200, { ok: true });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Wachtlijst aanmelden is niet gelukt." });
  }
};

export const config = { path: "/api/submit-waitlist" };
