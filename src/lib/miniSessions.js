export const miniSessionStatuses = ["Concept", "Gepubliceerd", "Vol", "Gesloten", "Afgerond", "Verborgen"];
export const miniSessionBookingStatuses = ["Nieuw", "Bevestigd", "Wacht op betaling", "Betaald", "Geannuleerd", "Afgerond"];

export function slugifyMiniSession(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
