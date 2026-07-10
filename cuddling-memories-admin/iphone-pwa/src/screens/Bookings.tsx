import { bookingStatuses, listBookings, type Booking } from "@shared/index";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, EmptyState, ErrorBox, PageHeader } from "../components/ui";
import { supabase } from "../lib/supabase";

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      listBookings(supabase as any, { search, status })
        .then((items) => {
          if (isMounted) setBookings(items);
        })
        .catch(() => {
          if (!isMounted) return;
          setBookings([]);
          setError("Boekingen konden niet worden geladen.");
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 250);

    return () => {
      isMounted = false;
      window.clearTimeout(timer);
    };
  }, [search, status]);

  return (
    <>
      <PageHeader title="Boekingen" subtitle="Zoek en open aanvragen." />
      <input className="mb-3 w-full rounded-xl border border-cocoa/20 bg-card px-4 py-3 text-sm outline-none" placeholder="Zoek op naam of e-mail" value={search} onChange={(event) => setSearch(event.target.value)} />
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button onClick={() => setStatus("")}>
          <Badge tone={!status ? "active" : "neutral"}>Alles</Badge>
        </button>
        {bookingStatuses.slice(0, 8).map((item) => (
          <button key={item} onClick={() => setStatus(item)}>
            <Badge tone={status === item ? "active" : "neutral"}>{item}</Badge>
          </button>
        ))}
      </div>
      {error ? <ErrorBox message={error} /> : null}
      <div className="grid gap-3">
        {loading ? <EmptyState title="Laden..." text="Ik haal de boekingen op." /> : null}
        {!loading && !bookings.length ? <EmptyState title="Geen boekingen gevonden" text="Pas je zoekterm of statusfilter aan." /> : null}
        {bookings.map((booking) => (
          <Link key={booking.id} to={`/bookings/${booking.id}`}>
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-coffee">{booking.customer_name}</p>
                  <p className="mt-1 text-sm text-coffee/60">{booking.customer_email}</p>
                  <p className="mt-1 text-sm text-coffee/60">{booking.shoot_type}</p>
                </div>
                <Badge>{booking.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
