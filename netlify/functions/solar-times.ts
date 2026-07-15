import SunCalc from "suncalc";

const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=86400" },
});

export default async (req: Request) => {
  if (req.method !== "GET") return json(405, { ok: false, message: "Alleen GET is toegestaan." });
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || "";
    const location = normalizeLocation(url.searchParams.get("location"));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json(400, { ok: false, message: "Ongeldige datum." });

    const params = new URLSearchParams({ name: location, count: "1", language: "nl", countryCode: "NL", format: "json" });
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
    if (!geoResponse.ok) throw new Error("Locatie zoeken is niet gelukt.");
    const geo = await geoResponse.json();
    const place = geo.results?.[0];
    if (!place) return json(404, { ok: false, message: "Locatie niet gevonden. Gebruik een plaatsnaam bij de boeking." });

    const times = SunCalc.getTimes(new Date(`${date}T12:00:00+02:00`), place.latitude, place.longitude);
    return json(200, {
      ok: true,
      location: [place.name, place.admin1].filter(Boolean).join(", "),
      sunrise: times.sunrise.toISOString(),
      sunset: times.sunset.toISOString(),
      morningGoldenHourStart: times.sunrise.toISOString(),
      morningGoldenHourEnd: times.goldenHourEnd.toISOString(),
      eveningGoldenHourStart: times.goldenHour.toISOString(),
      eveningGoldenHourEnd: times.sunset.toISOString(),
    });
  } catch (error) {
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Zontijden ophalen is niet gelukt." });
  }
};

function normalizeLocation(value: string | null) {
  const location = String(value || "").replace(/^Op locatie:\s*/i, "").trim();
  return !location || /bij mij thuis|zoutkamp/i.test(location) ? "Zoutkamp" : location;
}

export const config = { path: "/api/solar-times" };

