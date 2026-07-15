import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminCrudList from "../components/AdminCrudList.jsx";
import { shootTypeOptions } from "../utils/bookingStatuses.js";
import { supabase } from "../../lib/supabaseClient.js";

const fields = [
  { name: "title", label: "Naam pakket", type: "text", required: true, help: "Naam die op de pakkettenpagina en in de boekingsflow zichtbaar is." },
  { name: "slug", label: "Slug", type: "text", help: "Technische URL-/koppelnaam. Mag leeg blijven; dan wordt hij automatisch uit de pakketnaam gemaakt." },
  { name: "price", label: "Prijs (EUR)", type: "number", step: "0.01", required: true, help: "Basisprijs die bezoekers zien. Vul alleen het getal in, zonder euroteken." },
  { name: "price_unit", label: "Eenheid", type: "select", options: ["shoot", "item"], required: true, defaultValue: "shoot", help: "Geeft aan of de prijs per shoot of per extra item geldt." },
  { name: "shoot_type", label: "Gekoppelde shoot", type: "select", options: shootTypeOptions, help: "Bepaalt bij welke shoot dit pakket als keuze verschijnt in het boekingsformulier." },
  { name: "included_images", label: "Aantal beelden", type: "number", help: "Aantal digitale beelden dat standaard bij dit pakket inbegrepen is." },
  {
    name: "deposit_type",
    label: "Soort aanbetaling",
    type: "select",
    options: [
      { value: "none", label: "Geen aanbetaling" },
      { value: "fixed", label: "Vast bedrag" },
      { value: "percentage", label: "Percentage van pakketprijs" },
    ],
    defaultValue: "none",
    help: "Kies of voor dit pakket een aanbetaling nodig is en hoe die wordt berekend.",
  },
  { name: "deposit_value", label: "Aanbetaling (bedrag of percentage)", type: "number", step: "0.01", help: "Bij vast bedrag vul je euro's in. Bij percentage vul je bijvoorbeeld 25 in voor 25%. Laat leeg als geen aanbetaling geldt." },
  {
    name: "deposit_due_mode",
    label: "Moment van aanbetaling",
    type: "select",
    options: [
      { value: "booking", label: "Direct bij boeken" },
      { value: "before_shoot", label: "Aantal dagen voor de shoot" },
    ],
    defaultValue: "before_shoot",
    help: "Bij Direct bij boeken wordt de aanbetaling meteen gevraagd en wordt de boekingsdatum de uiterste betaaldatum.",
  },
  { name: "deposit_due_days_before_shoot", label: "Aanbetaling uiterlijk (dagen voor shoot)", type: "number", defaultValue: 7, help: "Wordt gebruikt als het betaalmoment Aantal dagen voor de shoot is. Bij een last-minute aanvraag wordt nooit een datum in het verleden getoond." },
  {
    name: "full_payment_due_mode",
    label: "Moment volledig bedrag",
    type: "select",
    options: [
      { value: "booking", label: "Direct bij boeken" },
      { value: "before_shoot", label: "Voor de shoot" },
      { value: "after_shoot", label: "Na de shoot" },
    ],
    defaultValue: "before_shoot",
    help: "Bij Na de shoot begint de termijn pas zodra je bij de boeking de werkelijke shootdatum invult. Dit is geschikt voor een bevalling.",
  },
  { name: "full_payment_due_days_before_shoot", label: "Aantal dagen voor/na de shoot", type: "number", defaultValue: 0, help: "Het aantal dagen hoort bij het gekozen moment. Na de shoot + 7 betekent dat het restbedrag zeven dagen na de werkelijke shootdatum betaald moet zijn." },
  { name: "cancellation_terms", label: "Annuleringsvoorwaarden", type: "textarea", wide: true, help: "Leg duidelijk uit wat er met de aanbetaling gebeurt bij annuleren of verplaatsen." },
  { name: "description", label: "Omschrijving", type: "textarea", wide: true, help: "Korte pakketomschrijving voor bezoekers. Benoem wat ze krijgen en voor wie het pakket bedoeld is." },
  { name: "extra_info", label: "Extra info", type: "textarea", wide: true, help: "Aanvullende regels of details, zoals levertijd, voorwaarden of extra opties." },
  { name: "button_text", label: "Knoptekst", type: "text", defaultValue: "Boek deze shoot", help: "Tekst op de knop bij dit pakket. Bijvoorbeeld Boek deze shoot." },
  { name: "is_addon", label: "Beschikbaar als add-on", type: "checkbox", help: "Maakt dit pakket een extra keuze naast het hoofdpakket. Laat Gekoppelde shoot leeg om de add-on bij alle shoots te tonen, of kies één shootsoort." },
  { name: "model_discount_eligible", label: "Beschikbaar voor modelshoot met 50% korting", type: "checkbox", help: "Toont dit hoofdpakket bij Model staan met 50% korting en halveert daar automatisch de pakketprijs. Bevalling blijft altijd uitgesloten." },
  { name: "sort_order", label: "Sortering", type: "number", defaultValue: 0, help: "Lager getal komt eerder op de pakkettenpagina." },
  { name: "is_featured", label: "Uitgelicht", type: "checkbox", help: "Markeert dit pakket als aanrader of veelgekozen optie." },
  { name: "is_published", label: "Gepubliceerd", type: "checkbox", defaultValue: true, help: "Alleen gepubliceerde pakketten zijn zichtbaar voor bezoekers en in de boekingsflow." },
];

const columns = [
  { key: "title", label: "Pakket" },
  { key: "price", label: "Prijs", render: (row) => `EUR ${Number(row.price).toFixed(2)}` },
  { key: "is_featured", label: "Uitgelicht", render: (row) => (row.is_featured ? "Ja" : "Nee") },
  { key: "is_addon", label: "Type", render: (row) => (row.is_addon ? "Add-on" : "Hoofdpakket") },
  { key: "model_discount_eligible", label: "Model 50%", render: (row) => (row.model_discount_eligible ? "Ja" : "Nee") },
  { key: "is_published", label: "Gepubliceerd", render: (row) => (row.is_published ? "Ja" : "Nee") },
  { key: "deposit_type", label: "Aanbetaling", render: (row) => formatDeposit(row) },
  { key: "full_payment_due_days_before_shoot", label: "Volledig bedrag", render: renderFullPaymentRule },
];

function formatDeposit(row) {
  if (!row.deposit_type || row.deposit_type === "none") return "Geen";
  const amount = row.deposit_type === "percentage" ? `${Number(row.deposit_value || 0)}%` : `EUR ${Number(row.deposit_value || 0).toFixed(2)}`;
  return row.deposit_due_mode === "booking" ? `${amount} direct` : amount;
}

function renderFullPaymentRule(row) {
  const days = Number(row.full_payment_due_days_before_shoot || 0);
  if (row.full_payment_due_mode === "booking") return "Direct bij boeken";
  if (row.full_payment_due_mode === "after_shoot") return days === 0 ? "Op werkelijke shootdag" : `${days} dagen erna`;
  return days === 0 ? "Op shootdag" : `${days} dagen vooraf`;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPackages() {
  const [albumShootTypes, setAlbumShootTypes] = useState([]);

  useEffect(() => {
    supabase
      .from("portfolio_albums")
      .select("title,category")
      .order("sort_order", { ascending: true })
      .then(({ data }) => setAlbumShootTypes((data || []).flatMap(albumToShootTypes).filter(Boolean)));
  }, []);

  const dynamicFields = useMemo(() => fields.map((field) => field.name === "shoot_type"
    ? { ...field, options: [...new Set([...shootTypeOptions, ...albumShootTypes])] }
    : field), [albumShootTypes]);

  const ensureShootAvailability = async ({ payload }) => {
    if (payload.is_addon || payload.price_unit !== "shoot" || !payload.shoot_type || !payload.is_published) return;
    const { data: existing, error: lookupError } = await supabase
      .from("shoot_type_settings")
      .select("id")
      .eq("shoot_type", payload.shoot_type)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return;
    const { error } = await supabase.from("shoot_type_settings").insert({
      shoot_type: payload.shoot_type,
      duration_minutes: 60,
      buffer_before_minutes: 15,
      buffer_after_minutes: 15,
      max_per_day: 2,
      is_bookable: true,
      allowed_days: [0, 1, 2, 3, 4, 5, 6],
    });
    if (error) throw error;
  };

  return (
    <AdminLayout>
      <AdminCrudList
        title="Pakketten"
        table="packages"
        fields={dynamicFields}
        columns={columns}
        emptyLabel="Nog geen pakketten."
        newLabel="Pakket toevoegen"
        onSaved={ensureShootAvailability}
        reorderable
        filterRows={(row) => row.price_unit !== "km" && String(row.slug || "").toLowerCase() !== "reiskosten"}
        preparePayload={(payload) => {
          const isBirthPackage = `${payload.title || ""} ${payload.shoot_type || ""}`.toLowerCase().includes("bevalling");
          return {
          ...payload,
          slug: payload.slug || slugify(payload.title),
          price_unit: payload.price_unit || "shoot",
          deposit_type: payload.deposit_type || "none",
          deposit_value: payload.deposit_type === "none" ? null : payload.deposit_value,
          deposit_due_mode: payload.deposit_due_mode || "before_shoot",
          deposit_due_days_before_shoot: payload.deposit_due_days_before_shoot ?? 7,
          full_payment_due_mode: payload.full_payment_due_mode || "before_shoot",
          full_payment_due_days_before_shoot: payload.full_payment_due_days_before_shoot ?? 0,
          button_text: payload.button_text || "Boek deze shoot",
          is_addon: Boolean(payload.is_addon),
          model_discount_eligible: !isBirthPackage && !payload.is_addon && Boolean(payload.model_discount_eligible),
          sort_order: payload.sort_order ?? 0,
          is_published: Boolean(payload.is_published),
        };}}
      />
    </AdminLayout>
  );
}

const categoryShootTypeMap = {
  Zwangerschap: "Zwangerschapsshoot",
  Newborn: "Newbornshoot",
  Gezin: "Gezinsshoot",
  Cakesmash: "Cakesmash",
  Portret: "Portretshoot",
  Motherhood: "Motherhood",
  "Buiten shoots": "Buiten shoot",
  Bevalling: "Bevalling",
};

function albumToShootTypes(album) {
  const title = album.title?.trim() || "";
  const mappedCategory = categoryShootTypeMap[album.category] || "";
  if (!title) return mappedCategory ? [mappedCategory] : [];
  if (!mappedCategory || title !== album.category) return [...new Set([mappedCategory, title].filter(Boolean))];
  return [mappedCategory];
}
