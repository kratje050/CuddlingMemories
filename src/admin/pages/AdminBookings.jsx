import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Download, Star, Trash2 } from "lucide-react";
import AdminLayout from "../components/AdminLayout.jsx";
import DataTable from "../components/DataTable.jsx";
import AdminButton from "../components/AdminButton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useAdminAuth } from "../hooks/useAdminAuth.js";
import { useBookings, updateBookingStatus, deleteBooking } from "../hooks/useBookings.js";
import { bookingStatuses, shootTypeOptions } from "../utils/bookingStatuses.js";
import { downloadCsv } from "../utils/csvExport.js";

export default function AdminBookings() {
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const [status, setStatus] = useState("");
  const [shootType, setShootType] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { bookings, loading, error, reload } = useBookings({ status, shootType, search, dateFrom, dateTo, sort });

  const columns = useMemo(
    () => [
      {
        key: "important",
        label: "",
        render: (row) => (row.is_important ? <Star size={16} className="fill-cocoa text-cocoa" /> : null),
      },
      { key: "customer_name", label: "Naam" },
      { key: "customer_email", label: "E-mail" },
      { key: "shoot_type", label: "Shoot" },
      { key: "status", label: "Status" },
      {
        key: "created_at",
        label: "Aangevraagd",
        render: (row) => new Date(row.created_at).toLocaleDateString("nl-NL"),
      },
      {
        key: "actions",
        label: "",
        render: (row) => (
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              title="Archiveren"
              onClick={async () => {
                await updateBookingStatus(row.id, "Gearchiveerd", user?.email);
                reload();
              }}
              className="grid h-8 w-8 place-items-center rounded-full border border-cocoa/25 text-coffee transition hover:bg-linen"
            >
              <Archive size={14} />
            </button>
            <button
              type="button"
              title="Verwijderen"
              onClick={() => setDeleteTarget(row)}
              className="grid h-8 w-8 place-items-center rounded-full border border-red-300 text-red-700 transition hover:bg-red-50"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [reload, user]
  );

  const handleExport = () => {
    downloadCsv(
      `boekingen-${new Date().toISOString().slice(0, 10)}.csv`,
      bookings,
      [
        { label: "Naam", value: (row) => row.customer_name },
        { label: "E-mail", value: (row) => row.customer_email },
        { label: "Shoot", value: (row) => row.shoot_type },
        { label: "Periode", value: (row) => row.preferred_period },
        { label: "Locatie", value: (row) => row.location },
        { label: "Status", value: (row) => row.status },
        { label: "Model korting", value: (row) => (row.model_discount ? "Ja" : "Nee") },
        { label: "Belangrijk", value: (row) => (row.is_important ? "Ja" : "Nee") },
        { label: "Aangevraagd op", value: (row) => new Date(row.created_at).toLocaleString("nl-NL") },
        { label: "Bericht", value: (row) => row.message },
      ]
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-title text-3xl font-semibold text-coffee">Boekingen</h1>
          <p className="mt-1 text-sm text-coffee/70">{bookings.length} resultaten</p>
        </div>
        <AdminButton variant="secondary" onClick={handleExport}>
          <Download size={14} /> Exporteer CSV
        </AdminButton>
      </div>

      <div className="mt-5 grid gap-3 rounded-lg bg-card p-4 shadow-soft warm-border sm:grid-cols-2 lg:grid-cols-6">
        <input
          type="text"
          placeholder="Zoek op naam of e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa lg:col-span-2"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
        >
          <option value="">Alle statussen</option>
          {bookingStatuses.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          value={shootType}
          onChange={(event) => setShootType(event.target.value)}
          className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
        >
          <option value="">Alle shoots</option>
          {shootTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(event) => setDateFrom(event.target.value)}
          className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(event) => setDateTo(event.target.value)}
          className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
        />
        <select
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa sm:col-span-2 lg:col-span-1"
        >
          <option value="newest">Nieuwste eerst</option>
          <option value="oldest">Oudste eerst</option>
        </select>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="mt-5">
        <DataTable
          loading={loading}
          rows={bookings}
          getRowKey={(row) => row.id}
          emptyLabel="Nog geen boekingen."
          onRowClick={(row) => navigate(`/admin/bookings/${row.id}`)}
          columns={columns}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Boeking verwijderen?"
        description={deleteTarget ? `De boeking van ${deleteTarget.customer_name} wordt definitief verwijderd.` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          await deleteBooking(deleteTarget.id);
          setDeleteTarget(null);
          reload();
        }}
      />
    </AdminLayout>
  );
}
