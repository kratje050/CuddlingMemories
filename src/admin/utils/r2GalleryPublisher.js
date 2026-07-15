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

export async function getR2GalleryUploadStatus() {
  const response = await fetch("/api/r2-gallery-upload-url", { headers: await authHeaders() });
  const result = await responseJson(response, "De opslagstatus kon niet worden opgehaald.");
  return result.enabled === true;
}

export async function uploadGalleryPhotoToR2({ galleryId, file, title, sortOrder }) {
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
