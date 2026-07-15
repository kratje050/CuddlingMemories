import { clean, getAdminNotificationEmail, getSupabaseAdmin, isEmail, json, sendTemplateMailSafely } from "./email-utils.ts";

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
    await sendTemplateMailSafely({
        recipientEmail: row.customer_email,
        templateKey: "waitlist_confirmed",
        variables: { customer_name: row.customer_name, shoot_type: row.shoot_type },
      }, "Wachtlijstbevestiging versturen is mislukt");
    const adminEmail = getAdminNotificationEmail();
    if (adminEmail) {
      await sendTemplateMailSafely({
        recipientEmail: adminEmail,
        templateKey: "admin_waitlist_received",
        variables: {
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          shoot_type: row.shoot_type,
          preferred_period: row.preferred_date ? formatDate(row.preferred_date) : row.preferred_month || row.flexibility,
          admin_link: `${new URL(req.url).origin}/admin/waitlist`,
        },
      }, "Adminmelding wachtlijst versturen is mislukt");
    }
    return json(200, { ok: true });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Wachtlijst aanmelden is niet gelukt." });
  }
};

export const config = { path: "/api/submit-waitlist" };

function formatDate(value: string) {
  const [year, month, day] = String(value || "").slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year.slice(-2)}` : "-";
}
