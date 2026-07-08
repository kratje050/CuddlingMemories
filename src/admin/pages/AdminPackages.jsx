import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { shootTypeOptions } from "../utils/bookingStatuses.js";

const fields = [
  { name: "title", label: "Naam pakket", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true },
  { name: "price", label: "Prijs (€)", type: "number", step: "0.01", required: true },
  { name: "price_unit", label: "Eenheid", type: "select", options: ["shoot", "item", "km"], required: true },
  { name: "shoot_type", label: "Gekoppelde shoot", type: "select", options: shootTypeOptions },
  { name: "included_images", label: "Aantal beelden", type: "number" },
  { name: "description", label: "Omschrijving", type: "textarea", wide: true },
  { name: "extra_info", label: "Extra info", type: "textarea", wide: true },
  { name: "button_text", label: "Knoptekst", type: "text" },
  { name: "sort_order", label: "Sortering", type: "number" },
  { name: "is_featured", label: "Uitgelicht", type: "checkbox" },
  { name: "is_published", label: "Gepubliceerd", type: "checkbox" },
];

const columns = [
  { key: "title", label: "Pakket" },
  { key: "price", label: "Prijs", render: (row) => `€${Number(row.price).toFixed(2)}` },
  { key: "is_featured", label: "Uitgelicht", render: (row) => (row.is_featured ? "Ja" : "Nee") },
  { key: "is_published", label: "Gepubliceerd", render: (row) => (row.is_published ? "Ja" : "Nee") },
];

export default function AdminPackages() {
  return (
    <AdminLayout>
      <AdminCrudList
        title="Pakketten"
        table="packages"
        fields={fields}
        columns={columns}
        emptyLabel="Nog geen pakketten."
        newLabel="Pakket toevoegen"
      />
    </AdminLayout>
  );
}
