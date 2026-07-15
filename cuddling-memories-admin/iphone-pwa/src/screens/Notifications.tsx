import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader } from "../components/ui";
import { getNotifications, markNotificationRead, type NotificationRow } from "../lib/mobileAdminApi";
import { formatMobileDateTime } from "../lib/formatDate";

export default function Notifications() {
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await getNotifications());
    } catch {
      setRows([]);
      setError("Meldingen konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleRead(row: NotificationRow) {
    const next = !row.is_read;
    setRows((current) => current.map((item) => item.id === row.id ? { ...item, is_read: next } : item));
    try {
      await markNotificationRead(row.id, next);
    } catch {
      setRows((current) => current.map((item) => item.id === row.id ? { ...item, is_read: row.is_read } : item));
      setError("Melding kon niet worden aangepast.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title="Meldingen" subtitle="Nieuwe aanvragen en belangrijke acties bij elkaar." />
        <button onClick={load} className="mt-1 rounded-full border border-cocoa/20 bg-card p-3 text-cocoa" aria-label="Verversen">
          <span className={loading ? "block animate-spin" : "block"}>↻</span>
        </button>
      </div>
      {error ? <ErrorBox message={error} /> : null}
      <div className="grid gap-3">
        {loading ? <EmptyState title="Laden..." text="Ik haal de meldingen op." /> : null}
        {!loading && !rows.length ? <EmptyState title="Geen meldingen" text="Nieuwe meldingen verschijnen hier zodra er iets gebeurt." /> : null}
        {rows.map((row) => (
          <Card key={row.id} className={row.is_read ? "opacity-75" : ""}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-coffee">{row.title}</p>
                {row.message ? <p className="mt-2 text-sm leading-6 text-coffee/65">{row.message}</p> : null}
                <p className="mt-3 text-xs text-coffee/45">{formatMobileDateTime(row.created_at)}</p>
              </div>
              <Badge tone={row.is_read ? "neutral" : "active"}>{row.is_read ? "Gelezen" : "Nieuw"}</Badge>
            </div>
            <Button onClick={() => toggleRead(row)} className="mt-4 w-full bg-cream text-coffee">
              {row.is_read ? "Markeer als nieuw" : "Markeer gelezen"}
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}
