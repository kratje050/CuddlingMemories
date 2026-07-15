import { clean, getAdminNotificationEmail, getSupabaseAdmin, isEmail, json, sendTemplateMailSafely } from "./email-utils.ts";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  try {
    const payload = await req.json();
    if (clean(payload.botField)) return json(200, { ok: true });
    const row = {
      mini_session_id: clean(payload.mini_session_id, 80),
      slot_id: clean(payload.slot_id, 80),
      customer_name: clean(payload.customer_name, 120),
      customer_email: clean(payload.customer_email, 180),
      message: clean(payload.message, 2500),
      status: "Nieuw",
    };
    if (!row.mini_session_id || !row.slot_id || !row.customer_name || !isEmail(row.customer_email)) {
      return json(400, { ok: false, message: "Kies een tijdslot en vul naam en e-mailadres in." });
    }
    const supabase = getSupabaseAdmin();
    const { data: slot, error: slotError } = await supabase
      .from("mini_session_slots")
      .select("*, mini_sessions(title,date)")
      .eq("id", row.slot_id)
      .eq("mini_session_id", row.mini_session_id)
      .maybeSingle();
    if (slotError) throw slotError;
    if (!slot || !slot.is_available || Number(slot.current_bookings || 0) >= Number(slot.max_bookings || 1)) {
      return json(409, { ok: false, message: "Dit tijdslot is helaas niet meer beschikbaar." });
    }
    const { error } = await supabase.from("mini_session_bookings").insert(row);
    if (error) throw error;
    await supabase
      .from("mini_session_slots")
      .update({ current_bookings: Number(slot.current_bookings || 0) + 1 })
      .eq("id", row.slot_id);
    const miniTitle = slot.mini_sessions?.title || "mini-shoot";
    await sendTemplateMailSafely({
        recipientEmail: row.customer_email,
        templateKey: "mini_session_confirmed",
        variables: { customer_name: row.customer_name, mini_session_title: miniTitle },
      }, "Mini-shootbevestiging versturen is mislukt");
    const adminEmail = getAdminNotificationEmail();
    if (adminEmail) {
      await sendTemplateMailSafely({
        recipientEmail: adminEmail,
        templateKey: "admin_mini_session_received",
        variables: {
          customer_name: row.customer_name,
          customer_email: row.customer_email,
          mini_session_title: miniTitle,
          booking_date: formatDate(slot.mini_sessions?.date),
          booking_time: `${String(slot.start_time).slice(0, 5)} - ${String(slot.end_time).slice(0, 5)}`,
          admin_link: `${new URL(req.url).origin}/admin/mini-sessions`,
        },
      }, "Adminmelding mini-shoot versturen is mislukt");
    }
    return json(200, { ok: true });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Mini-shoot aanvraag is niet gelukt." });
  }
};

export const config = { path: "/api/submit-mini-session-booking" };

function formatDate(value?: string | null) {
  if (!value) return "Niet ingevuld";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year.slice(-2)}` : "Niet ingevuld";
}
