import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { waitlistFlexibilityOptions, waitlistStatuses } from "../../lib/waitlist.js";
import { shootTypeOptions } from "../utils/bookingStatuses.js";
import { formatDate } from "../../lib/formatDate.js";

const fields = [
  { name: "customer_name", label: "Naam", type: "text", required: true, help: "Naam van de persoon op de wachtlijst." },
  { name: "customer_email", label: "E-mail", type: "text", required: true, help: "E-mailadres voor contact als er plek vrijkomt." },
  { name: "shoot_type", label: "Gewenste shoot", type: "select", options: shootTypeOptions, required: true, help: "Soort shoot waarvoor iemand wacht." },
  { name: "preferred_date", label: "Gewenste datum", type: "date", help: "Specifieke voorkeursdatum als die is opgegeven." },
  { name: "preferred_month", label: "Gewenste maand", type: "text", placeholder: "2026-08", help: "Maand in formaat JJJJ-MM als het om een maand gaat." },
  { name: "flexibility", label: "Flexibiliteit", type: "select", options: waitlistFlexibilityOptions, help: "Geeft aan hoeveel alternatieve momenten passen." },
  { name: "status", label: "Status", type: "select", options: waitlistStatuses, required: true, help: "Waar deze wachtlijst-aanmelding nu staat." },
  { name: "message", label: "Bericht klant", type: "textarea", wide: true, help: "Bericht dat de bezoeker heeft meegestuurd." },
  { name: "internal_note", label: "Interne notitie", type: "textarea", wide: true, help: "Alleen zichtbaar in admin. Handig voor opvolging." },
  { name: "converted_booking_id", label: "Omgezette boeking ID", type: "text", help: "Koppel hier eventueel de boeking als deze wachtlijst-aanmelding is omgezet." },
];

const columns = [
  { key: "customer_name", label: "Naam" },
  { key: "shoot_type", label: "Shoot" },
  { key: "preferred_month", label: "Maand" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Aangemaakt", render: (row) => formatDate(row.created_at) },
];

export default function AdminWaitlist() {
  return (
    <AdminLayout>
      <AdminCrudList title="Wachtlijst" table="waitlist_entries" fields={fields} columns={columns} orderBy="created_at" emptyLabel="Nog geen wachtlijst-aanmeldingen." newLabel="Wachtlijst-item toevoegen" />
    </AdminLayout>
  );
}
