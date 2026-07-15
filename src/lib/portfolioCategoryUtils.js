export function parsePortfolioCategories(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatPortfolioCategories(categories) {
  return parsePortfolioCategories(categories).join(", ");
}

export function photoMatchesCategory(photo, category) {
  if (category === "Alles") return true;
  return parsePortfolioCategories(photo.categories || photo.category).includes(category);
}

export function applyDynamicAlbumCovers(albums, photos) {
  const firstPhotoByAlbum = new Map();

  photos.forEach((photo) => {
    if (!photo.image_url) return;
    const albumIds = Array.isArray(photo.album_ids) && photo.album_ids.length
      ? photo.album_ids
      : [photo.album_id].filter(Boolean);
    albumIds.forEach((albumId) => {
      if (!firstPhotoByAlbum.has(albumId)) firstPhotoByAlbum.set(albumId, photo);
    });
  });

  return albums.map((album) => {
    const firstPhoto = firstPhotoByAlbum.get(album.id);
    return {
      ...album,
      cover_image_url: firstPhoto?.image_url || album.cover_image_url,
      hasPhotos: Boolean(firstPhoto),
    };
  });
}
