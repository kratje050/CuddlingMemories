import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";

const fields = [
  { name: "question", label: "Vraag", type: "text", required: true, wide: true },
  { name: "answer", label: "Antwoord", type: "textarea", required: true, wide: true },
  { name: "category", label: "Categorie", type: "text" },
  { name: "sort_order", label: "Sortering", type: "number" },
  { name: "is_visible", label: "Zichtbaar", type: "checkbox" },
];

const columns = [
  { key: "question", label: "Vraag" },
  { key: "category", label: "Categorie" },
  { key: "is_visible", label: "Zichtbaar", render: (row) => (row.is_visible ? "Ja" : "Nee") },
];

export default function AdminFaq() {
  return (
    <AdminLayout>
      <AdminCrudList
        title="Veelgestelde vragen"
        table="faq"
        fields={fields}
        columns={columns}
        emptyLabel="Nog geen vragen."
        newLabel="Vraag toevoegen"
      />
    </AdminLayout>
  );
}
