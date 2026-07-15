import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { createGiftcardCode, deliveryMethods, giftcardStatuses, giftcardTypes } from "../../lib/giftcards.js";
import { formatDate } from "../../lib/formatDate.js";
import { sendTemplateEmail } from "../utils/sendTemplateEmail.js";

const fields = [
  { name: "purchaser_name", label: "Naam aanvrager", type: "text", required: true, help: "Persoon die de cadeaubon aanvraagt." },
  { name: "purchaser_email", label: "E-mail aanvrager", type: "text", required: true, help: "E-mailadres voor betaling en bevestiging." },
  { name: "recipient_name", label: "Naam ontvanger", type: "text", help: "Voor wie de cadeaubon bedoeld is." },
  { name: "giftcard_type", label: "Soort cadeaubon", type: "select", options: giftcardTypes, help: "Vrij bedrag of specifiek pakket." },
  { name: "amount", label: "Bedrag", type: "number", step: "0.01", help: "Waarde van de cadeaubon. Vul alleen het getal in." },
  { name: "delivery_method", label: "Leverwijze", type: "select", options: deliveryMethods, help: "Hoe de cadeaubon geleverd moet worden." },
  { name: "code", label: "Unieke code", type: "text", placeholder: createGiftcardCode(), help: "Code die op de cadeaubon komt. Bijvoorbeeld CM-A1B2C3." },
  { name: "status", label: "Status", type: "select", options: giftcardStatuses, required: true, help: "Betaal-, verzend- en gebruiksstatus." },
  { name: "expires_at", label: "Vervaldatum", type: "date", help: "Datum waarop de cadeaubon verloopt." },
  { name: "paid_at", label: "Betaald op", type: "datetime-local", help: "Vul dit wanneer de betaling binnen is." },
  { name: "sent_at", label: "Verzonden op", type: "datetime-local", help: "Vul dit wanneer de cadeaubon verstuurd is." },
  { name: "used_at", label: "Gebruikt op", type: "datetime-local", help: "Vul dit wanneer de cadeaubon is ingewisseld." },
  { name: "personal_message", label: "Persoonlijke boodschap", type: "textarea", wide: true, help: "Tekst van de aanvrager voor de ontvanger." },
  { name: "internal_note", label: "Interne notitie", type: "textarea", wide: true, help: "Alleen zichtbaar in admin." },
];

const columns = [
  { key: "purchaser_name", label: "Aanvrager" },
  { key: "recipient_name", label: "Ontvanger" },
  { key: "amount", label: "Bedrag", render: (row) => (row.amount ? `EUR ${Number(row.amount).toFixed(2)}` : "-") },
  { key: "status", label: "Status" },
  { key: "expires_at", label: "Vervalt", render: (row) => (row.expires_at ? formatDate(row.expires_at) : "-") },
  {
    key: "redeemed_booking_id",
    label: "Verzilverd",
    render: (row) =>
      row.redeemed_booking_id ? (
        <Link
          to={`/admin/bookings/${row.redeemed_booking_id}`}
          onClick={(event) => event.stopPropagation()}
          className="font-semibold text-cocoa underline"
        >
          Bekijk boeking
        </Link>
      ) : (
        "Nee"
      ),
  },
];

export default function AdminGiftcards() {
  const handleSaved = async ({ payload, editingRow, isNew }) => {
    if (isNew || !editingRow || payload.status === editingRow.status) return;
    if (!["Betaald", "Verzonden", "Verlopen", "Geannuleerd"].includes(payload.status)) return;
    const messages = {
      Betaald: "De betaling is ontvangen. De cadeaubon wordt verder klaargemaakt.",
      Verzonden: "De cadeaubon is verzonden naar de afgesproken ontvanger.",
      Verlopen: "De geldigheid van deze cadeaubon is verlopen.",
      Geannuleerd: "De aanvraag voor deze cadeaubon is geannuleerd.",
    };
    await sendTemplateEmail({
      recipientEmail: payload.purchaser_email,
      templateKey: "giftcard_status",
      variables: {
        customer_name: payload.purchaser_name,
        recipient_name: payload.recipient_name || "de ontvanger",
        request_status: payload.status,
        giftcard_code: payload.code || "Wordt nog aangemaakt",
        giftcard_amount: payload.amount ? `EUR ${Number(payload.amount).toFixed(2)}` : payload.giftcard_type,
        status_message: messages[payload.status],
      },
    });
  };

  return (
    <AdminLayout>
      <AdminCrudList title="Cadeaubonnen" table="giftcards" fields={fields} columns={columns} orderBy="created_at" emptyLabel="Nog geen cadeaubonnen." newLabel="Cadeaubon toevoegen" onSaved={handleSaved} />
    </AdminLayout>
  );
}
