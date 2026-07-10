import type { Booking, BookingNote, DashboardStats, SupabaseLike } from "./types";

const startOfTodayIso = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const startOfWeekIso = () => {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const monthBounds = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
};

export async function getCurrentAdmin(supabase: SupabaseLike) {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { user: null, profile: null };

  const { data: profile, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !profile) return { user, profile: null };
  return { user, profile };
}

export async function requireAdmin(supabase: SupabaseLike) {
  const { user, profile } = await getCurrentAdmin(supabase);
  if (!user || !profile) throw new Error("Geen admin-toegang.");
  return { user, profile };
}

export async function getDashboardStats(supabase: SupabaseLike): Promise<DashboardStats> {
  await requireAdmin(supabase);
  const today = startOfTodayIso();
  const week = startOfWeekIso();
  const { start, end } = monthBounds();

  const [
    newToday,
    newThisWeek,
    openRequests,
    bookingsThisMonth,
    waitlist,
    giftcards,
    miniSessionBookings,
    galleriesWaiting,
    latestBookings,
  ] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", today),
    supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", week),
    supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", ["Nieuw", "Gelezen", "Contact opgenomen", "Wacht op reactie"]),
    supabase.from("bookings").select("id", { count: "exact", head: true }).gte("booking_date", start).lte("booking_date", end),
    supabase.from("waitlist_entries").select("id", { count: "exact", head: true }),
    supabase.from("giftcards").select("id", { count: "exact", head: true }),
    supabase.from("mini_session_bookings").select("id", { count: "exact", head: true }),
    supabase.from("client_galleries").select("id", { count: "exact", head: true }).in("status", ["Wacht op keuze klant", "Extra beelden aangevraagd"]),
    supabase.from("bookings").select("*, packages(id, title)").order("created_at", { ascending: false }).limit(5),
  ]);

  return {
    newToday: newToday.count || 0,
    newThisWeek: newThisWeek.count || 0,
    openRequests: openRequests.count || 0,
    bookingsThisMonth: bookingsThisMonth.count || 0,
    waitlist: waitlist.count || 0,
    giftcards: giftcards.count || 0,
    miniSessionBookings: miniSessionBookings.count || 0,
    galleriesWaiting: galleriesWaiting.count || 0,
    latestBookings: latestBookings.data || [],
  };
}

export async function listBookings(
  supabase: SupabaseLike,
  filters: { search?: string; status?: string; shootType?: string } = {}
): Promise<Booking[]> {
  await requireAdmin(supabase);
  let query = supabase.from("bookings").select("*, packages(id, title)").order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.shootType) query = query.eq("shoot_type", filters.shootType);
  if (filters.search) query = query.or(`customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getBookingDetail(supabase: SupabaseLike, bookingId: string): Promise<{ booking: Booking | null; notes: BookingNote[] }> {
  await requireAdmin(supabase);
  const [{ data: booking, error }, { data: notes }] = await Promise.all([
    supabase.from("bookings").select("*, packages(id, title)").eq("id", bookingId).maybeSingle(),
    supabase.from("booking_notes").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
  ]);
  if (error) throw error;
  return { booking, notes: notes || [] };
}

export async function updateBookingStatus(supabase: SupabaseLike, bookingId: string, newStatus: string, changedBy?: string | null) {
  await requireAdmin(supabase);
  const { data: current } = await supabase.from("bookings").select("status").eq("id", bookingId).maybeSingle();
  const oldStatus = current?.status ?? null;
  const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId);
  if (error) throw error;
  await supabase.from("booking_status_history").insert({
    booking_id: bookingId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: changedBy || "admin-app",
  });
}

export async function addBookingNote(supabase: SupabaseLike, bookingId: string, note: string, createdBy?: string | null) {
  await requireAdmin(supabase);
  const { error } = await supabase.from("booking_notes").insert({ booking_id: bookingId, note, created_by: createdBy || "admin-app" });
  if (error) throw error;
}
