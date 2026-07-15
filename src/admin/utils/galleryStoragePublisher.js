import { supabase } from "../../lib/supabaseClient.js";

async function authHeaders(json = false) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Log opnieuw in als beheerder.");
  return { Authorization: `Bearer ${token}`, ...(json ? { "Content-Type": "application/json" } : {}) };
}

async function responseJson(response, fallback) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || fallback);
  return result;
}

export async function getGalleryUploadProvider() {
  const response = await fetch("/api/gallery-upload-provider", { headers: await authHeaders() });
  const result = await responseJson(response, "De opslagstatus kon niet worden opgehaald.");
  return result.provider || "supabase";
}

export async function getAdminGalleryPhotoUrls(photos) {
  const photoIds = photos
    .filter((photo) => photo?.object_key && ["supabase", "r2"].includes(photo?.storage_provider))
    .map((photo) => photo.id);
  if (!photoIds.length) return {};
  const response = await fetch("/api/gallery-admin-media-urls", {
    method: "POST",
    headers: await authHeaders(true),
    body: JSON.stringify({ photo_ids: photoIds }),
  });
  const result = await responseJson(response, "De beveiligde fotovoorbeelden konden niet worden geladen.");
  return result.urls || {};
}

async function uploadGalleryPhotoToR2({ galleryId, file, title, sortOrder }) {
  const prepared = await responseJson(await fetch("/api/r2-gallery-upload-url", {
    method: "POST",
    headers: await authHeaders(true),
    body: JSON.stringify({ gallery_id: galleryId, filename: file.name, content_type: file.type, size: file.size }),
  }), "De R2-upload kon niet worden voorbereid.");

  const uploadResponse = await fetch(prepared.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error("Het bestand kon niet veilig naar R2 worden geupload.");

  const completed = await responseJson(await fetch("/api/r2-gallery-complete", {
    method: "POST",
    headers: await authHeaders(true),
    body: JSON.stringify({ gallery_id: galleryId, temporary_key: prepared.temporary_key, title, sort_order: sortOrder }),
  }), "De afbeelding kon niet worden geoptimaliseerd.");
  return completed.photo;
}

async function uploadGalleryPhotoToSupabaseOptimized({ galleryId, file, title, sortOrder }) {
  const prepared = await responseJson(await fetch("/api/supabase-gallery-upload-url", {
    method: "POST",
    headers: await authHeaders(true),
    body: JSON.stringify({ gallery_id: galleryId, filename: file.name, content_type: file.type, size: file.size }),
  }), "De geoptimaliseerde upload kon niet worden voorbereid.");

  const { error: uploadError } = await supabase.storage.from("client-galleries").uploadToSignedUrl(
    prepared.temporary_path,
    prepared.upload_token,
    file,
    { contentType: file.type, cacheControl: "0", upsert: false },
  );
  if (uploadError) throw uploadError;

  const completed = await responseJson(await fetch("/api/supabase-gallery-complete", {
    method: "POST",
    headers: await authHeaders(true),
    body: JSON.stringify({ gallery_id: galleryId, temporary_path: prepared.temporary_path, title, sort_order: sortOrder }),
  }), "De afbeelding kon niet worden geoptimaliseerd.");
  return completed.photo;
}

export async function uploadGalleryPhotoOptimized({ provider, ...values }) {
  if (provider === "r2") return uploadGalleryPhotoToR2(values);
  if (provider === "supabase-optimized") return uploadGalleryPhotoToSupabaseOptimized(values);
  throw new Error("Voor deze opslagroute is geen geoptimaliseerde upload beschikbaar.");
}
