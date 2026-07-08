import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";

const fields = [
  { name: "title", label: "Titel", type: "text", required: true },
  { name: "reason", label: "Reden", type: "text", wide: true },
  { name: "start_datetime", label: "Start", type: "datetime-local", required: true },
  { name: "end_datetime", label: "Einde", type: "datetime-local", required: true },
  { name: "all_day", label: "Hele dag blokkeren", type: "checkbox" },
  { name: "is_recurring", label: "Terugkerend", type: "checkbox" },
  { name: "recurring_rule", label: "Herhaling (alleen bij terugkerend)", type: "select", options: ["yearly"] },
];

const columns = [
  { key: "title", label: "Titel" },
  { key: "reason", label: "Reden" },
  { key: "start_datetime", label: "Start", render: (row) => new Date(row.start_datetime).toLocaleString("nl-NL") },
  { key: "end_datetime", label: "Einde", render: (row) => new Date(row.end_datetime).toLocaleString("nl-NL") },
  { key: "is_recurring", label: "Jaarlijks", render: (row) => (row.is_recurring ? "Ja" : "Nee") },
];

export default function AdminBlockedPeriods() {
  return (
    <AdminLayout>
      <p className="mb-4 -mt-2 text-sm text-coffee/70">
        Vakanties, privédagen of feestdagen waarop niet geboekt kan worden. Bij "Terugkerend" wordt de blokkade elk
        jaar op dezelfde maand/dag herhaald (handig voor feestdagen).
      </p>
      <AdminCrudList
        title="Geblokkeerde dagen"
        table="blocked_periods"
        fields={fields}
        columns={columns}
        orderBy="start_datetime"
        emptyLabel="Nog geen geblokkeerde dagen."
        newLabel="Blokkade toevoegen"
      />
    </AdminLayout>
  );
}
