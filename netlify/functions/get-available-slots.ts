import { createClient } from "@supabase/supabase-js";
import { shootTypeOptions } from "../../src/lib/constants.js";

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
// van de get_available_slots()-databasefunctie doorgeeft (zie
// supabase/schema.sql) — nooit ruwe boekingsdata. availability_rules,
// shoot_type_settings, blocked_periods, manual_slots en bookings zijn allemaal
// admin-only in Supabase (RLS), dus deze functie gebruikt bewust de
// service-role key om die tabellen te mogen lezen.
export default async (req: Request) => {
  if (req.method !== "GET") {
    return json(405, { ok: false, message: "Alleen GET is toegestaan." });
  }

  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");
    const shootType = url.searchParams.get("shootType") || "";

    if (!shootTypeOptions.includes(shootType)) {
      return json(400, { ok: false, message: "Onbekend shoot-type." });
    }

    const supabase = getSupabaseAdmin();

    if (mode === "month") {
      const year = Number(url.searchParams.get("year"));
      const month = Number(url.searchParams.get("month"));
      if (!year || !month || month < 1 || month > 12) {
        return json(400, { ok: false, message: "Ongeldige maand." });
      }

      const { data, error } = await supabase.rpc("get_available_slots", {
        p_mode: "month",
        p_shoot_type: shootType,
        p_year: year,
        p_month: month,
      });
      if (error) throw new Error(error.message);
      return json(200, { ok: true, days: data?.days || {} });
    }

    if (mode === "day") {
      const date = url.searchParams.get("date") || "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return json(400, { ok: false, message: "Ongeldige datum." });
      }

      const { data, error } = await supabase.rpc("get_available_slots", {
        p_mode: "day",
        p_shoot_type: shootType,
        p_date: date,
      });
      if (error) throw new Error(error.message);
      return json(200, { ok: true, slots: data?.slots || [] });
    }

    return json(400, { ok: false, message: "Onbekende mode, gebruik 'month' of 'day'." });
  } catch (error) {
    console.error(error);
    return json(500, {
      ok: false,
      message: error instanceof Error ? error.message : "Beschikbaarheid ophalen is niet gelukt.",
    });
  }
};

export const config = {
  path: "/api/get-available-slots",
};
