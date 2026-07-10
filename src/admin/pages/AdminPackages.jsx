import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { shootTypeOptions } from "../utils/bookingStatuses.js";

const fields = [
  { name: "title", label: "Naam pakket", type: "text", required: true, help: "Naam die op de pakkettenpagina en in de boekingsflow zichtbaar is." },
  { name: "slug", label: "Slug", type: "text", help: "Technische URL-/koppelnaam. Mag leeg blijven; dan wordt hij automatisch uit de pakketnaam gemaakt." },
  { name: "price", label: "Prijs (EUR)", type: "number", step: "0.01", required: true, help: "Basisprijs die bezoekers zien. Vul alleen het getal in, zonder euroteken." },
  { name: "price_unit", label: "Eenheid", type: "select", options: ["shoot", "item", "km"], required: true, defaultValue: "shoot", help: "Geeft aan of de prijs per shoot, per extra item of per kilometer geldt." },
  { name: "shoot_type", label: "Gekoppelde shoot", type: "select", options: shootTypeOptions, help: "Bepaalt bij welke shoot dit pakket als keuze verschijnt in het boekingsformulier." },
  { name: "included_images", label: "Aantal beelden", type: "number", help: "Aantal digitale beelden dat standaard bij dit pakket inbegrepen is." },
  { name: "description", label: "Omschrijving", type: "textarea", wide: true, help: "Korte pakketomschrijving voor bezoekers. Benoem wat ze krijgen en voor wie het pakket bedoeld is." },
  { name: "extra_info", label: "Extra info", type: "textarea", wide: true, help: "Aanvullende regels of details, zoals levertijd, voorwaarden of extra opties." },
  { name: "button_text", label: "Knoptekst", type: "text", defaultValue: "Boek deze shoot", help: "Tekst op de knop bij dit pakket. Bijvoorbeeld Boek deze shoot." },
  { name: "sort_order", label: "Sortering", type: "number", defaultValue: 0, help: "Lager getal komt eerder op de pakkettenpagina." },
  { name: "is_featured", label: "Uitgelicht", type: "checkbox", help: "Markeert dit pakket als aanrader of veelgekozen optie." },
  { name: "is_published", label: "Gepubliceerd", type: "checkbox", defaultValue: true, help: "Alleen gepubliceerde pakketten zijn zichtbaar voor bezoekers en in de boekingsflow." },
];

const columns = [
  { key: "title", label: "Pakket" },
  { key: "price", label: "Prijs", render: (row) => `EUR ${Number(row.price).toFixed(2)}` },
  { key: "is_featured", label: "Uitgelicht", render: (row) => (row.is_featured ? "Ja" : "Nee") },
  { key: "is_published", label: "Gepubliceerd", render: (row) => (row.is_published ? "Ja" : "Nee") },
];

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
        preparePayload={(payload) => ({
          ...payload,
          slug: payload.slug || slugify(payload.title),
          price_unit: payload.price_unit || "shoot",
          button_text: payload.button_text || "Boek deze shoot",
          sort_order: payload.sort_order ?? 0,
          is_published: Boolean(payload.is_published),
        })}
      />
    </AdminLayout>
  );
}
