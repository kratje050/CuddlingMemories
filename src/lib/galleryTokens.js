export function createSecureToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function galleryUrl(token) {
  return `${window.location.origin}/galerij/${token}`;
}
