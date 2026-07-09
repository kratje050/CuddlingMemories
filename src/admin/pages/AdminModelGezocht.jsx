import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";

function FieldHelp({ children }) {
  return <p className="-mt-1 text-xs font-normal leading-5 text-coffee/55">{children}</p>;
}

export default function AdminModelGezocht() {
  const [page, setPage] = useState(null);
  const [discountSection, setDiscountSection] = useState(null);
  const [categoriesSection, setCategoriesSection] = useState(null);
  const [ctaSection, setCtaSection] = useState(null);
  const [categoriesText, setCategoriesText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: pageData }, { data: sectionRows }] = await Promise.all([
        supabase.from("pages").select("*").eq("slug", "model-gezocht").maybeSingle(),
        supabase.from("page_sections").select("*").eq("page_slug", "model-gezocht"),
      ]);

      setPage(pageData);
      const discount = sectionRows?.find((row) => row.section_key === "discount") || null;
      const categories = sectionRows?.find((row) => row.section_key === "categories") || null;
      const cta = sectionRows?.find((row) => row.section_key === "cta") || null;
      setDiscountSection(discount);
      setCategoriesSection(categories);
      setCtaSection(cta);

      try {
        const parsed = categories?.content ? JSON.parse(categories.content) : [];
        setCategoriesText(parsed.join(", "));
      } catch {
        setCategoriesText("");
      }

      setLoading(false);
    }

    load();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback(null);

    const categoriesArray = categoriesText
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const results = await Promise.all([
      supabase
        .from("pages")
        .update({ content: page.content, is_published: page.is_published })
        .eq("id", page.id),
      discountSection &&
        supabase.from("page_sections").update({ content: discountSection.content }).eq("id", discountSection.id),
      categoriesSection &&
        supabase
          .from("page_sections")
          .update({ content: JSON.stringify(categoriesArray) })
          .eq("id", categoriesSection.id),
      ctaSection &&
        supabase
          .from("page_sections")
          .update({ button_text: ctaSection.button_text, button_url: ctaSection.button_url })
          .eq("id", ctaSection.id),
    ]);

    setSaving(false);
    const failed = results.find((result) => result && result.error);
    setFeedback(failed ? { type: "error", message: failed.error.message } : { type: "success", message: "Opgeslagen." });
  };

  if (loading || !page) {
    return (
      <AdminLayout>
        <p className="text-sm text-coffee/70">Laden...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="display-title text-3xl font-semibold text-coffee">Model gezocht</h1>

      <form onSubmit={handleSave} className="mt-6 grid gap-6">
        <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
          <label className="flex items-center gap-2 text-sm font-semibold text-coffee">
            <input
              type="checkbox"
              checked={Boolean(page.is_published)}
              onChange={(event) => setPage((prev) => ({ ...prev, is_published: event.target.checked }))}
              className="h-4 w-4 accent-cocoa"
            />
            Actief (bij uit tonen we een nette "niet actief"-melding op de pagina)
            <span className="text-xs font-normal text-coffee/55">Bepaalt of bezoekers zich kunnen aanmelden als model.</span>
          </label>
          <label className="mt-4 grid gap-2 text-sm font-semibold text-coffee">
            Pitch-tekst
            <FieldHelp>Uitleg bovenaan de pagina: wie je zoekt en waarom iemand zich kan aanmelden.</FieldHelp>
            <textarea
              rows={4}
              value={page.content || ""}
              onChange={(event) => setPage((prev) => ({ ...prev, content: event.target.value }))}
              className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
          </label>
        </div>

        {discountSection && (
          <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Kortingspercentage
              <FieldHelp>Het kortingspercentage dat op de model-gezocht pagina wordt genoemd.</FieldHelp>
              <input
                type="number"
                value={discountSection.content || ""}
                onChange={(event) => setDiscountSection((prev) => ({ ...prev, content: event.target.value }))}
                className="w-32 rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
          </div>
        )}

        {categoriesSection && (
          <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              Categorieën (gescheiden door komma's)
              <FieldHelp>De shoots waarvoor modellen gezocht worden. Schrijf ze met komma's ertussen, bijvoorbeeld Zwangerschap, Newborn.</FieldHelp>
              <textarea
                rows={2}
                value={categoriesText}
                onChange={(event) => setCategoriesText(event.target.value)}
                className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
          </div>
        )}

        {ctaSection && (
          <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
            <label className="grid gap-2 text-sm font-semibold text-coffee">
              CTA-knoptekst
              <FieldHelp>Tekst op de aanmeldknop, bijvoorbeeld Ik wil model staan.</FieldHelp>
              <input
                type="text"
                value={ctaSection.button_text || ""}
                onChange={(event) => setCtaSection((prev) => ({ ...prev, button_text: event.target.value }))}
                className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
            <label className="mt-3 grid gap-2 text-sm font-semibold text-coffee">
              CTA-link
              <FieldHelp>Waar de knop naartoe gaat. Meestal /contact?shoot=Model%20staan%20met%2050%25%20korting.</FieldHelp>
              <input
                type="text"
                value={ctaSection.button_url || ""}
                onChange={(event) => setCtaSection((prev) => ({ ...prev, button_url: event.target.value }))}
                className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
          </div>
        )}

        {feedback && (
          <p
            className={`rounded-lg px-4 py-3 text-sm ${
              feedback.type === "error" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <AdminButton type="submit" disabled={saving} className="justify-self-start">
          {saving ? "Opslaan..." : "Opslaan"}
        </AdminButton>
      </form>
    </AdminLayout>
  );
}
