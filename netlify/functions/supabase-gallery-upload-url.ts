import type { Config } from "@netlify/functions";
import { json, PublicImageHttpError, requireAdmin } from "./_shared/public-image.ts";
import {
  GALLERY_BUCKET,
  getGalleryStorageProvider,
  safeGalleryFilePart,
  validateGalleryUpload,
} from "./_shared/gallery-storage.ts";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  try {
    const { supabase, user } = await requireAdmin(req);
    if (getGalleryStorageProvider(req) !== "supabase-optimized") {
      return json(409, { ok: false, message: "De geoptimaliseerde Supabase-upload is niet ingeschakeld." });
    }

    const payload = await req.json();
    const galleryId = String(payload.gallery_id || "");
    let contentType = "";
    try {
      contentType = validateGalleryUpload(String(payload.content_type || ""), Number(payload.size || 0));
    } catch (error) {
      throw new PublicImageHttpError(400, error instanceof Error ? error.message : "Ongeldig afbeeldingsbestand.");
    }
    if (!galleryId || galleryId === "undefined") throw new PublicImageHttpError(400, "Galerij ontbreekt.");

    const { data: gallery } = await supabase.from("client_galleries").select("id").eq("id", galleryId).maybeSingle();
    if (!gallery) return json(404, { ok: false, message: "Galerij niet gevonden." });

    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const filePart = safeGalleryFilePart(String(payload.filename || "foto").replace(/\.[^.]+$/, ""));
    const temporaryPath = `temporary/${user.id}/${crypto.randomUUID()}/${filePart}.${extension}`;
    const { data, error } = await supabase.storage.from(GALLERY_BUCKET).createSignedUploadUrl(temporaryPath, { upsert: false });
    if (error || !data) throw error || new Error("De tijdelijke upload kon niet worden voorbereid.");

    return json(200, {
      ok: true,
      temporary_path: data.path,
      upload_token: data.token,
      expires_in: 7200,
    });
  } catch (error) {
    const status = error instanceof PublicImageHttpError ? error.status : 500;
    return json(status, {
      ok: false,
      message: error instanceof Error ? error.message : "Upload voorbereiden is mislukt.",
    });
  }
};

export const config: Config = { path: "/api/supabase-gallery-upload-url", method: ["POST"] };
