import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";

export default function AdminSeo() {
  const [pages, setPages] = useState([]);
  const [settingsId, setSettingsId] = useState(null);
  const [defaults, setDefaults] = useState({ default_seo_title: "", default_seo_description: "" });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function load() {
      const [{ data: pageRows }, { data: settings }] = await Promise.all([
        supabase.from("pages").select("id, slug, title, meta_title, meta_description").order("slug"),
        supabase.from("site_settings").select("id, default_seo_title, default_seo_description").limit(1).maybeSingle(),
      ]);
      setPages(pageRows || []);
      if (settings) {
        setSettingsId(settings.id);
        setDefaults({
          default_seo_title: settings.default_seo_title || "",
          default_seo_description: settings.default_seo_description || "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handlePageChange = (id, field, value) => {
    setPages((prev) => prev.map((page) => (page.id === id ? { ...page, [field]: value } : page)));
  };

  const handleSavePage = async (page) => {
    setSavingId(page.id);
    const { error } = await supabase
      .from("pages")
      .update({ meta_title: page.meta_title, meta_description: page.meta_description })
      .eq("id", page.id);
    setSavingId(null);
    setFeedback(error ? error.message : "Opgeslagen.");
  };

  const handleSaveDefaults = async (event) => {
    event.preventDefault();
    setSavingDefaults(true);
    const { error } = await supabase.from("site_settings").update(defaults).eq("id", settingsId);
    setSavingDefaults(false);
    setFeedback(error ? error.message : "Standaard SEO opgeslagen.");
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
      <h1 className="display-title text-3xl font-semibold text-coffee">SEO</h1>

      {feedback && <p className="mt-4 rounded-lg bg-linen px-4 py-3 text-sm text-coffee">{feedback}</p>}

      <form onSubmit={handleSaveDefaults} className="mt-6 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border">
        <h2 className="fine-label text-[0.65rem] text-cocoa">Standaard SEO (fallback)</h2>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Standaard SEO-titel
          <input
            type="text"
            value={defaults.default_seo_title}
            onChange={(event) => setDefaults((prev) => ({ ...prev, default_seo_title: event.target.value }))}
            className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Standaard SEO-omschrijving
          <textarea
            rows={2}
            value={defaults.default_seo_description}
            onChange={(event) => setDefaults((prev) => ({ ...prev, default_seo_description: event.target.value }))}
            className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
          />
        </label>
        <AdminButton type="submit" disabled={savingDefaults} className="justify-self-start">
          {savingDefaults ? "Opslaan..." : "Opslaan"}
        </AdminButton>
      </form>

      <div className="mt-6 grid gap-4">
        <h2 className="display-title text-xl font-semibold text-coffee">Per pagina</h2>
        {pages.map((page) => (
          <div key={page.id} className="rounded-lg bg-card p-5 shadow-soft warm-border">
            <p className="fine-label text-[0.6rem] text-cocoa">{page.slug}</p>
            <label className="mt-3 grid gap-2 text-sm font-semibold text-coffee">
              SEO-titel
              <input
                type="text"
                value={page.meta_title || ""}
                onChange={(event) => handlePageChange(page.id, "meta_title", event.target.value)}
                className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
            <label className="mt-3 grid gap-2 text-sm font-semibold text-coffee">
              SEO-omschrijving
              <textarea
                rows={2}
                value={page.meta_description || ""}
                onChange={(event) => handlePageChange(page.id, "meta_description", event.target.value)}
                className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
              />
            </label>
            <AdminButton
              type="button"
              variant="secondary"
              className="mt-3"
              disabled={savingId === page.id}
              onClick={() => handleSavePage(page)}
            >
              {savingId === page.id ? "Opslaan..." : "Opslaan"}
            </AdminButton>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
