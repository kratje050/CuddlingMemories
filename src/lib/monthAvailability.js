// Beschikbaarheid-per-maand: de statuslogica leeft volledig in Postgres
// (calculate_month_status()/get_months_status() in supabase/schema.sql) —
// dit bestand bevat bewust geen eigen berekeningen, alleen dunne wrappers.
//
// Publiek pad: via de Netlify Function /api/get-month-availability
// (service-role, filtert wat er publiek getoond mag worden).
// Admin pad: rechtstreekse RPC/Supabase-queries met de geauthenticeerde
// sessie (RLS/is_admin() beschermt dit al, net als de rest van de admin).
import { supabase } from "./supabaseClient.js";

const STATUS_LABELS = {
  no_bookings: "Genoeg plek",
  available: "Genoeg plek",
  limited: "Redelijk vol",
  almost_full: "Redelijk vol",
  full: "Vol",
  unavailable: "Vol",
};

const STATUS_STYLES = {
  no_bookings: { card: "border border-emerald-200 bg-emerald-50/70", badge: "border border-emerald-300 bg-emerald-100 text-emerald-800" },
  available: { card: "border border-emerald-200 bg-emerald-50/70", badge: "border border-emerald-300 bg-emerald-100 text-emerald-800" },
  limited: { card: "border border-amber-200 bg-amber-50/75", badge: "border border-amber-300 bg-amber-100 text-amber-800" },
  almost_full: { card: "border border-amber-200 bg-amber-50/75", badge: "border border-amber-300 bg-amber-100 text-amber-800" },
  full: { card: "border border-red-200 bg-red-50/75", badge: "border border-red-300 bg-red-100 text-red-800" },
  unavailable: { card: "border border-red-200 bg-red-50/75", badge: "border border-red-300 bg-red-100 text-red-800" },
};

const STATUS_GROUPS = {
  no_bookings: "green",
  available: "green",
  limited: "orange",
  almost_full: "orange",
  full: "red",
  unavailable: "red",
};

// Puur, geen netwerk — gebruikt door zowel publieke als admin-componenten.
export function getMonthStatusLabel(status) {
  return STATUS_LABELS[status] || "Onbekend";
}

export function getMonthStatusStyle(status) {
  return STATUS_STYLES[status] || STATUS_STYLES.unavailable;
}

export function getMonthStatusGroup(status) {
  return STATUS_GROUPS[status] || "red";
}

// --- Publiek -----------------------------------------------------------

// Geeft een array van maandstatussen terug, elk minimaal {year, month, status,
// message}. Aantallen/resterende plekken zitten er alleen bij als de admin
// dat expliciet publiek aangezet heeft (zie get-month-availability.ts).
export async function getMonthsAvailability(startYear, startMonth, count) {
  const params = new URLSearchParams({ startYear, startMonth });
  if (count) params.set("count", count);
  const response = await fetch(`/api/get-month-availability?${params.toString()}`);
  const body = await response.json();

  if (!response.ok || !body.ok) {
    throw new Error(body.message || "Beschikbaarheid ophalen is niet gelukt.");
  }

  return body.months || [];
}

// --- Admin (volledige details, rechtstreekse RPC/queries) --------------

export async function calculateMonthAvailability(year, month) {
  const { data, error } = await supabase.rpc("calculate_month_status", { p_year: year, p_month: month });
  if (error) throw error;
  return data;
}

export async function getRemainingSlotsForMonth(year, month) {
  const status = await calculateMonthAvailability(year, month);
  return { remaining: status.remaining, capacity: status.capacity };
}

// Haalt meerdere maanden in één keer op (rechtstreekse RPC, admin-sessie) —
// gebruikt door AdminMonthPlanning i.p.v. calculateMonthAvailability() per
// maand los aan te roepen.
export async function getMonthsStatusAdmin(startYear, startMonth, count = 12) {
  const { data, error } = await supabase.rpc("get_months_status", {
    p_start_year: startYear,
    p_start_month: startMonth,
    p_count: count,
  });
  if (error) throw error;
  return data?.months || [];
}

export async function getBookingsForMonth(year, month) {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(year, month, 0).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("bookings")
    .select("id, customer_name, shoot_type, status, booking_date, start_time")
    .gte("booking_date", monthStart)
    .lte("booking_date", monthEnd)
    .order("booking_date", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getBlockedDaysForMonth(year, month) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();
  const { data, error } = await supabase
    .from("blocked_periods")
    .select("id, title, reason, start_datetime, end_datetime, all_day, is_recurring")
    .lte("start_datetime", monthEnd)
    .gte("end_datetime", monthStart)
    .order("start_datetime", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Upsert van een handmatige maand-override — gebruikt door AdminMonthPlanning.
export async function saveMonthOverride(year, month, values) {
  const { error } = await supabase
    .from("monthly_availability_settings")
    .upsert({ year, month, ...values }, { onConflict: "year,month" });
  if (error) throw error;
}
