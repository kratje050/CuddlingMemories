// Dunne client-wrapper rond /api/get-available-slots (zie
// netlify/functions/get-available-slots.ts). Bevat bewust geen eigen
// beschikbaarheidsregels — die leven allemaal in Postgres (get_available_slots()
// in supabase/schema.sql), zodat er precies één bron van waarheid is.
import { supabase } from "./supabaseClient.js";

// get_bookable_shoot_types() is een security-definer RPC die direct met de
// anon-key aangeroepen mag worden (geen Netlify Function nodig, zie schema.sql).
export async function getBookableShootTypes() {
  const { data, error } = await supabase.rpc("get_bookable_shoot_types");
  if (error) throw error;
  return data || [];
}

async function fetchAvailability(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/get-available-slots?${query}`);
  const body = await response.json();

  if (!response.ok || !body.ok) {
    throw new Error(body.message || "Beschikbaarheid ophalen is niet gelukt.");
  }

  return body;
}

// Geeft per dag ("YYYY-MM-DD") de status terug: "available" | "full" | "blocked" | "closed".
export async function getMonthAvailability(year, month, shootType) {
  const body = await fetchAvailability({ mode: "month", year, month, shootType });
  return body.days || {};
}

// Geeft de vrije tijdslots voor één datum terug: [{ start: "10:00", end: "11:00" }, ...].
export async function getDaySlots(date, shootType) {
  const body = await fetchAvailability({ mode: "day", date, shootType });
  return body.slots || [];
}
