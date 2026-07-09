import { createClient } from "@supabase/supabase-js";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const readEnv = (name: string) => globalThis.Netlify?.env?.get(name) || "";

function getSupabaseAdmin() {
  const url = readEnv("VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    throw new Error("Supabase is nog niet ingesteld op de server.");
  }

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Publieke, ongeauthenticeerde endpoint die alleen het berekende resultaat
// van calculate_month_status()/get_months_status() doorgeeft (zie
// supabase/schema.sql) en zelf bepaalt welk deel van dat resultaat publiek
// zichtbaar mag zijn (booking_display_settings.show_booking_counts_publicly /
// show_exact_available_slots_publicly). internal_note, geblokkeerde-dagen-
// aantal en de admin-configuratievelden (manualStatus/isClosed/maxBookings)
// gaan nooit mee naar buiten.
export default async (req: Request) => {
  if (req.method !== "GET") {
    return json(405, { ok: false, message: "Alleen GET is toegestaan." });
  }

  try {
    const url = new URL(req.url);
    const now = new Date();
    const startYear = Number(url.searchParams.get("startYear")) || now.getFullYear();
    const startMonth = Number(url.searchParams.get("startMonth")) || now.getMonth() + 1;
    const requestedCount = Number(url.searchParams.get("count"));

    if (startMonth < 1 || startMonth > 12) {
      return json(400, { ok: false, message: "Ongeldige startmaand." });
    }

    const supabase = getSupabaseAdmin();

    const { data: display } = await supabase.from("booking_display_settings").select("*").limit(1).maybeSingle();
    const showCounts = Boolean(display?.show_booking_counts_publicly);
    const showSlots = Boolean(display?.show_exact_available_slots_publicly);
    const count = requestedCount > 0 ? requestedCount : Number(display?.months_ahead_to_show) || 12;

    const { data, error } = await supabase.rpc("get_months_status", {
      p_start_year: startYear,
      p_start_month: startMonth,
      p_count: count,
    });
    if (error) throw new Error(error.message);

    const months = (data?.months || []).map((month: Record<string, unknown>) => {
      const publicMonth: Record<string, unknown> = {
        year: month.year,
        month: month.month,
        status: month.status,
        message: month.message,
      };
      if (showSlots) {
        publicMonth.capacity = month.capacity;
        publicMonth.remaining = month.remaining;
        publicMonth.percentageRemaining = month.percentageRemaining;
      }
      if (showCounts) {
        publicMonth.occupied = month.occupied;
        publicMonth.totalRequests = month.totalRequests;
        publicMonth.confirmedCount = month.confirmedCount;
        publicMonth.pendingCount = month.pendingCount;
      }
      return publicMonth;
    });

    return json(200, { ok: true, months });
  } catch (error) {
    console.error(error);
    return json(500, {
      ok: false,
      message: error instanceof Error ? error.message : "Beschikbaarheid ophalen is niet gelukt.",
    });
  }
};

export const config = {
  path: "/api/get-month-availability",
};
