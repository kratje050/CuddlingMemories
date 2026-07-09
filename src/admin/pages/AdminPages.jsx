import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";

const pageSlugs = [
  { slug: "home", label: "Home" },
  { slug: "over-demy", label: "Over Demy" },
  { slug: "werkwijze", label: "Werkwijze" },
  { slug: "privacybeleid", label: "Privacybeleid" },
];

const slugsWithSections = ["werkwijze", "privacybeleid"];

function FieldHelp({ children }) {
  return <p className="-mt-1 text-xs font-normal leading-5 text-coffee/55">{children}</p>;
}

export default function AdminPages() {
  const [activeSlug, setActiveSlug] = useState("home");
  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFeedback(null);

    async function load() {
      const { data: pageData } = await supabase.from("pages").select("*").eq("slug", activeSlug).maybeSingle();
      let sectionData = [];
      if (slugsWithSections.includes(activeSlug)) {
        const { data } = await supabase
          .from("page_sections")
          .select("*")
          .eq("page_slug", activeSlug)
          .order("sort_order", { ascending: true });
        sectionData = data || [];
      }
      if (!active) return;
      setPage(pageData);
      setSections(sectionData);
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [activeSlug]);

  const handleFieldChange = (name, value) => {
    setPage((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePage = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    const { error } = await supabase
      .from("pages")
      .update({
        title: page.title,
        subtitle: page.subtitle,
        content: page.content,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
        is_published: page.is_published,
      })
      .eq("id", page.id);

    setSaving(false);
    setFeedback(error ? { type: "error", message: error.message } : { type: "success", message: "Opgeslagen." });
  };

  const handleSectionChange = (id, field, value) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, [field]: value } : section)));
  };

  const handleSaveSection = async (section) => {
    setSaving(true);
    const { error } = await supabase
      .from("page_sections")
      .update({ title: section.title, content: section.content, is_visible: section.is_visible })
      .eq("id", section.id);
    setSaving(false);
    setFeedback(error ? { type: "error", message: error.message } : { type: "success", message: "Sectie opgeslagen." });
  };

  return (
    <AdminLayout>
      <h1 className="display-title text-3xl font-semibold text-coffee">Pagina's</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {pageSlugs.map((item) => (
          <button
            key={item.slug}
            type="button"
            onClick={() => setActiveSlug(item.slug)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              activeSlug === item.slug ? "bg-cocoa text-card" : "border border-cocoa/25 text-coffee hover:bg-linen"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading || !page ? (
        <p className="mt-6 text-sm text-coffee/70">Laden...</p>
      ) : (
        <>
          <form onSubmit={handleSavePage} className="mt-6 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border">
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Titel
              <FieldHelp>Hoofdtitel van deze pagina. Deze tekst zien bezoekers op de pagina zelf.</FieldHelp>
              <input
                type="text"
                value={page.title || ""}
                onChange={(event) => handleFieldChange("title", event.target.value)}
                className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Subtitel
              <FieldHelp>Korte ondersteunende tekst onder de titel. Laat leeg als de pagina geen subtitel nodig heeft.</FieldHelp>
              <input
                type="text"
                value={page.subtitle || ""}
                onChange={(event) => handleFieldChange("subtitle", event.target.value)}
                className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Inhoud
              <FieldHelp>Belangrijkste tekstblok van deze pagina. Regels en witruimte blijven zoveel mogelijk behouden.</FieldHelp>
              <textarea
                rows={6}
                value={page.content || ""}
                onChange={(event) => handleFieldChange("content", event.target.value)}
                className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              SEO-titel
              <FieldHelp>Titel die vooral in Google, browser-tabs en gedeelde links wordt gebruikt.</FieldHelp>
              <input
                type="text"
                value={page.meta_title || ""}
                onChange={(event) => handleFieldChange("meta_title", event.target.value)}
                className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              SEO-omschrijving
              <FieldHelp>Korte omschrijving voor zoekmachines. Deze tekst staat meestal niet zichtbaar op de pagina zelf.</FieldHelp>
              <textarea
                rows={2}
                value={page.meta_description || ""}
                onChange={(event) => handleFieldChange("meta_description", event.target.value)}
                className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-coffee">
              <input
                type="checkbox"
                checked={Boolean(page.is_published)}
                onChange={(event) => handleFieldChange("is_published", event.target.checked)}
                className="h-4 w-4 accent-cocoa"
              />
              Gepubliceerd
              <span className="text-xs font-normal text-coffee/55">Zet uit om deze pagina tijdelijk te verbergen of als concept te bewaren.</span>
            </label>

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

          {slugsWithSections.includes(activeSlug) && (
            <div className="mt-6 grid gap-4">
              <h2 className="display-title text-xl font-semibold text-coffee">Onderdelen</h2>
              {sections.map((section) => (
                <div key={section.id} className="rounded-lg bg-card p-5 shadow-soft warm-border">
                  <label className="grid gap-2 text-sm font-semibold text-coffee">
                    Titel
                    <FieldHelp>Titel van dit losse onderdeel, bijvoorbeeld een werkwijze-stap.</FieldHelp>
                    <input
                      type="text"
                      value={section.title || ""}
                      onChange={(event) => handleSectionChange(section.id, "title", event.target.value)}
                      className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                    />
                  </label>
                  <label className="mt-3 grid gap-2 text-sm font-semibold text-coffee">
                    Beschrijving
                    <FieldHelp>Tekst die bij dit onderdeel op de pagina wordt getoond.</FieldHelp>
                    <textarea
                      rows={2}
                      value={section.content || ""}
                      onChange={(event) => handleSectionChange(section.id, "content", event.target.value)}
                      className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                    />
                  </label>
                  <AdminButton type="button" variant="secondary" className="mt-3" onClick={() => handleSaveSection(section)}>
                    Sectie opslaan
                  </AdminButton>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
