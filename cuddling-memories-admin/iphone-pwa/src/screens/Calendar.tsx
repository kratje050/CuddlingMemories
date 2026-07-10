import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader } from "../components/ui";
import { formatMonthName, getMobileMonthStatuses, getMonthBadge, getMonthText, type MonthStatus } from "../lib/mobileAdminApi";

export default function Calendar() {
  const [months, setMonths] = useState<MonthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setMonths(await getMobileMonthStatuses(12));
    } catch {
      setMonths([]);
      setError("Maandplanning kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Kalender" subtitle="Bekijk snel hoe de komende maanden ervoor staan." />
        <button onClick={load} className="mt-1 rounded-full border border-cocoa/20 bg-card p-3 text-cocoa" aria-label="Verversen">
          <span className={loading ? "block animate-spin" : "block"}>↻</span>
        </button>
      </div>
      {error ? <ErrorBox message={error} /> : null}
      <div className="grid gap-3">
        {loading ? <EmptyState title="Laden..." text="Ik haal de maandplanning op." /> : null}
        {!loading && !months.length ? <EmptyState title="Geen maandplanning" text="Er zijn nog geen maandgegevens beschikbaar." /> : null}
        {months.map((month) => (
          <Card key={`${month.year}-${month.month}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.16em] text-cocoa">{month.year}</p>
                <h2 className="mt-1 text-2xl font-semibold text-coffee">{formatMonthName(month.month)}</h2>
              </div>
              <Badge tone={month.status === "full" || month.status === "unavailable" ? "warning" : "neutral"}>
                {getMonthBadge(month.status)}
              </Badge>
            </div>
            <p className="mt-4 text-sm leading-6 text-coffee/65">{month.message || getMonthText(month.status)}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-coffee/65">
              <MiniStat label="Bezet" value={month.occupied ?? "-"} />
              <MiniStat label="Plekken" value={month.capacity ?? "-"} />
              <MiniStat label="Vrij" value={month.remaining ?? "-"} />
            </div>
          </Card>
        ))}
      </div>
      <Button onClick={load} className="mt-5 w-full">Verversen</Button>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-cocoa/10 bg-cream px-2 py-3">
      <p className="text-base font-semibold text-coffee">{value}</p>
      <p className="mt-1">{label}</p>
    </div>
  );
}
