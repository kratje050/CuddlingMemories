export function galleryPhotoUrl(photo, secureToken, variant = "medium") {
  const protectedSupabasePhoto = photo?.storage_provider === "supabase" && photo?.object_key;
  if (photo?.storage_provider !== "r2" && !protectedSupabasePhoto) return photo?.image_url || "";
  const params = new URLSearchParams({ photo: photo.id, token: secureToken, variant });
  return `/api/gallery-media?${params.toString()}`;
}

export function withGalleryPhotoUrl(photo, secureToken, variant = "medium") {
  return { ...photo, image_url: galleryPhotoUrl(photo, secureToken, variant) };
}
