import { useEffect, useState } from "react";
import { CloudUpload, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabaseClient.js";
import AdminLayout from "../components/AdminLayout.jsx";
import AdminButton from "../components/AdminButton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import { portfolioCategories } from "../utils/portfolioCategories.js";
import { formatPortfolioCategories, parsePortfolioCategories } from "../../lib/portfolioCategoryUtils.js";
import { createAutomaticFileName } from "../../lib/automaticFileName.js";
import { getPublicImageJob, publishPublicImage, waitForPublicImage } from "../utils/publicImagePublisher.js";

const emptyForm = {
  albumIds: [],
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
  const [publishStatus, setPublishStatus] = useState(null);
  const [publishJobs, setPublishJobs] = useState([]);

  const reload = async () => {
    setLoading(true);
    const [{ data: albumRows }, { data: photoRows, error: photoError }, { data: linkRows }, { data: jobRows }] = await Promise.all([
      supabase.from("portfolio_albums").select("id, title, category").order("sort_order", { ascending: true }),
      supabase.from("portfolio_photos").select("*").order("sort_order", { ascending: true }),
      supabase.from("portfolio_photo_albums").select("photo_id, album_id"),
      supabase.from("public_image_publish_jobs").select("id, status, primary_path, error_message, created_at").eq("target_type", "portfolio_photo").order("created_at", { ascending: false }).limit(8),
    ]);
    if (photoError) setError(photoError.message);
    const albumIdsByPhoto = new Map();
    (linkRows || []).forEach((link) => {
      const current = albumIdsByPhoto.get(link.photo_id) || [];
      current.push(link.album_id);
      albumIdsByPhoto.set(link.photo_id, current);
    });
    setAlbums(albumRows || []);
    setPhotos((photoRows || []).map((photo) => ({
      ...photo,
      album_ids: albumIdsByPhoto.get(photo.id) || [photo.album_id].filter(Boolean),
    })));
    setPublishJobs(jobRows || []);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    const activeJobs = publishJobs.filter((job) => job.status === "processing" || job.status === "deploying");
    if (!activeJobs.length) return undefined;
    const timer = window.setTimeout(async () => {
      const refreshed = await Promise.all(activeJobs.map((job) => getPublicImageJob(job.id).catch(() => job)));
      setPublishJobs((current) => current.map((job) => refreshed.find((item) => item.id === job.id) || job));
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [publishJobs]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFiles([]);
    setFormOpen(true);
  };

  const openEdit = (photo) => {
    setEditingId(photo.id);
    setForm({
      albumIds: photo.album_ids?.length ? photo.album_ids : [photo.album_id].filter(Boolean),
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

    if (!form.albumIds.length) {
      setError("Kies minimaal één album voor deze foto.");
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
    setPublishStatus(null);

    const basePayload = {
      album_id: form.albumIds[0],
      category: formatPortfolioCategories(form.categories) || null,
      is_featured: form.isFeatured,
    };

    if (files.length && import.meta.env.VITE_PUBLIC_IMAGE_UPLOAD_MODE !== "github") {
      // Tijdelijke noodfallback. Verwijder deze pas nadat de GitHub/Netlify-route
      // in productie aantoonbaar stabiel werkt.
      setPublishStatus({ phase: "processing", message: "Upload verwerken" });
      const fallbackError = await uploadPortfolioFilesToSupabase(basePayload);
      if (fallbackError) {
        setPublishStatus({ phase: "failed", message: "Mislukt" });
        setError(fallbackError);
        setSaving(false);
        return;
      }
      setPublishStatus({ phase: "ready", message: "Gereed" });
    } else if (files.length) {
      try {
        const selectedAlbums = albums.filter((album) => form.albumIds.includes(album.id));
        const selectedAlbum = selectedAlbums[0];
        const jobs = [];
        for (const [index, selectedFile] of files.entries()) {
          setPublishStatus({ phase: "processing", message: `Upload verwerken (${index + 1}/${files.length})` });
          const title = files.length === 1 && form.title
            ? form.title
            : createAutomaticFileName(selectedFile, [selectedAlbum?.title, ...form.categories, form.title].filter(Boolean).join("-"), index).replace(/\.[^.]+$/, "");
          const job = await publishPublicImage(selectedFile, {
            target_type: "portfolio_photo",
            target_record_id: editingId && index === 0 ? editingId : null,
            album_id: form.albumIds[0],
            album_ids: form.albumIds,
            title,
            alt_text: files.length === 1 ? form.altText.trim() : `${form.altText.trim()} ${index + 1}`,
            category: formatPortfolioCategories(form.categories) || null,
            is_featured: form.isFeatured,
            sort_order: (Number(form.sortOrder) || 0) + index,
          });
          jobs.push(job);
        }
        setPublishStatus({ phase: "deploying", message: "Website wordt bijgewerkt" });
        await Promise.all(jobs.map((job) => waitForPublicImage(job.id, (nextJob) => {
            if (nextJob.status === "ready") setPublishStatus({ phase: "ready", message: "Gereed" });
            if (nextJob.status === "failed") setPublishStatus({ phase: "failed", message: "Mislukt" });
          })));
        setPublishStatus({ phase: "ready", message: "Gereed" });
      } catch (publishError) {
        setPublishStatus({ phase: "failed", message: "Mislukt" });
        setError(publishError instanceof Error ? publishError.message : "Publiceren is niet gelukt.");
        setSaving(false);
        return;
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
      const linkError = await syncPhotoAlbums(editingId, form.albumIds);
      if (linkError) {
        setError(linkError);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setFiles([]);
    setFormOpen(false);
    await reload();
  };

  const syncPhotoAlbums = async (photoId, albumIds) => {
    const uniqueAlbumIds = [...new Set(albumIds.filter(Boolean))];
    const { error: deleteError } = await supabase.from("portfolio_photo_albums").delete().eq("photo_id", photoId);
    if (deleteError) return deleteError.message;
    if (!uniqueAlbumIds.length) return null;
    const { error: insertError } = await supabase.from("portfolio_photo_albums").insert(
      uniqueAlbumIds.map((albumId) => ({ photo_id: photoId, album_id: albumId }))
    );
    return insertError?.message || null;
  };

  const uploadPortfolioFilesToSupabase = async (basePayload) => {
      const uploadedRows = [];
      const selectedAlbum = albums.find((album) => album.id === form.albumIds[0]);

      for (const [index, selectedFile] of files.entries()) {
        const safeName = createAutomaticFileName(selectedFile, [selectedAlbum?.title, ...form.categories, form.title].filter(Boolean).join("-"), index);
        const path = `${form.albumIds[0]}/${safeName}`;
        const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, selectedFile);
        if (uploadError) {
          return `Uploaden via de tijdelijke Supabase-fallback is mislukt: ${uploadError.message}`;
        }
        const imageUrl = supabase.storage.from("portfolio").getPublicUrl(path).data.publicUrl;
        uploadedRows.push({
          ...basePayload,
          title: files.length === 1 && form.title ? form.title : safeName.replace(/\.[^.]+$/, ""),
          alt_text: files.length === 1 ? form.altText.trim() : `${form.altText.trim()} ${index + 1}`,
          sort_order: (Number(form.sortOrder) || 0) + index,
          image_url: imageUrl,
          image_srcset: null,
          image_width: null,
          image_height: null,
          image_variants: [],
          image_source: "supabase",
        });
      }

      if (editingId) {
        const [firstRow, ...extraRows] = uploadedRows;
        const { error: updateError } = await supabase.from("portfolio_photos").update(firstRow).eq("id", editingId);
        if (updateError) {
          return updateError.message;
        }
        const firstLinkError = await syncPhotoAlbums(editingId, form.albumIds);
        if (firstLinkError) return firstLinkError;
        if (extraRows.length) {
          const { data: insertedRows, error: insertError } = await supabase.from("portfolio_photos").insert(extraRows).select("id");
          if (insertError) {
            return insertError.message;
          }
          for (const row of insertedRows || []) {
            const linkError = await syncPhotoAlbums(row.id, form.albumIds);
            if (linkError) return linkError;
          }
        }
      } else {
        const { data: insertedRows, error: insertError } = await supabase.from("portfolio_photos").insert(uploadedRows).select("id");
        if (insertError) {
          return insertError.message;
        }
        for (const row of insertedRows || []) {
          const linkError = await syncPhotoAlbums(row.id, form.albumIds);
          if (linkError) return linkError;
        }
      }
      return null;
  };

  const handleDelete = async () => {
    await supabase.from("portfolio_photos").delete().eq("id", deleteTarget.id);
    setDeleteTarget(null);
    reload();
  };

  const handleFilesChange = (selectedFiles) => {
    setFiles(selectedFiles);
  };

  const visiblePhotos = filterAlbum
    ? photos.filter((photo) => (photo.album_ids || [photo.album_id]).includes(filterAlbum))
    : photos;

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
      {publishStatus && (
        <div className={`mt-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold ${publishStatus.phase === "failed" ? "bg-red-50 text-red-800" : publishStatus.phase === "ready" ? "bg-emerald-50 text-emerald-800" : "bg-linen text-coffee"}`}>
          <CloudUpload size={18} />
          <span>{publishStatus.message}</span>
        </div>
      )}
      {publishJobs.length > 0 && (
        <div className="mt-4 rounded-lg bg-card p-4 shadow-soft warm-border">
          <h2 className="text-sm font-semibold text-coffee">Recente websitepublicaties</h2>
          <div className="mt-3 grid gap-2">
            {publishJobs.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-cream px-3 py-2 text-xs text-coffee/70">
                <span className="min-w-0 truncate">{job.primary_path}</span>
                <span className={`rounded-full px-3 py-1 font-semibold ${job.status === "ready" ? "bg-emerald-50 text-emerald-800" : job.status === "failed" ? "bg-red-50 text-red-800" : "bg-linen text-coffee"}`}>
                  {job.status === "processing" ? "Upload verwerken" : job.status === "deploying" ? "Website wordt bijgewerkt" : job.status === "ready" ? "Gereed" : "Mislukt"}
                </span>
                {job.error_message && <p className="w-full text-red-700">{job.error_message}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border sm:grid-cols-2">
          <div className="grid gap-2 text-sm font-semibold text-coffee">
            Albums
            <FieldHelp>Vink één of meerdere albums aan. De foto verschijnt in ieder gekozen album.</FieldHelp>
            <div className="grid gap-2 rounded-lg border border-cocoa/20 bg-cream p-3 sm:grid-cols-2">
              {albums.map((album) => {
                const checked = form.albumIds.includes(album.id);
                return (
                  <label key={album.id} className="flex items-center gap-2 text-xs font-semibold text-coffee/80">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          albumIds: event.target.checked
                            ? [...prev.albumIds, album.id]
                            : prev.albumIds.filter((id) => id !== album.id),
                          categories: event.target.checked && album.category && !prev.categories.includes(album.category)
                            ? [...prev.categories, album.category]
                            : prev.categories,
                        }))
                      }
                      className="h-4 w-4 accent-cocoa"
                    />
                    {album.title}
                  </label>
                );
              })}
            </div>
          </div>
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
              Kies een of meerdere JPG-, PNG- of WebP-bestanden van maximaal 5 MB per foto. Openbare portfoliofoto&apos;s worden via de ingestelde publicatieroute opgeslagen. Klantgalerijen blijven altijd in de afgeschermde privéopslag.
            </FieldHelp>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => handleFilesChange(Array.from(event.target.files || []))}
              className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa"
            />
            {files.length > 0 && <FieldHelp>{files.length} bestand(en) gekozen.</FieldHelp>}
          </label>
          <div className="flex gap-3 sm:col-span-2">
            <AdminButton type="submit" disabled={saving}>
              {saving ? publishStatus?.message || "Bezig..." : "Opslaan en publiceren"}
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
            {
              key: "albums",
              label: "Albums",
              render: (row) => {
                const titles = albums
                  .filter((album) => (row.album_ids || [row.album_id]).includes(album.id))
                  .map((album) => album.title);
                return titles.join(", ") || "-";
              },
            },
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
