import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Search } from "lucide-react";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import DataTable from "../components/DataTable.jsx";
import { useBookings } from "../hooks/useBookings.js";
import { formatDate } from "../../lib/formatDate.js";

function bookingMoment(booking) {
  if (booking.booking_date) {
    return `${formatDate(booking.booking_date)} ${booking.start_time?.slice(0, 5) || ""}`.trim();
  }

  return booking.preferred_period || "Nog niet ingepland";
}

function shortText(value, fallback = "-") {
  if (!value) return fallback;
  const text = String(value).trim();
  if (!text) return fallback;
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { bookings, loading, error } = useBookings({ search, sort: "newest" });

  const columns = useMemo(
    () => [
      {
        key: "customer",
        label: "Klant",
        render: (row) => (
          <div>
            <p className="font-semibold text-coffee">{row.customer_name || "Naam onbekend"}</p>
            <p className="mt-1 text-xs text-coffee/60">{row.customer_email || "Geen e-mail"}</p>
          </div>
        ),
      },
      {
        key: "shoot",
        label: "Shoot",
        render: (row) => (
          <div>
            <p className="font-semibold text-coffee">{row.shoot_type || "-"}</p>
            <p className="mt-1 text-xs text-coffee/60">{row.packages?.title || "Geen pakket gekozen"}</p>
          </div>
        ),
      },
      { key: "moment", label: "Moment", render: (row) => bookingMoment(row) },
      {
        key: "location",
        label: "Locatie",
        render: (row) => shortText(row.location, "Geen locatie opgegeven"),
      },
      {
        key: "message",
        label: "Bericht",
        render: (row) => <span className="block max-w-[340px] text-xs leading-5">{shortText(row.message, "Geen bericht")}</span>,
      },
      { key: "status", label: "Status" },
      {
        key: "mail",
        label: "",
        render: (row) =>
          row.customer_email ? (
            <a
              href={`mailto:${row.customer_email}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cocoa/25 text-cocoa transition hover:bg-linen"
              title="Mail klant"
            >
              <Mail size={15} />
            </a>
          ) : null,
      },
    ],
    []
  );

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-title text-3xl font-semibold text-coffee">Klantgegevens</h1>
          <p className="mt-1 text-sm text-coffee/70">
            Alle klantgegevens uit boekingen bij elkaar. Klik op een regel om de volledige boeking te openen.
          </p>
        </div>
        <AdminButton type="button" variant="secondary" onClick={() => navigate("/admin/bookings")}>
          Naar boekingen
        </AdminButton>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-lg bg-card p-4 shadow-soft warm-border">
        <Search size={18} className="text-cocoa" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Zoek op naam of e-mailadres"
          className="min-w-0 flex-1 rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
        />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="mt-5">
        <DataTable
          loading={loading}
          rows={bookings}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/admin/bookings/${row.id}`)}
          emptyLabel="Nog geen klantgegevens gevonden."
          columns={columns}
        />
      </div>
    </AdminLayout>
  );
}
