const FORECAST_DAILY = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "precipitation_sum",
  "wind_speed_10m_max",
  "sunshine_duration",
].join(",");

export function isOutdoorBooking(shootType) {
  const normalized = String(shootType || "").toLowerCase();
  return normalized.includes("buiten") || normalized.includes("outdoor");
}

export function weatherDescription(code) {
  if (code === 0) return "Onbewolkt";
  if ([1, 2].includes(code)) return "Licht bewolkt";
  if (code === 3) return "Bewolkt";
  if ([45, 48].includes(code)) return "Mist";
  if ([51, 53, 55, 56, 57].includes(code)) return "Motregen";
  if ([61, 63, 65, 66, 67].includes(code)) return "Regen";
  if ([71, 73, 75, 77].includes(code)) return "Sneeuw";
  if ([80, 81, 82].includes(code)) return "Regenbuien";
  if ([85, 86].includes(code)) return "Sneeuwbuien";
  if ([95, 96, 99].includes(code)) return "Onweer";
  return "Wisselvallig";
}

export function weatherScore(day) {
  const rainChance = Number(day.precipitationProbability || 0);
  const rain = Number(day.precipitation || 0);
  const wind = Number(day.windSpeed || 0);
  const sunshineHours = Number(day.sunshineDuration || 0) / 3600;
  return Math.round(100 - rainChance * 0.55 - rain * 8 - Math.max(0, wind - 15) * 1.2 + Math.min(sunshineHours, 8) * 2);
}

export async function getBookingWeather(location, bookingDate) {
  const searchLocation = normalizeLocation(location);
  const coordinates = await geocode(searchLocation);
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    daily: FORECAST_DAILY,
    timezone: "Europe/Amsterdam",
    forecast_days: "16",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!response.ok) throw new Error("De weersverwachting kon niet worden geladen.");
  const data = await response.json();
  const daily = data.daily || {};
  const days = (daily.time || []).map((date, index) => ({
    date,
    code: daily.weather_code?.[index],
    description: weatherDescription(daily.weather_code?.[index]),
    temperatureMax: daily.temperature_2m_max?.[index],
    temperatureMin: daily.temperature_2m_min?.[index],
    precipitationProbability: daily.precipitation_probability_max?.[index],
    precipitation: daily.precipitation_sum?.[index],
    windSpeed: daily.wind_speed_10m_max?.[index],
    sunshineDuration: daily.sunshine_duration?.[index],
  }));

  return {
    location: [coordinates.name, coordinates.admin1].filter(Boolean).join(", "),
    scheduled: days.find((day) => day.date === bookingDate) || null,
    days: days.map((day) => ({ ...day, score: weatherScore(day) })),
  };
}

function normalizeLocation(location) {
  const value = String(location || "").replace(/^Op locatie:\s*/i, "").trim();
  if (!value || /bij mij thuis|zoutkamp/i.test(value)) return "Zoutkamp";
  return value;
}

async function geocode(name) {
  const params = new URLSearchParams({ name, count: "1", language: "nl", countryCode: "NL", format: "json" });
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!response.ok) throw new Error("De locatie kon niet worden gevonden.");
  const data = await response.json();
  const result = data.results?.[0];
  if (!result) throw new Error("De locatie kon niet worden gevonden. Vul een plaatsnaam in bij de boeking.");
  return result;
}

