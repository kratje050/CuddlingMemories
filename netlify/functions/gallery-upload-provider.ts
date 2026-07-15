import type { Config } from "@netlify/functions";
import { json, PublicImageHttpError, requireAdmin } from "./_shared/public-image.ts";
import { GALLERY_MAX_UPLOAD_BYTES, getGalleryStorageProvider } from "./_shared/gallery-storage.ts";

export default async (req: Request) => {
  if (req.method !== "GET") return json(405, { ok: false, message: "Alleen GET is toegestaan." });
  try {
    await requireAdmin(req);
    return json(200, {
      ok: true,
      provider: getGalleryStorageProvider(req),
      max_bytes: GALLERY_MAX_UPLOAD_BYTES,
    });
  } catch (error) {
    const status = error instanceof PublicImageHttpError ? error.status : 500;
    return json(status, {
      ok: false,
      message: error instanceof Error ? error.message : "De opslagstatus kon niet worden opgehaald.",
    });
  }
};

export const config: Config = { path: "/api/gallery-upload-provider", method: ["GET"] };
