import { getSupabaseAdmin, sendTemplateMailSafely } from "./email-utils.ts";

type WaitlistEntry = {
  id: string;
  customer_name: string;
  customer_email: string;
  shoot_type: string;
  preferred_date: string | null;
  preferred_month: string | null;
  flexibility: string | null;
  status: string;
  invitation_count: number | null;
};

type Slot = { start: string; end: string };
type Offer = { date: string; slot: Slot };

export default async () => {
  const supabase = getSupabaseAdmin();
  const now = new Date();
  const nowIso = now.toISOString();

  // Een verlopen uitnodiging gaat terug naar de actieve wachtlijst, zodat de
  // volgende passende persoon bij een volgende controle aan de beurt kan komen.
  const { error: expireError } = await supabase
    .from("waitlist_entries")
    .update({
      status: "Nieuw",
      invitation_token: null,
      invitation_sent_at: null,
      invitation_expires_at: null,
      offered_date: null,
      offered_start_time: null,
      offered_end_time: null,
    })
    .eq("status", "Benaderd")
    .not("invitation_token", "is", null)
    .lt("invitation_expires_at", nowIso);
  if (expireError) throw expireError;

  const { data: activeOffers, error: activeError } = await supabase
    .from("waitlist_entries")
    .select("shoot_type")
    .eq("status", "Benaderd")
    .not("invitation_token", "is", null)
    .gt("invitation_expires_at", nowIso);
  if (activeError) throw activeError;

  // Per shoot-type wordt steeds maar een persoon tegelijk benaderd. Daarmee
  // voorkom je dat meerdere klanten denken dat dezelfde vrijgekomen plek voor hen is.
  const shootTypesWithActiveOffer = new Set((activeOffers || []).map((row) => row.shoot_type));
  const { data: entries, error: entriesError } = await supabase
    .from("waitlist_entries")
    .select("id,customer_name,customer_email,shoot_type,preferred_date,preferred_month,flexibility,status,invitation_count")
    .in("status", ["Nieuw", "Bekeken"])
    .eq("auto_contact_enabled", true)
    .is("invitation_token", null)
    .order("created_at", { ascending: true });
  if (entriesError) throw entriesError;

  const monthCache = new Map<string, Record<string, string>>();
  let sent = 0;
  let checked = 0;

  for (const entry of (entries || []) as WaitlistEntry[]) {
    if (shootTypesWithActiveOffer.has(entry.shoot_type)) continue;
    checked += 1;

    const offer = await findOffer(supabase, entry, monthCache);
    if (!offer) continue;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const { data: claimed, error: claimError } = await supabase
      .from("waitlist_entries")
      .update({
        status: "Benaderd",
        invitation_token: token,
        invitation_sent_at: nowIso,
        invitation_expires_at: expiresAt.toISOString(),
        offered_date: offer.date,
        offered_start_time: offer.slot.start,
        offered_end_time: offer.slot.end,
        invitation_count: Number(entry.invitation_count || 0) + 1,
      })
      .eq("id", entry.id)
      .in("status", ["Nieuw", "Bekeken"])
      .is("invitation_token", null)
      .select("id")
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) continue;

    const month = offer.date.slice(0, 7);
    const bookingLink = `${siteUrl()}/boek-een-shoot?shoot=${encodeURIComponent(entry.shoot_type)}&maand=${month}&aanbod=${encodeURIComponent(token)}`;
    const result = await sendTemplateMailSafely({
      recipientEmail: entry.customer_email,
      templateKey: "waitlist_slot_available",
      variables: {
        customer_name: entry.customer_name,
        shoot_type: entry.shoot_type,
        offered_date: formatDate(offer.date),
        offered_start_time: offer.slot.start.slice(0, 5),
        offered_end_time: offer.slot.end.slice(0, 5),
        offer_expires_at: formatDateTime(expiresAt),
        booking_link: bookingLink,
      },
    }, "Automatische wachtlijstuitnodiging versturen is mislukt");

    if (!result?.ok) {
      await supabase.from("waitlist_entries").update({
        status: entry.status,
        invitation_token: null,
        invitation_sent_at: null,
        invitation_expires_at: null,
        offered_date: null,
        offered_start_time: null,
        offered_end_time: null,
      }).eq("id", entry.id).eq("invitation_token", token);
      continue;
    }

    shootTypesWithActiveOffer.add(entry.shoot_type);
    sent += 1;
  }

  return new Response(JSON.stringify({ ok: true, checked, sent }), {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};

async function findOffer(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  entry: WaitlistEntry,
  monthCache: Map<string, Record<string, string>>
): Promise<Offer | null> {
  const today = dateInAmsterdam();
  const months = candidateMonths(entry, today);
  const weekRange = entry.preferred_date && entry.flexibility === "Zelfde week mag ook"
    ? mondayToSunday(entry.preferred_date)
    : null;

  for (const month of months) {
    const cacheKey = `${entry.shoot_type}|${month}`;
    let days = monthCache.get(cacheKey);
    if (!days) {
      const [year, monthNumber] = month.split("-").map(Number);
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_mode: "month",
        p_shoot_type: entry.shoot_type,
        p_year: year,
        p_month: monthNumber,
      });
      if (error) {
        console.error(`Beschikbaarheid voor ${entry.shoot_type} kon niet worden gecontroleerd:`, error);
        continue;
      }
      days = data?.days || {};
      monthCache.set(cacheKey, days);
    }

    const availableDates = Object.entries(days)
      .filter(([date, status]) => status === "available" && date >= today)
      .map(([date]) => date)
      .filter((date) => {
        if (!entry.preferred_date) return true;
        if (entry.flexibility === "Alleen deze datum") return date === entry.preferred_date;
        if (weekRange) return date >= weekRange.start && date <= weekRange.end;
        if (entry.flexibility === "Zelfde maand mag ook") return date.slice(0, 7) === entry.preferred_date.slice(0, 7);
        return true;
      })
      .sort();

    for (const date of availableDates) {
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_mode: "day",
        p_shoot_type: entry.shoot_type,
        p_date: date,
      });
      if (error) continue;
      const slot = (data?.slots || [])[0] as Slot | undefined;
      if (slot?.start && slot?.end) return { date, slot };
    }
  }
  return null;
}

function candidateMonths(entry: WaitlistEntry, today: string) {
  const currentMonth = today.slice(0, 7);
  const preferredMonth = /^\d{4}-\d{2}$/.test(entry.preferred_month || "")
    ? String(entry.preferred_month)
    : entry.preferred_date?.slice(0, 7) || currentMonth;

  if (entry.flexibility === "Alleen deze datum" || entry.flexibility === "Zelfde maand mag ook") {
    return preferredMonth >= currentMonth ? [preferredMonth] : [];
  }

  if (entry.flexibility === "Zelfde week mag ook" && entry.preferred_date) {
    const range = mondayToSunday(entry.preferred_date);
    return [...new Set([range.start.slice(0, 7), range.end.slice(0, 7)])].filter((month) => month >= currentMonth);
  }

  const start = preferredMonth >= currentMonth ? preferredMonth : currentMonth;
  return Array.from({ length: 6 }, (_, index) => addMonths(start, index));
}

function mondayToSunday(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  const daysSinceMonday = (value.getUTCDay() + 6) % 7;
  return { start: addDays(date, -daysSinceMonday), end: addDays(date, 6 - daysSinceMonday) };
}

function addDays(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const value = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dateInAmsterdam() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: "Europe/Amsterdam", day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(value);
}

function siteUrl() {
  return globalThis.Netlify?.env?.get("URL") || "https://cuddlingmemories.nl";
}

export const config = { schedule: "*/15 * * * *" };
