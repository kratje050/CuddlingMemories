import { clean, getSupabaseAdmin, json, sendTemplateMail } from "./email-utils.ts";

const readEnv = (name: string) => globalThis.Netlify?.env?.get(name) || "";

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });

  try {
    const payload = await req.json();
    const token = clean(payload.secure_token, 220);
    if (!token) return json(400, { ok: false, message: "Galerij ontbreekt." });

    const supabase = getSupabaseAdmin();
    const { data: gallery, error: galleryError } = await supabase
      .from("client_galleries")
      .select("*")
      .eq("secure_token", token)
      .maybeSingle();

    if (galleryError) throw galleryError;
    if (!gallery) return json(404, { ok: false, message: "Galerij niet gevonden." });

    const { data: selectedPhotos, error: photosError } = await supabase
      .from("gallery_photos")
      .select("title, filename, is_extra_requested, client_note")
      .eq("gallery_id", gallery.id)
      .eq("is_favorite", true)
      .order("sort_order", { ascending: true });

    if (photosError) throw photosError;

    const selected = selectedPhotos || [];
    const selectedCount = selected.length;
    const extraCount = selected.filter((photo) => photo.is_extra_requested).length;
    const selectedList =
      selected
        .map((photo, index) => {
          const name = photo.title || photo.filename || `Foto ${index + 1}`;
          const note = photo.client_note ? ` - notitie: ${photo.client_note}` : "";
          const extra = photo.is_extra_requested ? " (extra)" : "";
          return `${index + 1}. ${name}${extra}${note}`;
        })
        .join("\n") || "Geen foto's gekozen.";

    const baseUrl = clean(payload.base_url, 300) || "https://cuddling-memories-fotografie.netlify.app";
    const variables = {
      customer_name: gallery.client_name,
      gallery_title: gallery.title,
      selected_count: selectedCount,
      included_images: gallery.included_images || 0,
      extra_count: extraCount,
      extra_line: extraCount > 0 ? ` Je hebt ${extraCount} extra beeld(en) gekozen.` : "",
      selected_photos: selectedList,
      admin_link: `${baseUrl}/admin/galleries/${gallery.id}`,
    };

    await sendTemplateMail({
      recipientEmail: gallery.client_email,
      templateKey: "gallery_selection_received",
      relatedGalleryId: gallery.id,
      variables,
    });

    const adminEmail = readEnv("ADMIN_NOTIFICATION_EMAIL") || readEnv("MAIL_TO") || readEnv("SMTP_USER");
    if (adminEmail) {
      await sendTemplateMail({
        recipientEmail: adminEmail,
        templateKey: "admin_gallery_selection_received",
        relatedGalleryId: gallery.id,
        variables,
      });
    }

    return json(200, { ok: true });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Galerijkeuze mailen is niet gelukt." });
  }
};

export const config = { path: "/api/submit-gallery-selection" };
