import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { createDiscountCode, discountTypes, formatDiscountValue } from "../../lib/discountCodes.js";
import { formatDate } from "../../lib/formatDate.js";

const discountTypeLabels = { percentage: "Percentage", vast_bedrag: "Vast bedrag" };

const fields = [
  { name: "code", label: "Code", type: "text", required: true, placeholder: createDiscountCode(), help: "Code die de klant bij het boeken invult. Bijvoorbeeld KORTING-A1B2C3." },
  { name: "description", label: "Omschrijving", type: "text", help: "Interne naam, bijvoorbeeld 'Black Friday actie'. Niet zichtbaar voor de klant." },
  { name: "discount_type", label: "Soort korting", type: "select", options: discountTypes.map((value) => ({ value, label: discountTypeLabels[value] })), required: true },
  { name: "discount_value", label: "Waarde", type: "number", step: "0.01", required: true, help: "Bij percentage: getal tussen 0 en 100. Bij vast bedrag: bedrag in euro's." },
  { name: "usage_limit", label: "Maximaal aantal keer te gebruiken", type: "number", help: "Leeg laten voor onbeperkt vaak te gebruiken." },
  { name: "is_active", label: "Actief", type: "checkbox", help: "Alleen actieve, niet-verlopen codes zijn bruikbaar bij het boeken." },
  { name: "expires_at", label: "Vervaldatum", type: "date", help: "Optioneel. Na deze datum werkt de code niet meer." },
];

const columns = [
  { key: "code", label: "Code" },
  { key: "description", label: "Omschrijving", render: (row) => row.description || "-" },
  { key: "discount_value", label: "Korting", render: (row) => formatDiscountValue(row.discount_type, row.discount_value) },
  { key: "times_used", label: "Gebruikt", render: (row) => `${row.times_used || 0}${row.usage_limit ? ` / ${row.usage_limit}` : ""}` },
  {
    key: "is_active",
    label: "Status",
    render: (row) => {
      const expired = row.expires_at && row.expires_at < new Date().toISOString().slice(0, 10);
      if (expired) return "Verlopen";
      return row.is_active ? "Actief" : "Inactief";
    },
  },
  { key: "expires_at", label: "Vervalt", render: (row) => (row.expires_at ? formatDate(row.expires_at) : "-") },
];

// Kortingscodes zijn hoofdlettergevoelig: wat je hier intypt is exact de
// code die de klant moet invullen (geen automatische hoofdletters).
const preparePayload = (payload) => ({ ...payload, code: (payload.code || "").trim() });

export default function AdminDiscountCodes() {
  return (
    <AdminLayout>
      <AdminCrudList
        title="Kortingscodes"
        table="discount_codes"
        fields={fields}
        columns={columns}
        orderBy="created_at"
        emptyLabel="Nog geen kortingscodes."
        newLabel="Kortingscode toevoegen"
        preparePayload={preparePayload}
      />
    </AdminLayout>
  );
}
