import type { Config } from "@netlify/functions";
import { json, PublicImageHttpError, requireAdmin } from "./_shared/public-image.ts";
import { createR2ReadUrl } from "./_shared/r2.ts";

type GalleryPhotoRow = {
  id: string;
  storage_provider: string;
  object_key: string | null;
  thumbnail_key: string | null;
  medium_key: string | null;
};

async function createMediaUrl(supabase: any, photo: GalleryPhotoRow, variant: string) {
  const key = variant === "thumbnail"
    ? photo.thumbnail_key || photo.medium_key || photo.object_key
    : variant === "full"
      ? photo.object_key
      : photo.medium_key || photo.object_key;
  if (!key) return "";
  if (photo.storage_provider === "r2") return createR2ReadUrl(key, 600);
  const { data, error } = await supabase.storage.from("client-galleries").createSignedUrl(key, 600);
  if (error) throw error;
  return data?.signedUrl || "";
}

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  try {
    const { supabase } = await requireAdmin(req);
    const payload = await req.json();
    const photoIds = [...new Set((Array.isArray(payload.photo_ids) ? payload.photo_ids : [])
      .map((id: unknown) => String(id || ""))
      .filter(Boolean))]
      .slice(0, 200);
    if (!photoIds.length) return json(200, { ok: true, urls: {} });

    const { data: photos, error } = await supabase.from("gallery_photos")
      .select("id,storage_provider,object_key,thumbnail_key,medium_key")
      .in("id", photoIds);
    if (error) throw error;

    const entries = await Promise.all((photos || [])
      .filter((photo: GalleryPhotoRow) => photo.object_key && ["supabase", "r2"].includes(photo.storage_provider))
      .map(async (photo: GalleryPhotoRow) => [photo.id, {
        thumbnail: await createMediaUrl(supabase, photo, "thumbnail"),
        medium: await createMediaUrl(supabase, photo, "medium"),
        full: await createMediaUrl(supabase, photo, "full"),
      }]));

    return json(200, { ok: true, urls: Object.fromEntries(entries) });
  } catch (error) {
    const status = error instanceof PublicImageHttpError ? error.status : 500;
    return json(status, {
      ok: false,
      message: error instanceof Error ? error.message : "De adminvoorbeelden konden niet worden geopend.",
    });
  }
};

export const config: Config = { path: "/api/gallery-admin-media-urls", method: ["POST"] };
