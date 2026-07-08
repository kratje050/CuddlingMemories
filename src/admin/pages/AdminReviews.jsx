import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { shootTypeOptions } from "../utils/bookingStatuses.js";

const fields = [
  { name: "name", label: "Naam", type: "text", required: true },
  { name: "rating", label: "Sterren (1-5)", type: "number" },
  { name: "shoot_type", label: "Shoot type", type: "select", options: shootTypeOptions },
  { name: "text", label: "Review-tekst", type: "textarea", required: true, wide: true },
  { name: "sort_order", label: "Sortering", type: "number" },
  { name: "is_visible", label: "Zichtbaar", type: "checkbox" },
];

const columns = [
  { key: "name", label: "Naam" },
  { key: "rating", label: "Sterren" },
  { key: "is_visible", label: "Zichtbaar", render: (row) => (row.is_visible ? "Ja" : "Nee") },
];

export default function AdminReviews() {
  return (
    <AdminLayout>
      <AdminCrudList
        title="Reviews"
        table="testimonials"
        fields={fields}
        columns={columns}
        emptyLabel="Nog geen reviews."
        newLabel="Review toevoegen"
      />
    </AdminLayout>
  );
}
