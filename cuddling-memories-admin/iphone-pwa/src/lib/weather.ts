export type WeatherDay = {
  date: string;
  description: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationProbability: number;
  windSpeed: number;
  score: number;
};

export type BookingWeather = {
  location: string;
  scheduled: WeatherDay | null;
  days: WeatherDay[];
};

export function isOutdoorBooking(shootType?: string | null) {
  const value = String(shootType || "").toLowerCase();
  return value.includes("buiten") || value.includes("outdoor");
}

export async function getBookingWeather(location?: string | null, bookingDate?: string | null): Promise<BookingWeather> {
  const query = normalizeLocation(location);
  const geoParams = new URLSearchParams({ name: query, count: "1", language: "nl", countryCode: "NL", format: "json" });
  const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${geoParams}`);
  const geoData = await geoResponse.json();
  const place = geoData.results?.[0];
  if (!place) throw new Error("Locatie niet gevonden. Vul een plaatsnaam in bij de boeking.");

  const daily = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,sunshine_duration";
  const forecastParams = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), daily, timezone: "Europe/Amsterdam", forecast_days: "16" });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${forecastParams}`);
  if (!response.ok) throw new Error("Weersverwachting ophalen is niet gelukt.");
  const data = await response.json();
  const values = data.daily || {};
  const days: WeatherDay[] = (values.time || []).map((date: string, index: number) => {
    const rainChance = Number(values.precipitation_probability_max?.[index] || 0);
    const rain = Number(values.precipitation_sum?.[index] || 0);
    const wind = Number(values.wind_speed_10m_max?.[index] || 0);
    const sunshine = Number(values.sunshine_duration?.[index] || 0) / 3600;
    return {
      date,
      description: describeWeather(values.weather_code?.[index]),
      temperatureMax: Number(values.temperature_2m_max?.[index] || 0),
      temperatureMin: Number(values.temperature_2m_min?.[index] || 0),
      precipitationProbability: rainChance,
      windSpeed: wind,
      score: Math.round(100 - rainChance * 0.55 - rain * 8 - Math.max(0, wind - 15) * 1.2 + Math.min(sunshine, 8) * 2),
    };
  });
  return {
    location: [place.name, place.admin1].filter(Boolean).join(", "),
    scheduled: days.find((day) => day.date === bookingDate) || null,
    days,
  };
}

export async function hasAvailableSlots(date: string, shootType: string) {
  const params = new URLSearchParams({ mode: "day", date, shootType });
  const response = await fetch(`/api/get-available-slots?${params}`);
  const body = await response.json();
  return response.ok && body.ok && Array.isArray(body.slots) && body.slots.length > 0 ? body.slots : [];
}

export async function getSolarTimes(date: string, location?: string | null) {
  const params = new URLSearchParams({ date, location: location || "Zoutkamp" });
  const response = await fetch(`/api/solar-times?${params}`);
  const body = await response.json();
  if (!response.ok || !body.ok) throw new Error(body.message || "Zontijden ophalen is niet gelukt.");
  return body as Record<string, string>;
}

function normalizeLocation(location?: string | null) {
  const value = String(location || "").replace(/^Op locatie:\s*/i, "").trim();
  return !value || /bij mij thuis|zoutkamp/i.test(value) ? "Zoutkamp" : value;
}

function describeWeather(code: number) {
  if (code === 0) return "Onbewolkt";
  if ([1, 2].includes(code)) return "Licht bewolkt";
  if (code === 3) return "Bewolkt";
  if ([45, 48].includes(code)) return "Mist";
  if ([51, 53, 55, 56, 57].includes(code)) return "Motregen";
  if ([61, 63, 65, 66, 67].includes(code)) return "Regen";
  if ([80, 81, 82].includes(code)) return "Regenbuien";
  if ([95, 96, 99].includes(code)) return "Onweer";
  return "Wisselvallig";
}
