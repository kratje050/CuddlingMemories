import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { shootTypeOptions } from "../utils/bookingStatuses.js";

const fields = [
  { name: "title", label: "Titel", type: "text", wide: true },
  { name: "shoot_type", label: "Alleen voor shoot (leeg = alle)", type: "select", options: shootTypeOptions },
  { name: "start_datetime", label: "Start", type: "datetime-local", required: true },
  { name: "end_datetime", label: "Einde", type: "datetime-local", required: true },
  { name: "max_bookings", label: "Maximaal aantal boekingen", type: "number" },
  { name: "is_active", label: "Actief", type: "checkbox" },
];

const columns = [
  { key: "title", label: "Titel" },
  { key: "shoot_type", label: "Shoot", render: (row) => row.shoot_type || "Alle" },
  { key: "start_datetime", label: "Start", render: (row) => new Date(row.start_datetime).toLocaleString("nl-NL") },
  { key: "end_datetime", label: "Einde", render: (row) => new Date(row.end_datetime).toLocaleString("nl-NL") },
  { key: "current_bookings", label: "Bezet", render: (row) => `${row.current_bookings} / ${row.max_bookings}` },
  { key: "is_active", label: "Actief", render: (row) => (row.is_active ? "Ja" : "Nee") },
];

export default function AdminManualSlots() {
  return (
    <AdminLayout>
      <p className="mb-4 -mt-2 text-sm text-coffee/70">
        Handmatig geopende tijdslots — ook te gebruiken als uitzondering om extra ruimte te openen op een dag die
        normaal gesloten is (bv. één zondag wél beschikbaar).
      </p>
      <AdminCrudList
        title="Handmatige tijdslots"
        table="manual_slots"
        fields={fields}
        columns={columns}
        orderBy="start_datetime"
        emptyLabel="Nog geen handmatige tijdslots."
        newLabel="Tijdslot toevoegen"
      />
    </AdminLayout>
  );
}
