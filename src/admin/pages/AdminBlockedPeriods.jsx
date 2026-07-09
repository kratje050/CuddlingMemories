import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { formatDateTime } from "../../lib/formatDate.js";

const fields = [
  { name: "title", label: "Titel", type: "text", required: true, help: "Naam van de blokkade, bijvoorbeeld Vakantie, Bruiloft of Kerst." },
  { name: "reason", label: "Reden", type: "text", wide: true, help: "Interne toelichting waarom deze periode niet beschikbaar is." },
  { name: "start_datetime", label: "Start", type: "datetime-local", required: true, help: "Vanaf dit moment kunnen bezoekers geen tijdslot boeken." },
  { name: "end_datetime", label: "Einde", type: "datetime-local", required: true, help: "Na dit moment wordt beschikbaarheid weer normaal berekend." },
  { name: "all_day", label: "Hele dag blokkeren", type: "checkbox", help: "Blokkeert de volledige dag(en), ongeacht losse uren in het rooster." },
  { name: "is_recurring", label: "Terugkerend", type: "checkbox", help: "Herhaalt deze blokkade elk jaar op dezelfde datum, handig voor vaste feestdagen." },
  { name: "recurring_rule", label: "Herhaling (alleen bij terugkerend)", type: "select", options: ["yearly"], help: "Kies yearly als deze blokkade jaarlijks terugkomt." },
];

const columns = [
  { key: "title", label: "Titel" },
  { key: "reason", label: "Reden" },
  { key: "start_datetime", label: "Start", render: (row) => formatDateTime(row.start_datetime) },
  { key: "end_datetime", label: "Einde", render: (row) => formatDateTime(row.end_datetime) },
  { key: "is_recurring", label: "Jaarlijks", render: (row) => (row.is_recurring ? "Ja" : "Nee") },
];

export default function AdminBlockedPeriods() {
  return (
    <AdminLayout>
      <p className="mb-4 -mt-2 text-sm text-coffee/70">
        Vakanties, prive-dagen of feestdagen waarop niet geboekt kan worden. Bij Terugkerend wordt de blokkade elk jaar
        op dezelfde maand/dag herhaald.
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
