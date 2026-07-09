import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { shootTypeOptions } from "../utils/bookingStatuses.js";
import { formatDateTime } from "../../lib/formatDate.js";

const fields = [
  { name: "title", label: "Titel", type: "text", wide: true, help: "Interne naam voor dit extra tijdslot, bijvoorbeeld Extra zondagopening." },
  { name: "shoot_type", label: "Alleen voor shoot (leeg = alle)", type: "select", options: shootTypeOptions, help: "Kies een shoot als dit extra slot alleen daarvoor mag gelden. Laat leeg voor alle shoots." },
  { name: "start_datetime", label: "Start", type: "datetime-local", required: true, help: "Vanaf dit moment kan dit extra tijdslot geboekt worden." },
  { name: "end_datetime", label: "Einde", type: "datetime-local", required: true, help: "Na dit moment verdwijnt het extra tijdslot uit de beschikbare opties." },
  { name: "max_bookings", label: "Maximaal aantal boekingen", type: "number", help: "Hoe vaak dit extra slot gebruikt mag worden. Meestal 1." },
  { name: "is_active", label: "Actief", type: "checkbox", help: "Zet uit om dit extra tijdslot tijdelijk te verbergen zonder het te verwijderen." },
];

const columns = [
  { key: "title", label: "Titel" },
  { key: "shoot_type", label: "Shoot", render: (row) => row.shoot_type || "Alle" },
  { key: "start_datetime", label: "Start", render: (row) => formatDateTime(row.start_datetime) },
  { key: "end_datetime", label: "Einde", render: (row) => formatDateTime(row.end_datetime) },
  { key: "current_bookings", label: "Bezet", render: (row) => `${row.current_bookings} / ${row.max_bookings}` },
  { key: "is_active", label: "Actief", render: (row) => (row.is_active ? "Ja" : "Nee") },
];

export default function AdminManualSlots() {
  return (
    <AdminLayout>
      <p className="mb-4 -mt-2 text-sm text-coffee/70">
        Handmatig geopende tijdslots. Gebruik dit voor uitzonderingen, zoals een extra zondag waarop normaal niet geboekt
        kan worden.
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
