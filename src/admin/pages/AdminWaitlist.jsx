import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { waitlistFlexibilityOptions, waitlistStatuses } from "../../lib/waitlist.js";
import { shootTypeOptions } from "../utils/bookingStatuses.js";
import { formatDate } from "../../lib/formatDate.js";
import { sendTemplateEmail } from "../utils/sendTemplateEmail.js";

const fields = [
  { name: "customer_name", label: "Naam", type: "text", required: true, help: "Naam van de persoon op de wachtlijst." },
  { name: "customer_email", label: "E-mail", type: "text", required: true, help: "E-mailadres voor contact als er plek vrijkomt." },
  { name: "shoot_type", label: "Gewenste shoot", type: "select", options: shootTypeOptions, required: true, help: "Soort shoot waarvoor iemand wacht." },
  { name: "preferred_date", label: "Gewenste datum", type: "date", help: "Specifieke voorkeursdatum als die is opgegeven." },
  { name: "preferred_month", label: "Gewenste maand", type: "text", placeholder: "2026-08", help: "Maand in formaat JJJJ-MM als het om een maand gaat." },
  { name: "flexibility", label: "Flexibiliteit", type: "select", options: waitlistFlexibilityOptions, help: "Geeft aan hoeveel alternatieve momenten passen." },
  { name: "status", label: "Status", type: "select", options: waitlistStatuses, required: true, help: "Waar deze wachtlijst-aanmelding nu staat." },
  { name: "auto_contact_enabled", label: "Automatisch benaderen", type: "checkbox", defaultValue: true, help: "Als dit aanstaat, mailt het systeem deze persoon automatisch zodra die als eerstvolgende wachtende bij een vrije plek past." },
  { name: "message", label: "Bericht klant", type: "textarea", wide: true, help: "Bericht dat de bezoeker heeft meegestuurd." },
  { name: "internal_note", label: "Interne notitie", type: "textarea", wide: true, help: "Alleen zichtbaar in admin. Handig voor opvolging." },
  { name: "converted_booking_id", label: "Omgezette boeking ID", type: "text", help: "Koppel hier eventueel de boeking als deze wachtlijst-aanmelding is omgezet." },
];

const columns = [
  { key: "customer_name", label: "Naam" },
  { key: "shoot_type", label: "Shoot" },
  { key: "preferred_month", label: "Maand" },
  { key: "status", label: "Status" },
  { key: "auto_contact_enabled", label: "Automatisch", render: (row) => row.auto_contact_enabled ? "Aan" : "Uit" },
  { key: "invitation_expires_at", label: "Aanbod geldig tot", render: (row) => row.invitation_expires_at ? formatDate(row.invitation_expires_at) : "-" },
  { key: "created_at", label: "Aangemaakt", render: (row) => formatDate(row.created_at) },
];

export default function AdminWaitlist() {
  const handleSaved = async ({ payload, editingRow, isNew }) => {
    if (isNew || !editingRow || payload.status === editingRow.status) return;
    if (!["Benaderd", "Omgezet naar boeking", "Niet meer nodig"].includes(payload.status)) return;
    const messages = {
      Benaderd: "Er is mogelijk een passende plek. Controleer je e-mail of neem contact met mij op om af te stemmen.",
      "Omgezet naar boeking": "Je wachtlijstaanmelding is omgezet naar een boekingsaanvraag.",
      "Niet meer nodig": "Je wachtlijstaanmelding is afgerond en staat niet langer actief.",
    };
    await sendTemplateEmail({
      recipientEmail: payload.customer_email,
      templateKey: "waitlist_status",
      variables: { customer_name: payload.customer_name, shoot_type: payload.shoot_type, request_status: payload.status, status_message: messages[payload.status] },
    });
  };

  return (
    <AdminLayout>
      <AdminCrudList title="Wachtlijst" table="waitlist_entries" fields={fields} columns={columns} orderBy="created_at" emptyLabel="Nog geen wachtlijst-aanmeldingen." newLabel="Wachtlijst-item toevoegen" onSaved={handleSaved} />
    </AdminLayout>
  );
}
