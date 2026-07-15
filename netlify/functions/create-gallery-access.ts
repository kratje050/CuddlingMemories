import { clean, getSupabaseAdmin, json, sendTemplateMail } from "./email-utils.ts";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  try {
    const payload = await req.json();
    const galleryId = clean(payload.gallery_id, 80);
    if (!galleryId) return json(400, { ok: false, message: "Galerij ontbreekt." });
    const supabase = getSupabaseAdmin();
    const { data: gallery, error } = await supabase.from("client_galleries").select("*").eq("id", galleryId).maybeSingle();
    if (error) throw error;
    if (!gallery) return json(404, { ok: false, message: "Galerij niet gevonden." });
    const baseUrl = clean(payload.base_url, 300) || "https://cuddling-memories-fotografie.netlify.app";
    await sendTemplateMail({
      recipientEmail: gallery.client_email,
      templateKey: "gallery_ready",
      relatedGalleryId: gallery.id,
      force: payload.force === true,
      variables: {
        customer_name: gallery.client_name,
        gallery_link: `${baseUrl}/galerij/${gallery.secure_token}`,
        included_images: gallery.included_images,
      },
    });
    return json(200, { ok: true });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Galerijmail versturen is niet gelukt." });
  }
};

export const config = { path: "/api/create-gallery-access" };
