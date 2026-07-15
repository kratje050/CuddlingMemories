import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";

const fieldGroups = [
  {
    heading: "Algemeen",
    fields: [
      { name: "site_name", label: "Naam website", type: "text", help: "Naam die gebruikt wordt in browser-/SEO-titels en algemene site-instellingen." },
      { name: "logo_text", label: "Logo-tekst", type: "text", help: "Tekst in het logo linksboven in de navigatie en footer." },
      { name: "subtitle", label: "Subtitel", type: "text", help: "Kleine tekst onder het logo, bijvoorbeeld Fotografie." },
      { name: "primary_email", label: "Contact-e-mailadres", type: "text", help: "Algemeen contactadres voor de website. Dit is niet hetzelfde als het SMTP-wachtwoord." },
    ],
  },
  {
    heading: "Social media",
    fields: [
      { name: "instagram_url", label: "Instagram-link", type: "text", help: "Link waar de Instagram-knop in de footer naartoe gaat." },
      { name: "facebook_url", label: "Facebook-link", type: "text", help: "Link waar de Facebook-knop in de footer naartoe gaat." },
    ],
  },
  {
    heading: "Home-hero",
    fields: [
      { name: "hero_title", label: "Hero-titel", type: "text", help: "Grote hoofdtekst op de homepage." },
      { name: "hero_subtitle", label: "Hero-subtitel", type: "text", help: "Korte tekst onder de hoofdtitel op de homepage." },
    ],
  },
  {
    heading: "Portfolio",
    fields: [
      {
        name: "portfolio_album_limit",
        label: "Aantal albums op portfolio",
        type: "number",
        min: 1,
        max: 24,
        help: "Bepaalt hoeveel gepubliceerde albums bovenaan de portfoliopagina worden getoond. Kies bijvoorbeeld 8 om alle huidige albums zichtbaar te maken.",
      },
    ],
  },
  {
    heading: "Footer",
    fields: [{ name: "footer_text", label: "Footer-tekst", type: "textarea", help: "Korte omschrijving onder het logo onderaan de website." }],
  },
  {
    heading: "Standaard SEO",
    fields: [
      { name: "default_seo_title", label: "Standaard SEO-titel", type: "text", help: "Fallback titel voor zoekmachines als een pagina geen eigen SEO-titel heeft." },
      { name: "default_seo_description", label: "Standaard SEO-omschrijving", type: "textarea", help: "Fallback omschrijving voor zoekmachines en gedeelde links." },
    ],
  },
];

function FieldHelp({ children }) {
  if (!children) return null;
  return <p className="-mt-1 text-xs font-normal leading-5 text-coffee/55">{children}</p>;
}

export default function AdminSettings() {
  const [id, setId] = useState(null);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setId(data.id);
          setValues(data);
        }
        setLoading(false);
      });
  }, []);

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("site_settings").update(values).eq("id", id);

    setSaving(false);
    setFeedback(error ? { type: "error", message: error.message } : { type: "success", message: "Opgeslagen." });
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-sm text-coffee/70">Laden...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="display-title text-3xl font-semibold text-coffee">Website-instellingen</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-6">
        {fieldGroups.map((group) => (
          <div key={group.heading} className="rounded-lg bg-card p-5 shadow-soft warm-border">
            <h2 className="fine-label text-[0.65rem] text-cocoa">{group.heading}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <label key={field.name} className="grid gap-2 text-sm font-semibold text-coffee sm:col-span-2">
                  {field.label}
                  <FieldHelp>{field.help}</FieldHelp>
                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={values[field.name] || ""}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      min={field.min}
                      max={field.max}
                      value={values[field.name] ?? ""}
                      onChange={(event) =>
                        handleChange(
                          field.name,
                          field.type === "number" ? Number(event.target.value) : event.target.value
                        )
                      }
                      className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        {feedback && (
          <p
            className={`rounded-lg px-4 py-3 text-sm ${
              feedback.type === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <div className="flex gap-3">
          <AdminButton type="submit" disabled={saving}>
            {saving ? "Opslaan..." : "Opslaan"}
          </AdminButton>
        </div>
      </form>
    </AdminLayout>
  );
}
