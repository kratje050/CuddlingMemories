import type { Config } from "@netlify/functions";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { json, PublicImageHttpError, requireAdmin } from "./_shared/public-image.ts";
import { getR2Bucket, getR2Client, isR2GalleryEnabled, safeFilePart } from "./_shared/r2.ts";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxBytes = 20 * 1024 * 1024;

export default async (req: Request) => {
  if (req.method === "GET") {
    try {
      await requireAdmin(req);
      return json(200, { ok: true, enabled: isR2GalleryEnabled(), max_bytes: maxBytes });
    } catch (error) {
      const status = error instanceof PublicImageHttpError ? error.status : 500;
      return json(status, { ok: false, message: error instanceof Error ? error.message : "R2-status ophalen is mislukt." });
    }
  }
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen GET en POST zijn toegestaan." });

  try {
    const { supabase, user } = await requireAdmin(req);
    if (!isR2GalleryEnabled()) return json(409, { ok: false, enabled: false, message: "R2-upload is nog niet ingeschakeld." });
    const payload = await req.json();
    const galleryId = String(payload.gallery_id || "");
    const contentType = String(payload.content_type || "").toLowerCase();
    const size = Number(payload.size || 0);
    if (!galleryId || galleryId === "undefined") return json(400, { ok: false, message: "Galerij ontbreekt." });
    if (!allowedTypes.has(contentType)) return json(400, { ok: false, message: "Alleen JPG, PNG en WebP zijn toegestaan." });
    if (!Number.isFinite(size) || size <= 0 || size > maxBytes) return json(413, { ok: false, message: "Een foto mag maximaal 20 MB groot zijn." });

    const { data: gallery } = await supabase.from("client_galleries").select("id").eq("id", galleryId).maybeSingle();
    if (!gallery) return json(404, { ok: false, message: "Galerij niet gevonden." });

    const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const uploadId = crypto.randomUUID();
    const filePart = safeFilePart(String(payload.filename || "foto").replace(/\.[^.]+$/, ""));
    const key = `temporary/${user.id}/${uploadId}/${filePart}.${extension}`;
    const uploadUrl = await getSignedUrl(getR2Client(), new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ContentType: contentType,
      CacheControl: "private, no-store",
      Metadata: { gallery: galleryId, uploader: user.id },
    }), { expiresIn: 600 });

    return json(200, { ok: true, enabled: true, upload_url: uploadUrl, temporary_key: key, expires_in: 600 });
  } catch (error) {
    const status = error instanceof PublicImageHttpError ? error.status : 500;
    return json(status, { ok: false, message: error instanceof Error ? error.message : "Upload voorbereiden is mislukt." });
  }
};

export const config: Config = { path: "/api/r2-gallery-upload-url", method: ["GET", "POST"] };
