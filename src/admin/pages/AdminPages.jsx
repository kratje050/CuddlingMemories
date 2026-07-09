import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import { Image, Upload } from "lucide-react";

const pageSlugs = [
  { slug: "home", label: "Home" },
  { slug: "over-demy", label: "Over mij" },
  { slug: "werkwijze", label: "Werkwijze" },
  { slug: "model-gezocht", label: "Model gezocht" },
  { slug: "privacybeleid", label: "Privacybeleid" },
];

const slugsWithSections = ["home", "over-demy", "werkwijze", "model-gezocht", "privacybeleid"];

const defaultSections = {
  home: [
    { page_slug: "home", section_key: "hero_image", title: "Hero achtergrondfoto", content: "/images/home-hero-cakesmash.png", sort_order: 0, is_visible: true },
    { page_slug: "home", section_key: "hero_title_weight", title: "Dikte grote home-titel", content: "600", sort_order: 1, is_visible: true },
    { page_slug: "home", section_key: "hero_intro", title: "Korte tekst onder de home-titel", content: "Zwangerschap, newborn, gezin, portret, cakesmash en motherhood fotografie.", sort_order: 2, is_visible: true },
    { page_slug: "home", section_key: "memory_intro", title: "Foto's die voelen als een herinnering zodra je ze terugziet", content: "Ik fotografeer met zachte kleuren, warme details en aandacht voor wat echt bij jullie past. Van kleine handjes tot grote mijlpalen: elk beeld mag iets bewaren van hoe het nu voelt.", sort_order: 10, is_visible: true },
    { page_slug: "home", section_key: "memory_image_main", title: "Afbeelding groot", content: "/images/instagram/instagram-04.jpg", sort_order: 11, is_visible: true },
    { page_slug: "home", section_key: "memory_image_small", title: "Afbeelding klein", content: "/images/instagram/instagram-12.jpg", sort_order: 12, is_visible: true },
  ],
  "over-demy": [
    { page_slug: "over-demy", section_key: "image_left", title: "Foto links", content: "/images/instagram/instagram-01.jpg", sort_order: 10, is_visible: true },
    { page_slug: "over-demy", section_key: "image_right", title: "Foto rechts", content: "/images/instagram/instagram-10.jpg", sort_order: 11, is_visible: true },
    { page_slug: "over-demy", section_key: "highlight_text", title: "Tekst op fotokaart", content: "Oog voor kleine details, warme blikken en echte momenten.", sort_order: 12, is_visible: true },
  ],
  "model-gezocht": [
    { page_slug: "model-gezocht", section_key: "image_left", title: "Foto links", content: "/images/instagram/instagram-07.jpg", sort_order: 10, is_visible: true },
    { page_slug: "model-gezocht", section_key: "image_right", title: "Foto rechts", content: "/images/instagram/instagram-11.jpg", sort_order: 11, is_visible: true },
  ],
};

function FieldHelp({ children }) {
  return <p className="-mt-1 text-xs font-normal leading-5 text-coffee/55">{children}</p>;
}

function isImageSection(section) {
  const key = String(section.section_key || "").toLowerCase();
  const content = String(section.content || "").toLowerCase();
  return key.includes("image") || key.includes("foto") || key.includes("photo") || content.startsWith("/images/") || content.startsWith("http");
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
        const existing = data || [];
        const missingDefaults = (defaultSections[activeSlug] || []).filter(
          (item) => !existing.some((section) => section.section_key === item.section_key)
        );
        sectionData = [...existing, ...missingDefaults].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
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

  const getSectionKey = (section) => section.id || section.section_key;

  const handleSectionChange = (sectionKey, field, value) => {
    setSections((prev) => prev.map((section) => (getSectionKey(section) === sectionKey ? { ...section, [field]: value } : section)));
  };

  const handleSaveSection = async (section) => {
    setSaving(true);
    const payload = {
      page_slug: section.page_slug || activeSlug,
      section_key: section.section_key,
      title: section.title,
      content: section.content,
      sort_order: section.sort_order || 0,
      is_visible: section.is_visible !== false,
    };
    const { data, error } = section.id
      ? await supabase.from("page_sections").update(payload).eq("id", section.id)
      : await supabase.from("page_sections").insert(payload).select("*").single();
    if (!error && data) {
      setSections((prev) => prev.map((item) => (getSectionKey(item) === getSectionKey(section) ? data : item)));
    }
    setSaving(false);
    setFeedback(error ? { type: "error", message: error.message } : { type: "success", message: "Sectie opgeslagen." });
  };

  const handleSectionImageUpload = async (section, file) => {
    if (!file) return;
    const sectionKey = getSectionKey(section);
    setSaving(true);
    setFeedback(null);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `page-sections/${activeSlug}/${section.section_key}-${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, file);
    if (uploadError) {
      setSaving(false);
      setFeedback({ type: "error", message: uploadError.message });
      return;
    }
    const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
    handleSectionChange(sectionKey, "content", data.publicUrl);
    setSaving(false);
    setFeedback({ type: "success", message: "Afbeelding geupload. Klik op Sectie opslaan om hem vast te zetten." });
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
              {sections.map((section) => {
                const sectionKey = getSectionKey(section);
                const isHeroWeight = section.section_key === "hero_title_weight";
                const imageSection = isImageSection(section);
                return (
                <div key={sectionKey} className="rounded-lg bg-card p-5 shadow-soft warm-border">
                  <label className="grid gap-2 text-sm font-semibold text-coffee">
                    Titel
                    <FieldHelp>
                      Onderdeel: {section.section_key}. {isHeroWeight ? "Gebruik 500, 600 of 700 om de grote home-titel dunner of dikker te maken." : "Bij afbeeldingsonderdelen zet je de afbeelding-URL in het tekstveld hieronder."}
                    </FieldHelp>
                    <input
                      type="text"
                      value={section.title || ""}
                      onChange={(event) => handleSectionChange(sectionKey, "title", event.target.value)}
                      className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                    />
                  </label>
                  <label className="mt-3 grid gap-2 text-sm font-semibold text-coffee">
                    Beschrijving
                    <FieldHelp>{isHeroWeight ? "Dit bepaalt alleen de letterdikte van de grote titel op de homepage." : "Tekst of afbeelding-URL die bij dit onderdeel op de pagina wordt getoond."}</FieldHelp>
                    <textarea
                      rows={2}
                      value={section.content || ""}
                      onChange={(event) => handleSectionChange(sectionKey, "content", event.target.value)}
                      className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
                    />
                  </label>
                  {imageSection && (
                    <div className="mt-3 grid gap-3 rounded-lg bg-linen/45 p-3 warm-border">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-coffee">
                          <Image size={16} className="text-cocoa" />
                          Huidige afbeelding
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-cocoa/25 bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-coffee transition hover:bg-cream">
                          <Upload size={14} />
                          Upload afbeelding
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={(event) => handleSectionImageUpload(section, event.target.files?.[0])}
                          />
                        </label>
                      </div>
                      {section.content ? (
                        <img
                          src={section.content}
                          alt={section.title || "Pagina afbeelding"}
                          className="h-40 w-full rounded-lg object-cover shadow-soft warm-border sm:h-56"
                        />
                      ) : (
                        <p className="rounded-lg bg-card px-4 py-3 text-xs text-coffee/60 warm-border">Nog geen afbeelding gekozen.</p>
                      )}
                    </div>
                  )}
                  <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-coffee">
                    <input
                      type="checkbox"
                      checked={section.is_visible !== false}
                      onChange={(event) => handleSectionChange(sectionKey, "is_visible", event.target.checked)}
                      className="h-4 w-4 accent-cocoa"
                    />
                    Zichtbaar
                    <span className="text-xs font-normal text-coffee/55">Zet uit als dit onderdeel tijdelijk niet op de pagina mag staan.</span>
                  </label>
                  <AdminButton type="button" variant="secondary" className="mt-3" onClick={() => handleSaveSection(section)}>
                    Sectie opslaan
                  </AdminButton>
                </div>
              )})}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
