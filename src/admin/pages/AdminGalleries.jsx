import { CalendarClock, Heart, Image, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminButton from "../components/AdminButton.jsx";
import AdminLayout from "../components/AdminLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { formatDate } from "../../lib/formatDate.js";
import { supabase } from "../../lib/supabaseClient.js";

const statusOptions = ["Alles", "Concept", "Gepubliceerd", "Wacht op keuze klant", "Keuze ontvangen", "Extra beelden aangevraagd", "Afgerond", "Verlopen", "Verborgen"];

export default function AdminGalleries() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Alles");
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    const [{ data: galleries, error: galleryError }, { data: photos, error: photoError }] = await Promise.all([
      supabase.from("client_galleries").select("*").order("created_at", { ascending: false }),
      supabase.from("gallery_photos").select("id,gallery_id,image_url,is_favorite,is_extra_requested,sort_order").order("sort_order", { ascending: true }),
    ]);

    if (galleryError || photoError) {
      setError(galleryError?.message || photoError?.message || "Galerijen laden is niet gelukt.");
      setRows([]);
    } else {
      const photoMap = new Map();
      for (const photo of photos || []) {
        const current = photoMap.get(photo.gallery_id) || [];
        current.push(photo);
        photoMap.set(photo.gallery_id, current);
      }
      setRows((galleries || []).map((gallery) => ({ ...gallery, photos: photoMap.get(gallery.id) || [] })));
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = statusFilter === "Alles" || row.status === statusFilter;
      const matchesSearch = !query || `${row.title} ${row.client_name} ${row.client_email}`.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [rows, search, statusFilter]);

  const metrics = useMemo(() => ({
    total: rows.length,
    waiting: rows.filter((row) => ["Gepubliceerd", "Wacht op keuze klant"].includes(row.status)).length,
    received: rows.filter((row) => ["Keuze ontvangen", "Extra beelden aangevraagd"].includes(row.status)).length,
    finished: rows.filter((row) => row.status === "Afgerond").length,
  }), [rows]);

  const handleDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    const { data: storedFiles } = await supabase.storage.from("client-galleries").list(deleteRow.id, { limit: 1000 });
    if (storedFiles?.length) {
      await supabase.storage.from("client-galleries").remove(storedFiles.map((file) => `${deleteRow.id}/${file.name}`));
    }
    const { error: deleteError } = await supabase.from("client_galleries").delete().eq("id", deleteRow.id);
    setDeleting(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setDeleteRow(null);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="fine-label text-[0.65rem] font-semibold text-cocoa">Fotolevering</p>
          <h1 className="display-title mt-1 text-4xl font-semibold text-coffee">Klantgalerijen</h1>
          <p className="mt-2 text-sm leading-6 text-coffee/62">Beheer publicatie, foto's en keuzes vanuit één duidelijk overzicht.</p>
        </div>
        <AdminButton type="button" onClick={() => navigate("/admin/galleries/new")}>
          <Plus size={15} /> Nieuwe galerij
        </AdminButton>
      </div>

      <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg bg-card shadow-soft warm-border lg:grid-cols-4">
        <Metric label="Totaal" value={metrics.total} />
        <Metric label="Wacht op klant" value={metrics.waiting} />
        <Metric label="Keuze ontvangen" value={metrics.received} accent />
        <Metric label="Afgerond" value={metrics.finished} />
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-lg bg-card p-4 shadow-soft warm-border md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cocoa" size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Zoek op galerij, klant of e-mailadres"
            className="min-h-11 w-full rounded-full border border-cocoa/18 bg-cream pl-10 pr-4 text-sm text-coffee outline-none transition focus:border-cocoa"
          />
        </label>
        <label className="flex items-center gap-3 text-xs font-semibold text-coffee/65">
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-full border border-cocoa/18 bg-cream px-4 text-sm font-normal text-coffee outline-none focus:border-cocoa">
            {statusOptions.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      {loading ? (
        <p className="mt-6 rounded-lg bg-card p-6 text-sm text-coffee/62 shadow-soft warm-border">Galerijen laden...</p>
      ) : filteredRows.length === 0 ? (
        <div className="mt-6 rounded-lg bg-card px-6 py-14 text-center shadow-soft warm-border">
          <Image className="mx-auto text-cocoa" size={26} />
          <h2 className="display-title mt-3 text-2xl font-semibold text-coffee">Geen galerijen gevonden</h2>
          <p className="mt-2 text-sm text-coffee/58">Pas je zoekopdracht of statusfilter aan.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {filteredRows.map((row) => <GalleryAdminCard key={row.id} row={row} onOpen={() => navigate(`/admin/galleries/${row.id}`)} onPhotos={() => navigate(`/admin/galleries/${row.id}/photos`)} onDelete={() => setDeleteRow(row)} />)}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteRow)}
        title="Galerij verwijderen?"
        description={`De galerij "${deleteRow?.title}", alle klantkeuzes en alle geuploade foto's worden definitief verwijderd.`}
        confirmLabel={deleting ? "Verwijderen..." : "Verwijderen"}
        onCancel={() => setDeleteRow(null)}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}

function GalleryAdminCard({ row, onOpen, onPhotos, onDelete }) {
  const selectedCount = row.photos.filter((photo) => photo.is_favorite).length;
  const extraCount = row.photos.filter((photo) => photo.is_extra_requested).length;
  const cover = row.photos[0]?.image_url;
  const included = Number(row.included_images || 0);
  const progress = included > 0 ? Math.min((selectedCount / included) * 100, 100) : 0;

  return (
    <article className="overflow-hidden rounded-lg bg-card shadow-soft warm-border">
      <button type="button" onClick={onOpen} className="group relative block aspect-[16/7] w-full overflow-hidden bg-linen text-left">
        {cover ? <img src={cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" /> : <span className="grid h-full place-items-center text-cocoa/55"><Image size={30} /></span>}
        <div className="absolute inset-0 bg-gradient-to-t from-coffee/62 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-card/92 px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-coffee shadow-soft">{row.photos.length} foto's</span>
        <StatusBadge status={row.status} />
      </button>

      <div className="p-5">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <h2 className="display-title truncate text-2xl font-semibold text-coffee">{row.title}</h2>
          <p className="mt-1 truncate text-sm font-semibold text-coffee/72">{row.client_name}</p>
          <p className="mt-1 truncate text-xs text-coffee/48">{row.client_email}</p>
        </button>

        <div className="mt-5 flex items-center justify-between gap-4 text-xs text-coffee/58">
          <span className="inline-flex items-center gap-1.5"><Heart size={14} className="text-cocoa" /> {selectedCount} van {included} gekozen</span>
          <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} className="text-cocoa" /> {row.expires_at ? formatDate(row.expires_at) : "Geen vervaldatum"}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-linen"><div className="h-full rounded-full bg-cocoa" style={{ width: `${progress}%` }} /></div>
        {extraCount > 0 && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">{extraCount} extra beeld{extraCount === 1 ? "" : "en"} aangevraagd</p>}

        <div className="mt-5 flex items-center gap-2 border-t border-cocoa/10 pt-4">
          <button type="button" onClick={onOpen} className="inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-full bg-cocoa px-4 text-xs font-semibold uppercase tracking-[0.1em] text-card transition hover:bg-coffee"><Pencil size={14} /> Beheren</button>
          <button type="button" onClick={onPhotos} className="grid h-9 w-9 place-items-center rounded-full border border-cocoa/22 text-coffee transition hover:bg-linen" aria-label="Foto's beheren" title="Foto's beheren"><Image size={15} /></button>
          <button type="button" onClick={onDelete} className="grid h-9 w-9 place-items-center rounded-full border border-red-200 text-red-700 transition hover:bg-red-50" aria-label="Galerij verwijderen" title="Galerij verwijderen"><Trash2 size={15} /></button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const style = {
    Concept: "bg-card text-coffee",
    Gepubliceerd: "bg-emerald-50 text-emerald-900",
    "Wacht op keuze klant": "bg-amber-50 text-amber-900",
    "Keuze ontvangen": "bg-linen text-cocoa",
    "Extra beelden aangevraagd": "bg-amber-100 text-amber-950",
    Afgerond: "bg-coffee text-card",
    Verlopen: "bg-stone-200 text-stone-700",
    Verborgen: "bg-stone-200 text-stone-700",
  }[status] || "bg-card text-coffee";
  return <span className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em] shadow-soft ${style}`}>{status}</span>;
}

function Metric({ label, value, accent = false }) {
  return <div className={`border-cocoa/10 px-4 py-4 text-center [&:not(:last-child)]:border-r ${accent ? "bg-linen/55" : ""}`}><p className="fine-label text-[0.58rem] font-semibold text-cocoa">{label}</p><p className="display-title mt-1 text-3xl font-semibold text-coffee">{value}</p></div>;
}
