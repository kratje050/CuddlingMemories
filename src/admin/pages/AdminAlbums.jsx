import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { portfolioCategories } from "../utils/portfolioCategories.js";

const fields = [
  { name: "title", label: "Titel", type: "text", required: true },
  { name: "slug", label: "Slug", type: "text", required: true },
  { name: "category", label: "Categorie", type: "select", options: portfolioCategories, required: true },
  { name: "description", label: "Omschrijving", type: "textarea", wide: true },
  { name: "cover_image_url", label: "Cover-afbeelding (URL)", type: "text", wide: true },
  { name: "sort_order", label: "Sortering", type: "number" },
  { name: "is_featured", label: "Uitgelicht", type: "checkbox" },
  { name: "is_published", label: "Gepubliceerd", type: "checkbox" },
];

const columns = [
  { key: "title", label: "Album" },
  { key: "category", label: "Categorie" },
  { key: "is_published", label: "Gepubliceerd", render: (row) => (row.is_published ? "Ja" : "Nee") },
];

export default function AdminAlbums() {
  return (
    <AdminLayout>
      <AdminCrudList
        title="Portfolio-albums"
        table="portfolio_albums"
        fields={fields}
        columns={columns}
        emptyLabel="Nog geen albums."
        newLabel="Album toevoegen"
      />
    </AdminLayout>
  );
}
