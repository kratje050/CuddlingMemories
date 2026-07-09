import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";

const fields = [
  { name: "question", label: "Vraag", type: "text", required: true, wide: true, help: "De vraag zoals bezoekers die in de FAQ zien." },
  { name: "answer", label: "Antwoord", type: "textarea", required: true, wide: true, help: "Het antwoord dat openklapt onder de vraag. Houd dit duidelijk en praktisch." },
  { name: "category", label: "Categorie", type: "text", help: "Interne of zichtbare groepering, bijvoorbeeld Boeken, Betaling of Fotoshoot." },
  { name: "sort_order", label: "Sortering", type: "number", help: "Lager getal komt eerder in de lijst met veelgestelde vragen." },
  { name: "is_visible", label: "Zichtbaar", type: "checkbox", help: "Alleen zichtbare vragen verschijnen op de website." },
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
