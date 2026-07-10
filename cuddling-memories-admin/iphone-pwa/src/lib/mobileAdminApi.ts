import { requireAdmin } from "@shared/index";
import { supabase } from "./supabase";

export type MonthStatus = {
  year: number;
  month: number;
  status: string;
  message?: string | null;
  occupied?: number | null;
  capacity?: number | null;
  remaining?: number | null;
};

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  message?: string | null;
  related_type?: string | null;
  related_id?: string | null;
  is_read: boolean;
  created_at: string;
};

export type AdminRow = Record<string, unknown> & { id?: string };

export type GalleryPhoto = {
  id: string;
  gallery_id: string;
  title?: string | null;
  filename?: string | null;
  image_url: string;
  sort_order: number;
  is_favorite?: boolean | null;
  client_note?: string | null;
  created_at?: string | null;
};

export type PortfolioAlbum = {
  id: string;
  title: string;
  category?: string | null;
};

const monthNames = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];

export function formatMonthName(month: number) {
  return monthNames[month - 1] || String(month);
}

export function getMonthBadge(status: string) {
  if (["full", "unavailable"].includes(status)) return "Vol";
  if (["limited", "almost_full"].includes(status)) return "Beperkt beschikbaar";
  return "Beschikbaar";
}

export function getMonthText(status: string) {
  if (["full", "unavailable"].includes(status)) return "Deze maand zit vol of is gesloten.";
  if (["limited", "almost_full"].includes(status)) return "Er zijn nog enkele plekken beschikbaar.";
  return "Er zijn nog plekken beschikbaar.";
}

export async function getMobileMonthStatuses(count = 12): Promise<MonthStatus[]> {
  await requireAdmin(supabase as any);
  const now = new Date();
  const { data, error } = await (supabase as any).rpc("get_months_status", {
    p_start_year: now.getFullYear(),
    p_start_month: now.getMonth() + 1,
    p_count: count,
  });
  if (error) throw error;
  return data?.months || [];
}

export async function getNotifications(): Promise<NotificationRow[]> {
  await requireAdmin(supabase as any);
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return data || [];
}

export async function markNotificationRead(id: string, isRead = true) {
  await requireAdmin(supabase as any);
  const { error } = await supabase.from("notifications").update({ is_read: isRead }).eq("id", id);
  if (error) throw error;
}

export async function listAdminRows(table: string, orderBy = "created_at", ascending = false): Promise<AdminRow[]> {
  await requireAdmin(supabase as any);
  const query = supabase.from(table).select("*").order(orderBy, { ascending }).limit(50);
  const { data, error } = await query;
  if (!error) return data || [];

  const fallback = await supabase.from(table).select("*").limit(50);
  if (fallback.error) throw fallback.error;
  return fallback.data || [];
}

export async function createAdminRow(table: string, payload: AdminRow): Promise<AdminRow> {
  await requireAdmin(supabase as any);
  const { data, error } = await supabase.from(table).insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function updateAdminRow(table: string, id: string, payload: AdminRow): Promise<AdminRow> {
  await requireAdmin(supabase as any);
  const { data, error } = await supabase.from(table).update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteAdminRow(table: string, id: string) {
  await requireAdmin(supabase as any);
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function listGalleryPhotos(galleryId: string): Promise<GalleryPhoto[]> {
  await requireAdmin(supabase as any);
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("gallery_id", galleryId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function uploadGalleryPhotos(galleryId: string, files: File[], startOrder = 0): Promise<number> {
  await requireAdmin(supabase as any);
  if (!galleryId || galleryId === "undefined") throw new Error("Sla de galerij eerst op voordat je foto's uploadt.");
  if (!files.length) return 0;

  const rows = [];
  for (const [index, file] of files.entries()) {
    const safeName = `${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const path = `${galleryId}/${safeName}`;
    const { error: uploadError } = await supabase.storage.from("client-galleries").upload(path, file);
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from("client-galleries").getPublicUrl(path);
    rows.push({
      gallery_id: galleryId,
      title: file.name,
      filename: file.name,
      image_url: publicData.publicUrl,
      sort_order: startOrder + index,
    });
  }

  const { error } = await supabase.from("gallery_photos").insert(rows);
  if (error) throw error;
  return rows.length;
}

export async function deleteGalleryPhoto(photoId: string) {
  await requireAdmin(supabase as any);
  const { error } = await supabase.from("gallery_photos").delete().eq("id", photoId);
  if (error) throw error;
}

export async function listPortfolioAlbums(): Promise<PortfolioAlbum[]> {
  await requireAdmin(supabase as any);
  const { data, error } = await supabase
    .from("portfolio_albums")
    .select("id, title, category")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function uploadPortfolioPhotos(values: {
  albumId: string;
  category?: string;
  title?: string;
  altText: string;
  sortOrder?: number;
  files: File[];
}): Promise<number> {
  await requireAdmin(supabase as any);
  if (!values.albumId) throw new Error("Kies eerst een album.");
  if (!values.altText.trim()) throw new Error("Vul een alt-tekst in.");
  if (!values.files.length) return 0;

  const rows = [];
  for (const [index, file] of values.files.entries()) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${values.albumId}/${Date.now()}-${index}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file);
    if (uploadError) throw uploadError;

    const imageUrl = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
    rows.push({
      album_id: values.albumId,
      category: values.category || null,
      title: values.files.length === 1 && values.title ? values.title : file.name,
      alt_text: values.files.length === 1 ? values.altText.trim() : `${values.altText.trim()} ${index + 1}`,
      sort_order: Number(values.sortOrder || 0) + index,
      image_url: imageUrl,
      is_featured: false,
    });
  }

  const { error } = await supabase.from("portfolio_photos").insert(rows);
  if (error) throw error;
  return rows.length;
}

export function createSecureToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function formatAdminValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "Ja" : "Nee";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const [year, month, day] = value.slice(0, 10).split("-");
      return `${day}-${month}-${year}`;
    }
    return value;
  }
  return "";
}
