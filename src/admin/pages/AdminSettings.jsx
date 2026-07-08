import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";

const fieldGroups = [
  {
    heading: "Algemeen",
    fields: [
      { name: "site_name", label: "Naam website", type: "text" },
      { name: "logo_text", label: "Logo-tekst", type: "text" },
      { name: "subtitle", label: "Subtitel", type: "text" },
      { name: "primary_email", label: "Contact-e-mailadres", type: "text" },
    ],
  },
  {
    heading: "Social media",
    fields: [
      { name: "instagram_url", label: "Instagram-link", type: "text" },
      { name: "facebook_url", label: "Facebook-link", type: "text" },
    ],
  },
  {
    heading: "Home-hero",
    fields: [
      { name: "hero_title", label: "Hero-titel", type: "text" },
      { name: "hero_subtitle", label: "Hero-subtitel", type: "text" },
    ],
  },
  {
    heading: "Footer",
    fields: [{ name: "footer_text", label: "Footer-tekst", type: "textarea" }],
  },
  {
    heading: "Standaard SEO",
    fields: [
      { name: "default_seo_title", label: "Standaard SEO-titel", type: "text" },
      { name: "default_seo_description", label: "Standaard SEO-omschrijving", type: "textarea" },
    ],
  },
];

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
                  {field.type === "textarea" ? (
                    <textarea
                      rows={3}
                      value={values[field.name] || ""}
                      onChange={(event) => handleChange(field.name, event.target.value)}
                      className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                    />
                  ) : (
                    <input
                      type="text"
                      value={values[field.name] || ""}
                      onChange={(event) => handleChange(field.name, event.target.value)}
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
