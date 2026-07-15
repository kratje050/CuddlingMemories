import type { Config } from "@netlify/functions";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { json, PublicImageHttpError, requireAdmin } from "./_shared/public-image.ts";
import {
  assertSupabaseGalleryPath,
  GALLERY_BUCKET,
  GALLERY_MAX_UPLOAD_BYTES,
  getGalleryStorageProvider,
  safeGalleryFilePart,
} from "./_shared/gallery-storage.ts";

type GalleryVariant = { key: string; width: number; height: number; bytes: number };
const widths = [480, 960, 1600];

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  let temporaryPath = "";
  let storageAdmin: Awaited<ReturnType<typeof requireAdmin>>["supabase"] | null = null;
  const createdPaths: string[] = [];

  try {
    const { supabase, user } = await requireAdmin(req);
    storageAdmin = supabase;
    const payload = await req.json();
    const galleryId = String(payload.gallery_id || "");
    temporaryPath = assertSupabaseGalleryPath(String(payload.temporary_path || ""), [`temporary/${user.id}/`]);
    const title = String(payload.title || "").trim().slice(0, 180);
    const sortOrder = Number(payload.sort_order || 0);
    if (getGalleryStorageProvider(req) !== "supabase-optimized") {
      throw new PublicImageHttpError(409, "De geoptimaliseerde Supabase-upload is niet ingeschakeld.");
    }
    if (!galleryId || galleryId === "undefined") throw new PublicImageHttpError(400, "Galerij ontbreekt.");

    const { data: gallery } = await supabase.from("client_galleries").select("id").eq("id", galleryId).maybeSingle();
    if (!gallery) throw new PublicImageHttpError(404, "Galerij niet gevonden.");

    const { data: source, error: downloadError } = await supabase.storage.from(GALLERY_BUCKET).download(temporaryPath);
    if (downloadError || !source) throw downloadError || new Error("Het tijdelijke bestand kon niet worden geopend.");
    const input = Buffer.from(await source.arrayBuffer());
    if (!input.length || input.length > GALLERY_MAX_UPLOAD_BYTES) {
      throw new PublicImageHttpError(413, "Het tijdelijke bestand is leeg of groter dan 20 MB.");
    }

    const metadata = await sharp(input, { failOn: "error" }).rotate().metadata();
    if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(String(metadata.format))) {
      throw new PublicImageHttpError(400, "Het bestand is geen geldige JPG, PNG of WebP-afbeelding.");
    }

    const contentHash = createHash("sha256").update(input).digest("hex").slice(0, 20);
    const uploadPart = temporaryPath.split("/")[2] || crypto.randomUUID();
    const group = `${contentHash}-${safeGalleryFilePart(uploadPart, "upload").slice(0, 12)}`;
    const name = safeGalleryFilePart(title || "klantfoto");
    const variants: GalleryVariant[] = [];

    for (const requestedWidth of widths) {
      const width = Math.min(requestedWidth, metadata.width);
      const { data: content, info } = await sharp(input, { failOn: "error" })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: requestedWidth === 1600 ? 88 : 82, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      const path = `optimized/${galleryId}/${group}/${name}-${requestedWidth}.webp`;
      const { error: uploadError } = await supabase.storage.from(GALLERY_BUCKET).upload(path, content, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      });
      if (uploadError) throw uploadError;
      createdPaths.push(path);
      variants.push({ key: path, width: info.width, height: info.height, bytes: content.length });
    }

    const thumbnail = variants.find((item) => item.key.endsWith("-480.webp")) || variants[0];
    const medium = variants.find((item) => item.key.endsWith("-960.webp")) || thumbnail;
    const full = variants.find((item) => item.key.endsWith("-1600.webp")) || variants.at(-1)!;
    const filename = `${name}-${contentHash}.webp`;
    const { data: photo, error: insertError } = await supabase.from("gallery_photos").insert({
      gallery_id: galleryId,
      title: title || name,
      filename,
      image_url: `supabase://${full.key}`,
      storage_provider: "supabase",
      object_key: full.key,
      thumbnail_key: thumbnail.key,
      medium_key: medium.key,
      image_width: full.width,
      image_height: full.height,
      image_variants: variants,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    }).select("*").single();
    if (insertError) throw insertError;

    // Dit verwijdert alleen het tijdelijke staging-bestand na een volledig
    // geslaagde verwerking. Bestaande klantfoto's blijven onaangeraakt.
    await supabase.storage.from(GALLERY_BUCKET).remove([temporaryPath]).catch(() => undefined);
    return json(200, { ok: true, photo });
  } catch (error) {
    const pathsToClean = [...createdPaths, ...(temporaryPath ? [temporaryPath] : [])];
    if (storageAdmin && pathsToClean.length) {
      try {
        await storageAdmin.storage.from(GALLERY_BUCKET).remove(pathsToClean);
      } catch {
        // Een mislukte opruimactie mag de oorspronkelijke fout niet verbergen.
      }
    }
    console.error("Supabase-galerijfoto verwerken mislukt:", error instanceof Error ? error.message : error);
    const status = error instanceof PublicImageHttpError ? error.status : 500;
    return json(status, {
      ok: false,
      message: error instanceof Error ? error.message : "De foto kon niet worden verwerkt.",
    });
  }
};

export const config: Config = { path: "/api/supabase-gallery-complete", method: ["POST"] };
