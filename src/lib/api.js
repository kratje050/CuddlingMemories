import { supabase } from "./supabaseClient.js";
import { resolvePublicImageUrl } from "../data/localPublicImages.js";

const single = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

const normalizeTravelFaq = (item) => {
  const question = String(item?.question || "").trim().toLowerCase();

  if (question === "hoe worden reiskosten berekend?" || question === "betaal ik extra voor een shoot op locatie?") {
    return {
      ...item,
      question: "Is een shoot op locatie bij de pakketprijs inbegrepen?",
      answer: "Ja. Een afspraak op locatie is inbegrepen in de pakketprijs; er worden hiervoor geen losse kosten toegevoegd.",
    };
  }

  if (question === "wat zit er in een pakket?") {
    return {
      ...item,
      answer: "Per pakket staat vermeld hoeveel digitale beelden zijn inbegrepen en wat de vanaf-prijs is. Extra beelden komen er alleen bij als je na de shoot zelf meer foto's kiest dan in het pakket zijn inbegrepen.",
    };
  }

  if (question === "kan ik extra beeld of reiskosten als losse shoot boeken?") {
    return {
      ...item,
      question: "Kan ik extra beelden als losse shoot boeken?",
      answer: "Nee, extra beelden zijn geen losse shoot. Je kunt ze na de shoot vanuit jouw online galerij bijbestellen.",
    };
  }

  return item;
};

export async function getSiteSettings() {
  const { data, error } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPage(slug) {
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPageSections(pageSlug) {
  const rows = await single(
    supabase
      .from("page_sections")
      .select("*")
      .eq("page_slug", pageSlug)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
  );
  return rows.map((row) => ({ ...row, content: resolvePublicImageUrl(row.content) }));
}

export async function getPortfolioAlbums() {
  const rows = await single(
    supabase
      .from("portfolio_albums")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
  );
  return rows.map(normalizeAlbumImage);
}

export async function getPortfolioAlbumBySlug(slug) {
  const { data, error } = await supabase
    .from("portfolio_albums")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeAlbumImage(data) : data;
}

export async function getPortfolioPhotos(albumId) {
  const [{ data: linkedRows, error: linkedError }, { data: primaryRows, error: primaryError }] = await Promise.all([
    supabase
      .from("portfolio_photo_albums")
      .select("photo_id, portfolio_photos(*)")
      .eq("album_id", albumId),
    supabase
      .from("portfolio_photos")
      .select("*")
      .eq("album_id", albumId),
  ]);

  if (primaryError) throw primaryError;

  // Combineer de nieuwe koppeltabel met het oude hoofdalbum. Hierdoor blijven
  // bestaande foto's ook tijdens en na de migratie zichtbaar.
  const photosById = new Map();
  (primaryRows || []).forEach((photo) => photosById.set(photo.id, photo));
  if (!linkedError) {
    (linkedRows || []).forEach((link) => {
      if (link.portfolio_photos) photosById.set(link.portfolio_photos.id, link.portfolio_photos);
    });
  }

  return [...photosById.values()]
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    .map((row) => normalizePhotoImage({ ...row, album_ids: [albumId] }));
}

export async function getAllPublishedPhotos() {
  const rows = await single(
    supabase
      .from("portfolio_photos")
      .select("*, portfolio_albums!portfolio_photos_album_id_fkey!inner(is_published)")
      .eq("portfolio_albums.is_published", true)
      .order("sort_order", { ascending: true })
  );
  const photoIds = rows.map((row) => row.id);
  if (!photoIds.length) return [];

  const { data: links, error: linksError } = await supabase
    .from("portfolio_photo_albums")
    .select("photo_id, album_id")
    .in("photo_id", photoIds);
  const albumIdsByPhoto = new Map();
  if (!linksError) {
    (links || []).forEach((link) => {
      const current = albumIdsByPhoto.get(link.photo_id) || [];
      current.push(link.album_id);
      albumIdsByPhoto.set(link.photo_id, current);
    });
  }

  return rows.map((row) => normalizePhotoImage({
    ...row,
    album_ids: albumIdsByPhoto.get(row.id) || [row.album_id].filter(Boolean),
  }));
}

export async function getFeaturedPhotos(limit = 6) {
  const rows = await single(
    supabase
      .from("portfolio_photos")
      .select("*, portfolio_albums!portfolio_photos_album_id_fkey!inner(is_published)")
      .eq("is_featured", true)
      .eq("portfolio_albums.is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit)
  );
  return rows.map(normalizePhotoImage);
}

const normalizeAlbumImage = (row) => ({ ...row, cover_image_url: resolvePublicImageUrl(row.cover_image_url) });
const normalizePhotoImage = (row) => ({ ...row, image_url: resolvePublicImageUrl(row.image_url) });

export async function getPublishedPackages() {
  const rows = await single(
    supabase
      .from("packages")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
  );
  return rows.filter((item) => item.price_unit !== "km" && String(item.slug || "").toLowerCase() !== "reiskosten");
}

export async function getVisibleTestimonials() {
  return single(
    supabase
      .from("testimonials")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
  );
}

export async function getVisibleFaqs() {
  const rows = await single(
    supabase
      .from("faq")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
  );
  return rows.map(normalizeTravelFaq);
}
