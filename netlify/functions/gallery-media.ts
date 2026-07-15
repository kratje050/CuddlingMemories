import type { Config } from "@netlify/functions";
import { getSupabaseAdmin, json } from "./_shared/public-image.ts";
import { createR2ReadUrl } from "./_shared/r2.ts";

export default async (req: Request) => {
  if (req.method !== "GET") return json(405, { ok: false, message: "Alleen GET is toegestaan." });
  try {
    const url = new URL(req.url);
    const photoId = String(url.searchParams.get("photo") || "");
    const token = String(url.searchParams.get("token") || "");
    const variant = String(url.searchParams.get("variant") || "medium");
    if (!photoId || !token) return json(400, { ok: false, message: "Fotocode of galerijcode ontbreekt." });

    const supabase = getSupabaseAdmin();
    const { data: gallery } = await supabase.from("client_galleries")
      .select("id,status,is_published,expires_at")
      .eq("secure_token", token)
      .maybeSingle();
    if (!gallery || !gallery.is_published || ["Concept", "Verborgen", "Verlopen"].includes(gallery.status) || (gallery.expires_at && gallery.expires_at < new Date().toISOString().slice(0, 10))) {
      return json(404, { ok: false, message: "Deze galerij is niet beschikbaar." });
    }
    const { data: photo } = await supabase.from("gallery_photos")
      .select("id,gallery_id,storage_provider,object_key,thumbnail_key,medium_key")
      .eq("id", photoId)
      .eq("gallery_id", gallery.id)
      .maybeSingle();
    if (!photo || photo.storage_provider !== "r2") return json(404, { ok: false, message: "Foto niet gevonden." });
    const key = variant === "thumbnail" ? photo.thumbnail_key : variant === "full" ? photo.object_key : photo.medium_key || photo.object_key;
    if (!key) return json(404, { ok: false, message: "Afbeeldingsbestand ontbreekt." });
    const signedUrl = await createR2ReadUrl(key, 600);
    return new Response(null, { status: 302, headers: { Location: signedUrl, "Cache-Control": "private, no-store" } });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Foto openen is mislukt." });
  }
};

export const config: Config = { path: "/api/gallery-media", method: ["GET"] };
