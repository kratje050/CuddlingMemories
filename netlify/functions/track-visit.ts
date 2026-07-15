import { getSupabaseAdmin, json } from "./email-utils.ts";

const readEnv = (name: string) => globalThis.Netlify?.env?.get(name) || "";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false });

  try {
    const userAgent = req.headers.get("user-agent") || "";
    if (/bot|crawler|spider|slurp|preview/i.test(userAgent)) return json(200, { ok: true });

    const body = await req.json().catch(() => ({}));
    const visitorId = String(body.visitor_id || "").trim();
    const path = String(body.path || "/").slice(0, 240);
    const eventKey = String(body.event || "").trim();
    const allowedEvents = new Set(["packages_viewed", "booking_opened", "booking_started", "package_selected", "booking_completed"]);
    if (!/^[a-zA-Z0-9-]{16,80}$/.test(visitorId)) return json(400, { ok: false });
    if (/^\/(admin|galerij|klantportaal)(\/|$)/.test(path)) return json(200, { ok: true });

    const visitorHash = await sha256(`${readEnv("VISITOR_HASH_SALT") || "cuddling-memories-first-party"}|${visitorId}`);
    const now = new Date().toISOString();
    const visitDate = amsterdamDate();
    const supabase = getSupabaseAdmin();

    const { error: insertError } = await supabase.from("site_visitors").insert({
      visitor_hash: visitorHash,
      first_seen: now,
      last_seen: now,
      last_path: path,
    });
    if (insertError?.code === "23505") {
      const { error } = await supabase.from("site_visitors").update({ last_seen: now, last_path: path }).eq("visitor_hash", visitorHash);
      if (error) throw error;
    } else if (insertError) {
      throw insertError;
    }

    const { error: dayError } = await supabase.from("site_visitor_days").upsert({
      visitor_hash: visitorHash,
      visit_date: visitDate,
      last_seen: now,
    }, { onConflict: "visitor_hash,visit_date" });
    if (dayError) throw dayError;

    if (eventKey && allowedEvents.has(eventKey)) {
      const rawEventData = body.event_data && typeof body.event_data === "object" ? body.event_data : {};
      const eventData = eventKey === "package_selected" ? {
        package_id: String(rawEventData.package_id || "").slice(0, 80),
        package_name: String(rawEventData.package_name || "Onbekend pakket").slice(0, 160),
        package_names: Array.isArray(rawEventData.package_names) ? rawEventData.package_names.map((name: unknown) => String(name || "").slice(0, 160)).filter(Boolean).slice(0, 12) : [],
        shoot_type: String(rawEventData.shoot_type || "").slice(0, 100),
      } : {};
      const { error: eventError } = await supabase.from("site_conversion_events").upsert({
        visitor_hash: visitorHash,
        event_key: eventKey,
        event_data: eventData,
        last_seen: now,
      }, { onConflict: "visitor_hash,event_key" });
      if (eventError) throw eventError;
    }

    return json(200, { ok: true });
  } catch (error) {
    console.error("Bezoek registreren is mislukt:", error);
    return json(200, { ok: false });
  }
};

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function amsterdamDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export const config = { path: "/api/track-visit" };
