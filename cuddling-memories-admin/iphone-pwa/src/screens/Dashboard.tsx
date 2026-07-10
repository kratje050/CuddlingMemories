import { getDashboardStats, type DashboardStats } from "@shared/index";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader } from "../components/ui";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setStats(await getDashboardStats(supabase as any));
    } catch {
      setStats(null);
      setError("Dashboard kon niet worden geladen. Controleer je verbinding en probeer opnieuw.");
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
        <PageHeader title="Dashboard" subtitle="Snel overzicht van aanvragen en boekingen." />
        <button onClick={load} className="mt-1 rounded-full border border-cocoa/20 bg-card p-3 text-cocoa" aria-label="Verversen">
          <span className={loading ? "block animate-spin" : "block"}>↻</span>
        </button>
      </div>
      {error ? <ErrorBox message={error} /> : null}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Vandaag nieuw" value={stats?.newToday ?? 0} />
        <Stat label="Deze week" value={stats?.newThisWeek ?? 0} />
        <Stat label="Openstaand" value={stats?.openRequests ?? 0} />
        <Stat label="Deze maand" value={stats?.bookingsThisMonth ?? 0} />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-coffee">Laatste boekingen</h2>
      <div className="mt-3 grid gap-3">
        {loading ? <EmptyState title="Laden..." text="Ik haal de nieuwste aanvragen op." /> : null}
        {!loading && !stats?.latestBookings?.length ? <EmptyState title="Geen recente boekingen" text="Nieuwe aanvragen verschijnen hier zodra ze binnenkomen." /> : null}
        {(stats?.latestBookings || []).map((booking) => (
          <Link key={booking.id} to={`/bookings/${booking.id}`}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-coffee">{booking.customer_name}</p>
                  <p className="mt-1 text-sm text-coffee/60">{booking.shoot_type}</p>
                </div>
                <Badge>{booking.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      <Link to="/bookings">
        <Button className="mt-5 w-full">Alle boekingen bekijken</Button>
      </Link>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="text-3xl font-bold text-coffee">{value}</p>
      <p className="mt-1 text-xs text-coffee/60">{label}</p>
    </Card>
  );
}
