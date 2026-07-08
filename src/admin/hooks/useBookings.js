import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";

export function useBookings({
  status = "",
  shootType = "",
  packageId = "",
  search = "",
  dateFrom = "",
  dateTo = "",
  sort = "newest",
} = {}) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    let query = supabase.from("bookings").select("*, packages(id, title)");

    if (status) query = query.eq("status", status);
    if (shootType) query = query.eq("shoot_type", shootType);
    if (packageId) query = query.eq("package_id", packageId);
    if (search) query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);

    if (sort === "shoot_date") query = query.order("booking_date", { ascending: true, nullsFirst: false });
    else query = query.order("created_at", { ascending: sort === "oldest" });

    const { data, error: queryError } = await query;
    if (queryError) {
      setError(queryError.message);
      setBookings([]);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  }, [status, shootType, packageId, search, dateFrom, dateTo, sort]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { bookings, loading, error, reload };
}

export async function updateBookingStatus(bookingId, newStatus, changedBy) {
  const { data: current } = await supabase.from("bookings").select("status").eq("id", bookingId).maybeSingle();
  const oldStatus = current?.status ?? null;

  const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId);
  if (error) throw error;

  await supabase.from("booking_status_history").insert({
    booking_id: bookingId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: changedBy,
  });
}

export async function addBookingNote(bookingId, note, createdBy) {
  const { error } = await supabase
    .from("booking_notes")
    .insert({ booking_id: bookingId, note, created_by: createdBy });
  if (error) throw error;
}

export async function toggleBookingImportant(bookingId, isImportant) {
  const { error } = await supabase.from("bookings").update({ is_important: isImportant }).eq("id", bookingId);
  if (error) throw error;
}

export async function deleteBooking(bookingId) {
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  if (error) throw error;
}

export async function getBookingDetail(bookingId) {
  const [{ data: booking, error: bookingError }, { data: notes }, { data: history }] = await Promise.all([
    supabase.from("bookings").select("*, packages(id, title)").eq("id", bookingId).maybeSingle(),
    supabase.from("booking_notes").select("*").eq("booking_id", bookingId).order("created_at", { ascending: false }),
    supabase
      .from("booking_status_history")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false }),
  ]);

  if (bookingError) throw bookingError;

  return { booking, notes: notes || [], history: history || [] };
}
