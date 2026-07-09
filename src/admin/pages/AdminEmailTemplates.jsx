import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";

const fields = [
  { name: "template_key", label: "Template sleutel", type: "text", required: true, help: "Technische naam, bijvoorbeeld gallery_ready. Deze wordt door de mailfunctie gebruikt." },
  { name: "label", label: "Naam in admin", type: "text", required: true, help: "Herkenbare naam voor dit template in het overzicht." },
  { name: "subject", label: "Onderwerp", type: "text", required: true, help: "Onderwerpregel die de klant in de inbox ziet." },
  { name: "body", label: "Tekst", type: "textarea", rows: 8, wide: true, required: true, help: "Mailtekst. Je kunt variabelen gebruiken zoals {{customer_name}}, {{shoot_type}}, {{gallery_link}} en {{included_images}}. Het warme Cuddling Memories ontwerp wordt automatisch om deze tekst heen gezet." },
  { name: "is_active", label: "Actief", type: "checkbox", help: "Alleen actieve templates worden gebruikt voor automatische mails." },
];

const columns = [
  { key: "label", label: "Template" },
  { key: "template_key", label: "Sleutel" },
  { key: "subject", label: "Onderwerp" },
  { key: "is_active", label: "Actief", render: (row) => (row.is_active ? "Ja" : "Nee") },
];

export default function AdminEmailTemplates() {
  return (
    <AdminLayout>
      <AdminCrudList
        title="E-mailtemplates"
        table="email_templates"
        fields={fields}
        columns={columns}
        orderBy="template_key"
        emptyLabel="Nog geen e-mailtemplates."
        newLabel="Template toevoegen"
      />
    </AdminLayout>
  );
}
