import { CalendarDays, CloudSun, Droplets, Mail, MapPin, Sunrise, Sunset, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { getDaySlots } from "../../lib/bookingAvailability.js";
import { getBookingWeather, isOutdoorBooking } from "../../lib/weather.js";
import { formatDate } from "../../lib/formatDate.js";
import { formatSolarTime, getSolarTimes } from "../../lib/solar.js";

export default function BookingWeatherCard({ booking }) {
  const [weather, setWeather] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [solar, setSolar] = useState(null);
  const [solarError, setSolarError] = useState("");

  useEffect(() => {
    if (!isOutdoorBooking(booking?.shoot_type) || !booking?.booking_date) return;
    let active = true;
    setLoading(true);
    setError("");

    getBookingWeather(booking.location, booking.booking_date)
      .then(async (result) => {
        const candidates = result.days
          .filter((day) => day.date !== booking.booking_date && day.date > new Date().toISOString().slice(0, 10))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);
        const checked = await Promise.all(
          candidates.map(async (day) => {
            try {
              const slots = await getDaySlots(day.date, booking.shoot_type);
              return slots.length ? { ...day, slots } : null;
            } catch {
              return null;
            }
          })
        );
        if (active) {
          setWeather(result);
          setAlternatives(checked.filter(Boolean).slice(0, 3));
        }
      })
      .catch((weatherError) => active && setError(weatherError.message))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [booking?.booking_date, booking?.location, booking?.shoot_type]);

  useEffect(() => {
    if (!isOutdoorBooking(booking?.shoot_type) || !booking?.booking_date) return;
    let active = true;
    setSolarError("");
    getSolarTimes(booking.booking_date, booking.location)
      .then((result) => active && setSolar(result))
      .catch((solarFailure) => active && setSolarError(solarFailure.message));
    return () => { active = false; };
  }, [booking?.booking_date, booking?.location, booking?.shoot_type]);

  if (!isOutdoorBooking(booking?.shoot_type) || !booking?.booking_date) return null;

  return (
    <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linen text-cocoa"><CloudSun size={21} /></span>
        <div>
          <h2 className="display-title text-xl font-semibold text-coffee">Weersverwachting buitenshoot</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-coffee/60"><MapPin size={12} /> {weather?.location || booking.location || "Zoutkamp"}</p>
        </div>
      </div>

      {loading && <p className="mt-4 text-sm text-coffee/60">Weer en beschikbare alternatieven ophalen...</p>}
      {error && <p className="mt-4 rounded-lg bg-linen px-4 py-3 text-sm text-coffee/75">{error}</p>}
      {!loading && !error && !weather?.scheduled && (
        <p className="mt-4 rounded-lg bg-linen px-4 py-3 text-sm leading-6 text-coffee/75">Voor deze datum is nog geen betrouwbare verwachting beschikbaar. De weersverwachting loopt maximaal zestien dagen vooruit.</p>
      )}
      {weather?.scheduled && <WeatherDay day={weather.scheduled} title={formatDate(weather.scheduled.date)} featured />}

      {solar && (
        <div className="mt-4 rounded-lg border border-cocoa/15 bg-cream p-4">
          <p className="fine-label text-[0.62rem] font-semibold text-cocoa">Golden-hour planner · {formatDate(booking.booking_date)}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3"><Sunrise className="mt-0.5 text-cocoa" size={18} /><div><p className="text-sm font-semibold text-coffee">Ochtend</p><p className="mt-1 text-xs text-coffee/65">{formatSolarTime(solar.morningGoldenHourStart)} - {formatSolarTime(solar.morningGoldenHourEnd)}</p><p className="mt-1 text-[0.68rem] text-coffee/50">Zonsopkomst {formatSolarTime(solar.sunrise)}</p></div></div>
            <div className="flex items-start gap-3"><Sunset className="mt-0.5 text-cocoa" size={18} /><div><p className="text-sm font-semibold text-coffee">Avond</p><p className="mt-1 text-xs text-coffee/65">{formatSolarTime(solar.eveningGoldenHourStart)} - {formatSolarTime(solar.eveningGoldenHourEnd)}</p><p className="mt-1 text-[0.68rem] text-coffee/50">Zonsondergang {formatSolarTime(solar.sunset)}</p></div></div>
          </div>
        </div>
      )}
      {solarError && <p className="mt-3 text-xs leading-5 text-coffee/55">Golden hour kon niet worden berekend: {solarError}</p>}

      {!loading && alternatives.length > 0 && (
        <div className="mt-5 border-t border-cocoa/12 pt-5">
          <p className="fine-label text-[0.62rem] font-semibold text-cocoa">Beschikbare alternatieven met beter weer</p>
          <div className="mt-3 grid gap-3">
            {alternatives.map((day) => {
              const suggestedTime = day.slots[0]?.start || booking.start_time?.slice(0, 5) || "";
              const subject = encodeURIComponent(`Alternatieve datum voor je ${booking.shoot_type}`);
              const body = encodeURIComponent(`Hoi ${booking.customer_name},\n\nVoor je buitenshoot lijkt ${formatDate(day.date)} om ${suggestedTime} een mooi alternatief met een gunstigere weersverwachting. Zou deze datum voor jou passen?\n\nLiefs,\nCuddling Memories Fotografie`);
              return (
                <div key={day.date} className="rounded-lg border border-cocoa/15 bg-cream p-4">
                  <WeatherDay day={day} title={formatDate(day.date)} />
                  <a href={`mailto:${booking.customer_email}?subject=${subject}&body=${body}`} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cocoa hover:text-coffee">
                    <Mail size={14} /> Stel deze datum voor
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function WeatherDay({ day, title, featured = false }) {
  return (
    <div className={featured ? "mt-4 rounded-lg bg-linen p-4" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-semibold text-coffee"><CalendarDays size={15} className="text-cocoa" /> {title}</p>
        <p className="text-sm font-semibold text-cocoa">{day.description}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-coffee/70">
        <span>{Math.round(day.temperatureMin)}-{Math.round(day.temperatureMax)}°C</span>
        <span className="flex items-center gap-1"><Droplets size={13} /> {day.precipitationProbability ?? 0}% regen</span>
        <span className="flex items-center gap-1"><Wind size={13} /> {Math.round(day.windSpeed || 0)} km/u</span>
      </div>
    </div>
  );
}
