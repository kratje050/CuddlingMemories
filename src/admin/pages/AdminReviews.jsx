import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { shootTypeOptions } from "../utils/bookingStatuses.js";

const fields = [
  { name: "name", label: "Naam", type: "text", required: true, help: "Naam die onder de review komt te staan. Gebruik eventueel alleen een voornaam." },
  { name: "rating", label: "Sterren (1-5)", type: "number", help: "Beoordeling in sterren. Gebruik een getal van 1 tot en met 5." },
  { name: "shoot_type", label: "Shoot type", type: "select", options: shootTypeOptions, help: "Koppelt de review aan een soort shoot, zodat bezoekers herkenbare ervaringen zien." },
  { name: "text", label: "Review-tekst", type: "textarea", required: true, wide: true, help: "De quote of ervaring van de klant zoals die op de site zichtbaar wordt." },
  { name: "sort_order", label: "Sortering", type: "number", help: "Lager getal komt eerder in de reviews." },
  { name: "is_visible", label: "Zichtbaar", type: "checkbox", help: "Zet uit als je de review tijdelijk wilt bewaren zonder hem te tonen." },
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
