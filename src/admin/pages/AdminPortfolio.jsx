import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import { portfolioCategories } from "../utils/portfolioCategories.js";
import { formatPortfolioCategories, parsePortfolioCategories } from "../../lib/portfolioCategoryUtils.js";

const emptyForm = {
  albumId: "",
  title: "",
  altText: "",
  categories: [],
  isFeatured: false,
  sortOrder: 0,
};

function FieldHelp({ children }) {
  return <p className="-mt-1 text-xs font-normal leading-5 text-coffee/55">{children}</p>;
}

export default function AdminPortfolio() {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterAlbum, setFilterAlbum] = useState("");

  const reload = async () => {
    setLoading(true);
    const [{ data: albumRows }, { data: photoRows, error: photoError }] = await Promise.all([
      supabase.from("portfolio_albums").select("id, title, category").order("sort_order", { ascending: true }),
      supabase.from("portfolio_photos").select("*").order("sort_order", { ascending: true }),
    ]);
    if (photoError) setError(photoError.message);
    setAlbums(albumRows || []);
    setPhotos(photoRows || []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFiles([]);
    setFormOpen(true);
  };

  const openEdit = (photo) => {
    setEditingId(photo.id);
    setForm({
      albumId: photo.album_id || "",
      title: photo.title || "",
      altText: photo.alt_text || "",
      categories: parsePortfolioCategories(photo.category),
      isFeatured: photo.is_featured,
      sortOrder: photo.sort_order || 0,
    });
    setFiles([]);
    setFormOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.albumId) {
      setError("Kies een album voor deze foto.");
      return;
    }
    if (!form.altText.trim()) {
      setError("Alt-tekst is verplicht voor SEO.");
      return;
    }
    if (!editingId && !files.length) {
      setError("Kies een of meerdere foto's om te uploaden.");
      return;
    }

    setSaving(true);

    const basePayload = {
      album_id: form.albumId,
      category: formatPortfolioCategories(form.categories) || null,
      is_featured: form.isFeatured,
    };

    if (files.length) {
      const uploadedRows = [];

      for (const [index, selectedFile] of files.entries()) {
        const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const path = `${form.albumId}/${Date.now()}-${index}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, selectedFile);
        if (uploadError) {
          setError(`Uploaden is mislukt: ${uploadError.message}`);
          setSaving(false);
          return;
        }
        const imageUrl = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
        uploadedRows.push({
          ...basePayload,
          title: files.length === 1 && form.title ? form.title : selectedFile.name,
          alt_text: files.length === 1 ? form.altText.trim() : `${form.altText.trim()} ${index + 1}`,
          sort_order: (Number(form.sortOrder) || 0) + index,
          image_url: imageUrl,
        });
      }

      if (editingId) {
        const [firstRow, ...extraRows] = uploadedRows;
        const { error: updateError } = await supabase.from("portfolio_photos").update(firstRow).eq("id", editingId);
        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
        if (extraRows.length) {
          const { error: insertError } = await supabase.from("portfolio_photos").insert(extraRows);
          if (insertError) {
            setError(insertError.message);
            setSaving(false);
            return;
          }
        }
      } else {
        const { error: insertError } = await supabase.from("portfolio_photos").insert(uploadedRows);
        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      }
    } else if (editingId) {
      const payload = {
        ...basePayload,
        title: form.title || null,
        alt_text: form.altText.trim(),
        sort_order: Number(form.sortOrder) || 0,
      };

      const { error: updateError } = await supabase.from("portfolio_photos").update(payload).eq("id", editingId);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setFiles([]);
    setFormOpen(false);
    reload();
  };

  const handleDelete = async () => {
    await supabase.from("portfolio_photos").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    reload();
  };

  const visiblePhotos = filterAlbum ? photos.filter((photo) => photo.album_id === filterAlbum) : photos;

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-title text-3xl font-semibold text-coffee">Portfolio-foto's</h1>
        <AdminButton onClick={openNew}>
          <Plus size={14} /> Foto uploaden
        </AdminButton>
      </div>

      <select
        value={filterAlbum}
        onChange={(event) => setFilterAlbum(event.target.value)}
        className="mt-4 rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
      >
        <option value="">Alle albums</option>
        {albums.map((album) => (
          <option key={album.id} value={album.id}>
            {album.title}
          </option>
        ))}
      </select>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Album
            <FieldHelp>Bepaalt in welk portfolio-album deze foto terechtkomt.</FieldHelp>
            <select
              required
              value={form.albumId}
              onChange={(event) => {
                const album = albums.find((item) => item.id === event.target.value);
                setForm((prev) => ({
                  ...prev,
                  albumId: event.target.value,
                  categories: prev.categories.length || !album?.category ? prev.categories : [album.category],
                }));
              }}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            >
              <option value="">Kies een album</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Categorieën
            <FieldHelp>Vink een of meerdere categorieën aan. De foto verschijnt dan onder elke gekozen portfoliofilter.</FieldHelp>
            <div className="grid gap-2 rounded-lg border border-cocoa/20 bg-cream p-3 sm:grid-cols-2">
              {portfolioCategories.map((category) => {
                const checked = form.categories.includes(category);
                return (
                  <label key={category} className="flex items-center gap-2 text-xs font-semibold text-coffee/80">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          categories: event.target.checked
                            ? [...prev.categories, category]
                            : prev.categories.filter((item) => item !== category),
                        }))
                      }
                      className="h-4 w-4 accent-cocoa"
                    />
                    {category}
                  </label>
                );
              })}
            </div>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Titel
            <FieldHelp>Optionele titel voor intern overzicht of bij de foto in de lightbox.</FieldHelp>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Alt-tekst (verplicht voor SEO)
            <FieldHelp>Beschrijf kort wat er op de foto staat. Dit helpt Google en bezoekers met screenreaders.</FieldHelp>
            <input
              type="text"
              required
              value={form.altText}
              onChange={(event) => setForm((prev) => ({ ...prev, altText: event.target.value }))}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-coffee">
            Sortering
            <FieldHelp>Lager getal komt eerder in het album of in overzichten.</FieldHelp>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-coffee">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
              className="h-4 w-4 accent-cocoa"
            />
            Uitgelicht
            <span className="text-xs font-normal text-coffee/55">Uitgelichte foto's kunnen op de homepage of bovenaan portfolio-overzichten verschijnen.</span>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-coffee sm:col-span-2">
            {editingId ? "Nieuwe foto uploaden (optioneel)" : "Foto's"}
            <FieldHelp>
              Kies een of meerdere JPG, PNG of WebP-bestanden. Bij bewerken vervangt de eerste gekozen foto de huidige foto en worden extra gekozen foto's toegevoegd.
            </FieldHelp>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
            {files.length > 0 && <FieldHelp>{files.length} bestand(en) gekozen.</FieldHelp>}
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <AdminButton type="submit" disabled={saving}>
              {saving ? "Bezig..." : "Opslaan"}
            </AdminButton>
            <AdminButton type="button" variant="secondary" onClick={() => setFormOpen(false)}>
              Annuleren
            </AdminButton>
          </div>
        </form>
      )}

      <div className="mt-5">
        <DataTable
          loading={loading}
          rows={visiblePhotos}
          getRowKey={(row) => row.id}
          emptyLabel="Nog geen foto's."
          columns={[
            {
              key: "preview",
              label: "",
              render: (row) => (
                <img src={row.image_url} alt={row.alt_text} className="h-12 w-12 rounded-md object-cover" loading="lazy" />
              ),
            },
            { key: "title", label: "Titel" },
            { key: "category", label: "Categorieën" },
            { key: "is_featured", label: "Uitgelicht", render: (row) => (row.is_featured ? "Ja" : "Nee") },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-cocoa/25 text-coffee transition hover:bg-linen"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="grid h-8 w-8 place-items-center rounded-full border border-red-300 text-red-700 transition hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Foto verwijderen?"
        description="De foto wordt verwijderd uit het album (het bestand blijft in Storage staan)."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
