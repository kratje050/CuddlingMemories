import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, CalendarCheck, ChevronDown, MousePointerClick, PackageOpen } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";

const stages = [
  { key: "packages_viewed", label: "Pakketten bekeken", description: "Unieke bezoekers van de pakkettenpagina", icon: PackageOpen },
  { key: "booking_opened", label: "Boekingspagina geopend", description: "Unieke bezoekers die boeken openden", icon: MousePointerClick },
  { key: "booking_started", label: "Stap 1 begonnen", description: "Bezoekers die een shoot kozen", icon: BarChart3 },
  { key: "booking_completed", label: "Boeking verstuurd", description: "Bezoekers met een afgeronde aanvraag", icon: CalendarCheck },
];

const periods = [
  { value: "7", label: "7 dagen" },
  { value: "30", label: "30 dagen" },
  { value: "90", label: "90 dagen" },
  { value: "all", label: "Alles" },
];

export default function ConversionOverview() {
  const [rows, setRows] = useState([]);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const mobilePackageDetailsRef = useRef(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("site_conversion_events")
      .select("visitor_hash,event_key,event_data,last_seen")
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        setRows(data || []);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!showPackageDetails || !window.matchMedia("(max-width: 767px)").matches) return;
    const timer = window.setTimeout(() => {
      mobilePackageDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [showPackageDetails]);

  const filteredRows = useMemo(() => {
    const since = period === "all" ? null : Date.now() - Number(period) * 24 * 60 * 60 * 1000;
    return since ? rows.filter((row) => new Date(row.last_seen).getTime() >= since) : rows;
  }, [rows, period]);

  const counts = useMemo(() => Object.fromEntries(stages.map((stage) => [stage.key, new Set(filteredRows.filter((row) => row.event_key === stage.key).map((row) => row.visitor_hash)).size])), [filteredRows]);

  const packageChoices = useMemo(() => {
    const grouped = new Map();
    filteredRows.filter((row) => row.event_key === "package_selected").forEach((row) => {
      const names = Array.isArray(row.event_data?.package_names) && row.event_data.package_names.length
        ? row.event_data.package_names
        : [row.event_data?.package_name || "Onbekend pakket"];
      names.forEach((name) => {
        const current = grouped.get(name) || { name, shootType: row.event_data?.shoot_type || "", visitors: new Set() };
        current.visitors.add(row.visitor_hash);
        grouped.set(name, current);
      });
    });
    return [...grouped.values()].map((item) => ({ ...item, count: item.visitors.size })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "nl"));
  }, [filteredRows]);

  const maximum = Math.max(1, ...Object.values(counts));
  const completed = counts.booking_completed || 0;
  const started = counts.booking_started || 0;
  const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

  return (
    <section className="mt-6 rounded-lg bg-card p-5 shadow-soft warm-border md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="fine-label text-cocoa">Bezoekers naar boeking</p>
          <h2 className="display-title mt-1 text-2xl font-semibold text-coffee">Conversieoverzicht</h2>
          <p className="mt-1 text-sm leading-6 text-coffee/60">Elke bezoeker wordt per stap één keer geteld. Privépagina's en bots tellen niet mee.</p>
        </div>
        <label className="grid gap-1 text-xs font-semibold text-coffee/60">
          Periode
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-full border border-cocoa/20 bg-cream px-4 py-2 text-sm text-coffee outline-none focus:border-cocoa">
            {periods.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-coffee/60">Conversiegegevens laden...</p>
      ) : error ? (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">Conversiegegevens laden is niet gelukt: {error}</p>
      ) : (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const value = counts[stage.key] || 0;
              const previous = index > 0 ? counts[stages[index - 1].key] || 0 : 0;
              const flow = index > 0 && previous > 0 && value <= previous ? Math.round((value / previous) * 100) : null;
              const content = <>
                  <div className="flex items-center justify-between gap-3"><Icon size={19} className="text-cocoa" /><span className="display-title text-3xl font-semibold text-coffee">{value}</span></div>
                  <p className="mt-4 text-sm font-semibold text-coffee">{stage.label}</p>
                  <p className="mt-1 min-h-10 text-xs leading-5 text-coffee/55">{stage.description}</p>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-linen"><div className="h-full rounded-full bg-cocoa transition-all" style={{ width: `${Math.max(value > 0 ? 7 : 0, (value / maximum) * 100)}%` }} /></div>
                  {index > 0 && <p className="mt-2 text-[0.68rem] font-semibold text-coffee/50">{flow == null ? (value > previous ? "Ook directe instroom" : "Nog geen doorstroom") : `${flow}% vanaf vorige stap`}</p>}
                  {stage.key === "packages_viewed" && <p className="mt-3 inline-flex items-center gap-1 text-[0.68rem] font-semibold text-cocoa">Bekijk gekozen pakketten <ChevronDown size={13} className={`transition ${showPackageDetails ? "rotate-180" : ""}`} /></p>}
                </>;
              return stage.key === "packages_viewed" ? (
                <Fragment key={stage.key}>
                  <button type="button" onClick={() => setShowPackageDetails((value) => !value)} aria-expanded={showPackageDetails} aria-controls="mobile-package-choices" className={`w-full touch-manipulation rounded-lg border bg-cream p-4 text-left transition active:bg-linen/50 hover:border-cocoa/45 hover:bg-linen/30 ${showPackageDetails ? "border-cocoa shadow-soft" : "border-cocoa/15"}`}>{content}</button>
                  {showPackageDetails && <div id="mobile-package-choices" ref={mobilePackageDetailsRef} className="scroll-mt-24 md:hidden"><PackageChoiceDetails choices={packageChoices} /></div>}
                </Fragment>
              ) : <div key={stage.key} className="rounded-lg border border-cocoa/15 bg-cream p-4">{content}</div>;
            })}
          </div>
          {showPackageDetails && <div className="hidden md:block"><PackageChoiceDetails choices={packageChoices} /></div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-linen px-4 py-3 text-sm text-coffee/70 warm-border">
            <span><strong className="text-coffee">{completed}</strong> boekingsaanvragen in deze periode</span>
            <span><strong className="text-coffee">{completionRate}%</strong> van de bezoekers die stap 1 begonnen, heeft de aanvraag verstuurd</span>
          </div>
        </>
      )}
    </section>
  );
}

function PackageChoiceDetails({ choices }) {
  const maximum = Math.max(1, ...choices.map((choice) => choice.count));
  return (
    <div className="mt-4 rounded-lg border border-cocoa/15 bg-cream p-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="fine-label text-cocoa">Gekozen in de boekingsflow</p><h3 className="display-title mt-1 text-xl font-semibold text-coffee">Pakketkeuzes</h3></div><p className="text-xs text-coffee/55">{choices.reduce((sum, choice) => sum + choice.count, 0)} unieke bezoekers met een keuze</p></div>
      {choices.length === 0 ? (
        <p className="mt-4 rounded-lg bg-linen px-4 py-3 text-sm text-coffee/65">In deze periode is nog geen specifiek pakket gekozen. Nieuwe keuzes verschijnen hier automatisch.</p>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {choices.map((choice) => <div key={choice.name} className="rounded-lg bg-card p-4 warm-border"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-coffee">{choice.name}</p><p className="mt-1 text-xs text-coffee/55">{choice.shootType || "Shootsoort niet vastgelegd"}</p></div><span className="display-title text-2xl font-semibold text-cocoa">{choice.count}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-linen"><div className="h-full rounded-full bg-cocoa" style={{ width: `${(choice.count / maximum) * 100}%` }} /></div></div>)}
        </div>
      )}
    </div>
  );
}
