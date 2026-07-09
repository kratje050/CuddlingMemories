import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { portfolioCategories } from "../utils/portfolioCategories.js";

const fields = [
  { name: "title", label: "Titel", type: "text", required: true, help: "Naam van het album zoals bezoekers die zien op de portfolio-pagina." },
  { name: "slug", label: "Slug", type: "text", required: true, help: "Het stukje URL van het album, bijvoorbeeld newborn. Gebruik kleine letters, cijfers en streepjes." },
  { name: "category", label: "Categorie", type: "select", options: portfolioCategories, required: true, help: "Bepaalt onder welke filter en fotocategorie dit album valt." },
  { name: "description", label: "Omschrijving", type: "textarea", wide: true, help: "Korte tekst boven of bij het album. Leg uit wat voor shoot of sfeer bezoekers hier zien." },
  { name: "cover_image_url", label: "Cover-afbeelding (URL)", type: "text", wide: true, help: "Afbeelding die als omslag van het album wordt gebruikt. Laat leeg als je later een foto als cover gebruikt." },
  { name: "sort_order", label: "Sortering", type: "number", help: "Lager getal komt eerder in de lijst. Gebruik 1, 2, 3 om de volgorde te sturen." },
  { name: "is_featured", label: "Uitgelicht", type: "checkbox", help: "Laat dit album extra prominent terugkomen op plekken waar uitgelichte albums worden getoond." },
  { name: "is_published", label: "Gepubliceerd", type: "checkbox", help: "Alleen gepubliceerde albums zijn zichtbaar voor bezoekers." },
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
