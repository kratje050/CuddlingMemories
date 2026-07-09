import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarCheck, CalendarClock, CalendarX, Clock, Image, Inbox, Tag, TrendingUp, XCircle } from "lucide-react";
import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import StatCard from "../components/StatCard.jsx";
import DataTable from "../components/DataTable.jsx";
import BarList from "../components/BarList.jsx";
import AvailabilityStatusBadge from "../../components/AvailabilityStatusBadge.jsx";
import { formatDate } from "../../lib/formatDate.js";
import { getMonthsStatusAdmin } from "../../lib/monthAvailability.js";

const OPEN_STATUSES = ["Nieuw", "Gelezen", "Contact opgenomen", "Wacht op reactie"];

const monthLabel = (date) => date.toLocaleDateString("nl-NL", { month: "short", year: "2-digit" });

function monthCapacity(date, rules) {
  if (!rules.length) return 0;
  const days = eachDayOfInterval({ start: startOfMonth(date), end: endOfMonth(date) });
  return days.reduce((sum, day) => {
    const rule = rules.find((r) => r.day_of_week === getDay(day));
    return sum + (rule?.is_available ? rule.max_bookings_per_day : 0);
  }, 0);
}

function buildCharts(rows, availabilityRules) {
  const now = new Date();
  const months = Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: monthLabel(date), value: 0, date };
  });
  const monthIndex = new Map(months.map((month, index) => [month.key, index]));

  const byShootType = {};
  const byStatus = {};
  const byPackage = {};
  let modelCount = 0;
  let regularCount = 0;

  rows.forEach((row) => {
    const date = new Date(row.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (monthIndex.has(key)) months[monthIndex.get(key)].value += 1;

    if (row.shoot_type) byShootType[row.shoot_type] = (byShootType[row.shoot_type] || 0) + 1;
    if (row.status) byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    if (row.packages?.title) byPackage[row.packages.title] = (byPackage[row.packages.title] || 0) + 1;
    if (row.model_discount) modelCount += 1;
    else regularCount += 1;
  });

  const toSortedItems = (map) =>
    Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

  const occupancy = months.map((month) => {
    const capacity = monthCapacity(month.date, availabilityRules);
    const pct = capacity > 0 ? Math.round((month.value / capacity) * 100) : 0;
    return { label: month.label, value: Math.min(pct, 100) };
  });

  const busiestMonth = [...months].sort((a, b) => b.value - a.value)[0];

  return {
    perMonth: months,
    perShootType: toSortedItems(byShootType),
    perStatus: toSortedItems(byStatus),
    perPackage: toSortedItems(byPackage),
    modelVsRegular: [
      { label: "Met modelkorting", value: modelCount },
      { label: "Regulier", value: regularCount },
    ],
    occupancy,
    busiestMonth: busiestMonth?.value ? busiestMonth.label : "-",
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    newCount: 0,
    monthCount: 0,
    openCount: 0,
    popularShoot: "-",
    albumCount: 0,
    packageCount: 0,
    confirmedThisMonth: 0,
    cancelledCount: 0,
    blockedDaysThisMonth: 0,
    nextShoot: null,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentChanges, setRecentChanges] = useState([]);
  const [monthPlanning, setMonthPlanning] = useState({
    currentMonth: null,
    nextMonth: null,
    almostFullCount: 0,
    fullCount: 0,
    closedCount: 0,
    nextAvailableMonth: null,
  });
  const [charts, setCharts] = useState({
    perMonth: [],
    perShootType: [],
    perStatus: [],
    perPackage: [],
    modelVsRegular: [],
    occupancy: [],
    busiestMonth: "-",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonthDate = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1);
      const todayStr = format(new Date(), "yyyy-MM-dd");

      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      const [
        newRes,
        monthRes,
        openRes,
        shootTypesRes,
        albumRes,
        packageRes,
        latestBookingsRes,
        changesRes,
        chartRowsRes,
        confirmedRes,
        cancelledRes,
        blockedRes,
        nextShootRes,
        availabilityRulesRes,
        monthsStatusRes,
      ] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "Nieuw"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", startOfMonth.toISOString()),
        supabase.from("bookings").select("id", { count: "exact", head: true }).in("status", OPEN_STATUSES),
        supabase.from("bookings").select("shoot_type"),
        supabase.from("portfolio_albums").select("id", { count: "exact", head: true }),
        supabase.from("packages").select("id", { count: "exact", head: true }).eq("is_published", true),
        supabase
          .from("bookings")
          .select("id, customer_name, shoot_type, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("recent_content_changes").select("*").order("updated_at", { ascending: false }).limit(5),
        supabase
          .from("bookings")
          .select("shoot_type, status, model_discount, created_at, packages(title)")
          .gte("created_at", yearAgo.toISOString()),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .gte("confirmed_at", startOfMonth.toISOString())
          .lt("confirmed_at", endOfMonthDate.toISOString()),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "Geannuleerd"),
        supabase
          .from("blocked_periods")
          .select("start_datetime, end_datetime")
          .lte("start_datetime", endOfMonthDate.toISOString())
          .gte("end_datetime", startOfMonth.toISOString()),
        supabase
          .from("bookings")
          .select("customer_name, shoot_type, booking_date, start_time")
          .gte("booking_date", todayStr)
          .not("status", "in", "(Geannuleerd,Gearchiveerd)")
          .order("booking_date", { ascending: true })
          .limit(1),
        supabase.from("availability_rules").select("day_of_week, is_available, max_bookings_per_day"),
        getMonthsStatusAdmin(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 12).catch(() => []),
      ]);

      if (!active) return;

      const counts = {};
      (shootTypesRes.data || []).forEach(({ shoot_type }) => {
        if (!shoot_type) return;
        counts[shoot_type] = (counts[shoot_type] || 0) + 1;
      });
      const popularShoot = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

      const blockedDaysThisMonth = new Set();
      (blockedRes.data || []).forEach((period) => {
        eachDayOfInterval({
          start: new Date(Math.max(new Date(period.start_datetime), startOfMonth)),
          end: new Date(Math.min(new Date(period.end_datetime), endOfMonthDate)),
        }).forEach((day) => blockedDaysThisMonth.add(format(day, "yyyy-MM-dd")));
      });

      const monthsStatus = monthsStatusRes || [];
      setMonthPlanning({
        currentMonth: monthsStatus[0] || null,
        nextMonth: monthsStatus[1] || null,
        almostFullCount: monthsStatus.filter((m) => m.status === "almost_full").length,
        fullCount: monthsStatus.filter((m) => m.status === "full").length,
        closedCount: monthsStatus.filter((m) => m.isClosed).length,
        nextAvailableMonth: monthsStatus.find((m) => m.status !== "unavailable" && m.status !== "full") || null,
      });

      setStats({
        newCount: newRes.count || 0,
        monthCount: monthRes.count || 0,
        openCount: openRes.count || 0,
        popularShoot,
        albumCount: albumRes.count || 0,
        packageCount: packageRes.count || 0,
        confirmedThisMonth: confirmedRes.count || 0,
        cancelledCount: cancelledRes.count || 0,
        blockedDaysThisMonth: blockedDaysThisMonth.size,
        nextShoot: nextShootRes.data?.[0] || null,
      });
      setRecentBookings(latestBookingsRes.data || []);
      setRecentChanges(changesRes.data || []);
      setCharts(buildCharts(chartRowsRes.data || [], availabilityRulesRes.data || []));
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminLayout>
      <h1 className="display-title text-3xl font-semibold text-coffee">Dashboard</h1>
      <p className="mt-1 text-sm text-coffee/70">Overzicht van boekingen en content.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Nieuwe boekingen" value={loading ? "-" : stats.newCount} icon={Inbox} />
        <StatCard label="Deze maand" value={loading ? "-" : stats.monthCount} icon={CalendarCheck} />
        <StatCard label="Openstaand" value={loading ? "-" : stats.openCount} icon={Clock} />
        <StatCard label="Bevestigd deze maand" value={loading ? "-" : stats.confirmedThisMonth} icon={CalendarCheck} />
        <StatCard label="Geannuleerd (totaal)" value={loading ? "-" : stats.cancelledCount} icon={XCircle} />
        <StatCard label="Drukste maand" value={loading ? "-" : charts.busiestMonth} icon={TrendingUp} />
        <StatCard label="Populairste shoot" value={loading ? "-" : stats.popularShoot} icon={TrendingUp} />
        <StatCard
          label="Eerstvolgende shoot"
          value={loading ? "-" : stats.nextShoot ? `${formatDate(stats.nextShoot.booking_date)} ${stats.nextShoot.start_time?.slice(0, 5) || ""}` : "Geen"}
          icon={CalendarClock}
        />
        <StatCard label="Geblokkeerde dagen deze maand" value={loading ? "-" : stats.blockedDaysThisMonth} icon={CalendarX} />
        <StatCard label="Portfolio-albums" value={loading ? "-" : stats.albumCount} icon={Image} />
        <StatCard label="Gepubliceerde pakketten" value={loading ? "-" : stats.packageCount} icon={Tag} />
      </div>

      {!loading && (
        <div className="mt-8 rounded-lg bg-card p-6 shadow-soft warm-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display-title text-xl font-semibold text-coffee">Maandplanning</h2>
            <AdminButton type="button" variant="secondary" onClick={() => navigate("/admin/maandplanning")}>
              Beschikbaarheid bekijken
            </AdminButton>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-cocoa/15 p-4">
              <p className="fine-label text-[0.62rem] text-cocoa">Deze maand</p>
              {monthPlanning.currentMonth ? (
                <>
                  <p className="mt-1 text-sm font-semibold capitalize text-coffee">
                    {format(new Date(monthPlanning.currentMonth.year, monthPlanning.currentMonth.month - 1, 1), "MMMM yyyy", { locale: nl })}
                  </p>
                  <div className="mt-2">
                    <AvailabilityStatusBadge status={monthPlanning.currentMonth.status} />
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-coffee/60">-</p>
              )}
            </div>
            <div className="rounded-lg border border-cocoa/15 p-4">
              <p className="fine-label text-[0.62rem] text-cocoa">Volgende maand</p>
              {monthPlanning.nextMonth ? (
                <>
                  <p className="mt-1 text-sm font-semibold capitalize text-coffee">
                    {format(new Date(monthPlanning.nextMonth.year, monthPlanning.nextMonth.month - 1, 1), "MMMM yyyy", { locale: nl })}
                  </p>
                  <div className="mt-2">
                    <AvailabilityStatusBadge status={monthPlanning.nextMonth.status} />
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-coffee/60">-</p>
              )}
            </div>
            <div className="rounded-lg border border-cocoa/15 p-4">
              <p className="fine-label text-[0.62rem] text-cocoa">Eerstvolgende beschikbare maand</p>
              <p className="mt-1 text-sm font-semibold capitalize text-coffee">
                {monthPlanning.nextAvailableMonth
                  ? format(
                      new Date(monthPlanning.nextAvailableMonth.year, monthPlanning.nextAvailableMonth.month - 1, 1),
                      "MMMM yyyy",
                      { locale: nl }
                    )
                  : "Geen"}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="display-title text-2xl font-semibold text-coffee">{monthPlanning.almostFullCount}</p>
              <p className="text-xs text-coffee/60">Bijna volle maanden</p>
            </div>
            <div>
              <p className="display-title text-2xl font-semibold text-coffee">{monthPlanning.fullCount}</p>
              <p className="text-xs text-coffee/60">Volle maanden</p>
            </div>
            <div>
              <p className="display-title text-2xl font-semibold text-coffee">{monthPlanning.closedCount}</p>
              <p className="text-xs text-coffee/60">Handmatig gesloten</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="display-title text-xl font-semibold text-coffee">Laatste 5 boekingen</h2>
          <div className="mt-3">
            <DataTable
              loading={loading}
              rows={recentBookings}
              getRowKey={(row) => row.id}
              emptyLabel="Nog geen boekingen."
              columns={[
                { key: "customer_name", label: "Naam" },
                { key: "shoot_type", label: "Shoot" },
                { key: "status", label: "Status" },
                {
                  key: "created_at",
                  label: "Datum",
                  render: (row) => formatDate(row.created_at),
                },
              ]}
            />
          </div>
        </div>
        <div>
          <h2 className="display-title text-xl font-semibold text-coffee">Laatste 5 aangepaste onderdelen</h2>
          <div className="mt-3">
            <DataTable
              loading={loading}
              rows={recentChanges}
              getRowKey={(row) => `${row.table_name}-${row.id}`}
              emptyLabel="Nog geen wijzigingen."
              columns={[
                { key: "label", label: "Onderdeel" },
                { key: "table_name", label: "Type" },
                {
                  key: "updated_at",
                  label: "Laatst gewijzigd",
                  render: (row) => formatDate(row.updated_at),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {!loading && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Boekingen per maand</h2>
            <div className="mt-4">
              <BarList items={charts.perMonth} />
            </div>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Boekingen per shoot type</h2>
            <div className="mt-4">
              <BarList items={charts.perShootType} />
            </div>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Statusverdeling</h2>
            <div className="mt-4">
              <BarList items={charts.perStatus} />
            </div>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Populaire pakketten</h2>
            <div className="mt-4">
              <BarList items={charts.perPackage} />
            </div>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Model-aanvragen (laatste 12 maanden)</h2>
            <div className="mt-4">
              <BarList items={charts.modelVsRegular} />
            </div>
          </div>
          <div className="rounded-lg bg-card p-6 shadow-soft warm-border">
            <h2 className="display-title text-xl font-semibold text-coffee">Bezetting per maand</h2>
            <p className="mt-1 text-xs text-coffee/60">Boekingen t.o.v. totale capaciteit uit het weekrooster (indicatief).</p>
            <div className="mt-4">
              <BarList items={charts.occupancy} valueSuffix="%" />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
