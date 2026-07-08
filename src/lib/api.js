import { supabase } from "./supabaseClient.js";

const single = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  return data;
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
  return single(
    supabase
      .from("page_sections")
      .select("*")
      .eq("page_slug", pageSlug)
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
  );
}

export async function getPortfolioAlbums() {
  return single(
    supabase
      .from("portfolio_albums")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
  );
}

export async function getPortfolioAlbumBySlug(slug) {
  const { data, error } = await supabase
    .from("portfolio_albums")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getPortfolioPhotos(albumId) {
  return single(
    supabase
      .from("portfolio_photos")
      .select("*")
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true })
  );
}

export async function getAllPublishedPhotos() {
  return single(
    supabase
      .from("portfolio_photos")
      .select("*, portfolio_albums!inner(is_published)")
      .eq("portfolio_albums.is_published", true)
      .order("sort_order", { ascending: true })
  );
}

export async function getFeaturedPhotos(limit = 6) {
  return single(
    supabase
      .from("portfolio_photos")
      .select("*, portfolio_albums!inner(is_published)")
      .eq("is_featured", true)
      .eq("portfolio_albums.is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit)
  );
}

export async function getPublishedPackages() {
  return single(
    supabase
      .from("packages")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
  );
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
  return single(
    supabase
      .from("faq")
      .select("*")
      .eq("is_visible", true)
      .order("sort_order", { ascending: true })
  );
}
