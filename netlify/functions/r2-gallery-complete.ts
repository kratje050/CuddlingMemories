import type { Config } from "@netlify/functions";
import { createHash } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { json, PublicImageHttpError, requireAdmin } from "./_shared/public-image.ts";
import { assertR2Key, bodyToBuffer, getR2Bucket, getR2Client, isR2GalleryEnabled, R2Variant, safeFilePart } from "./_shared/r2.ts";

const widths = [480, 960, 1600];
const maxBytes = 20 * 1024 * 1024;

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  let temporaryKey = "";
  const createdKeys: string[] = [];
  try {
    const { supabase, user } = await requireAdmin(req);
    if (!isR2GalleryEnabled()) return json(409, { ok: false, message: "R2-upload is nog niet ingeschakeld." });
    const payload = await req.json();
    const galleryId = String(payload.gallery_id || "");
    temporaryKey = assertR2Key(String(payload.temporary_key || ""), [`temporary/${user.id}/`]);
    const title = String(payload.title || "").trim().slice(0, 180);
    const sortOrder = Number(payload.sort_order || 0);
    if (!galleryId || galleryId === "undefined") return json(400, { ok: false, message: "Galerij ontbreekt." });

    const { data: gallery } = await supabase.from("client_galleries").select("id").eq("id", galleryId).maybeSingle();
    if (!gallery) return json(404, { ok: false, message: "Galerij niet gevonden." });

    const client = getR2Client();
    const source = await client.send(new GetObjectCommand({ Bucket: getR2Bucket(), Key: temporaryKey }));
    const input = await bodyToBuffer(source.Body);
    if (!input.length || input.length > maxBytes) return json(413, { ok: false, message: "Het tijdelijke bestand is leeg of groter dan 20 MB." });

    const base = sharp(input, { failOn: "error" }).rotate();
    const metadata = await base.metadata();
    if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(String(metadata.format))) {
      return json(400, { ok: false, message: "Het bestand is geen geldige JPG, PNG of WebP-afbeelding." });
    }

    const hash = createHash("sha256").update(input).digest("hex").slice(0, 20);
    const name = safeFilePart(title || "klantfoto");
    const variants: R2Variant[] = [];
    for (const requestedWidth of widths) {
      const width = Math.min(requestedWidth, metadata.width);
      const content = await sharp(input, { failOn: "error" })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: requestedWidth === 1600 ? 88 : 82, effort: 5 })
        .toBuffer();
      const info = await sharp(content).metadata();
      const key = `galleries/${galleryId}/${hash}/${name}-${requestedWidth}.webp`;
      await client.send(new PutObjectCommand({
        Bucket: getR2Bucket(),
        Key: key,
        Body: content,
        ContentType: "image/webp",
        CacheControl: "private, max-age=86400",
      }));
      createdKeys.push(key);
      variants.push({ key, width: info.width || width, height: info.height || 0, bytes: content.length });
    }

    const medium = variants.find((item) => item.key.endsWith("-960.webp")) || variants[0];
    const full = variants.find((item) => item.key.endsWith("-1600.webp")) || variants.at(-1)!;
    const thumbnail = variants.find((item) => item.key.endsWith("-480.webp")) || variants[0];
    const filename = `${name}-${hash}.webp`;
    const { data: photo, error: insertError } = await supabase.from("gallery_photos").insert({
      gallery_id: galleryId,
      title: title || name,
      filename,
      image_url: `r2://${full.key}`,
      storage_provider: "r2",
      object_key: full.key,
      thumbnail_key: thumbnail.key,
      medium_key: medium.key,
      image_width: full.width,
      image_height: full.height,
      image_variants: variants,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    }).select("*").single();
    if (insertError) throw insertError;

    // Alleen het tijdelijke staging-object wordt na een volledig geslaagde
    // verwerking verwijderd. Bestaande galerijbestanden blijven onaangeraakt.
    await client.send(new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: temporaryKey })).catch(() => undefined);
    return json(200, { ok: true, photo });
  } catch (error) {
    if (createdKeys.length) {
      try {
        const client = getR2Client();
        await Promise.all(createdKeys.map((key) => client.send(new DeleteObjectCommand({
          Bucket: getR2Bucket(),
          Key: key,
        })).catch(() => undefined)));
      } catch {
        // Een mislukte opruimactie mag de oorspronkelijke foutmelding niet verbergen.
      }
    }
    console.error("R2-galerijfoto verwerken mislukt:", error instanceof Error ? error.message : error);
    const status = error instanceof PublicImageHttpError ? error.status : 500;
    return json(status, { ok: false, message: error instanceof Error ? error.message : "De foto kon niet worden verwerkt." });
  }
};

export const config: Config = { path: "/api/r2-gallery-complete", method: ["POST"] };
