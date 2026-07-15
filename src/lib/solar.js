export async function getSolarTimes(date, location) {
  const params = new URLSearchParams({ date, location: location || "Zoutkamp" });
  const response = await fetch(`/api/solar-times?${params}`);
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.message || "Zontijden ophalen is niet gelukt.");
  return body;
}

export function formatSolarTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("nl-NL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Amsterdam" }).format(new Date(value));
}

