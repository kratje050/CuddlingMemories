import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminButton from "../components/AdminButton.jsx";
import AdminLayout from "../components/AdminLayout.jsx";
import DataTable from "../components/DataTable.jsx";
import { supabase } from "../../lib/supabaseClient.js";

export default function AdminGalleryPhotos() {
  const { id } = useParams();
  const [photos, setPhotos] = useState([]);
  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => {
    if (!id || id === "undefined") {
      setMessage("Sla de galerij eerst op voordat je foto's uploadt.");
      return;
    }
    supabase.from("gallery_photos").select("*").eq("gallery_id", id).order("sort_order", { ascending: true }).then(({ data }) => setPhotos(data || []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const upload = async (event) => {
    event.preventDefault();
    if (!id || id === "undefined") {
      setMessage("Sla de galerij eerst op voordat je foto's uploadt.");
      return;
    }
    if (!files.length) return;
    setUploading(true);
    setMessage("");
    const startOrder = Number(sortOrder || 0);
    const rows = [];

    for (const [index, file] of files.entries()) {
      const safeName = `${Date.now()}-${index}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const path = `${id}/${safeName}`;
      const { error: uploadError } = await supabase.storage.from("client-galleries").upload(path, file);
      if (uploadError) {
        setMessage(uploadError.message);
        setUploading(false);
        return;
      }
      const { data: publicData } = supabase.storage.from("client-galleries").getPublicUrl(path);
      rows.push({
        gallery_id: id,
        title: files.length === 1 && title ? title : file.name,
        filename: file.name,
        image_url: publicData.publicUrl,
        sort_order: startOrder + index,
      });
    }

    const { error } = await supabase.from("gallery_photos").insert(rows);
    setUploading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setFiles([]);
    setTitle("");
    setSortOrder((value) => Number(value || 0) + rows.length);
    setMessage(`${rows.length} foto${rows.length === 1 ? "" : "'s"} geupload.`);
    load();
  };

  const remove = async (row) => {
    await supabase.from("gallery_photos").delete().eq("id", row.id);
    load();
  };

  return (
    <AdminLayout>
      <h1 className="display-title text-3xl font-semibold text-coffee">Galerijfoto's</h1>
      <p className="mt-1 text-sm text-coffee/65">Upload foto's naar de beveiligde klantgalerij. Foto's worden via Supabase Storage bewaard.</p>
      <form onSubmit={upload} className="mt-6 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border md:grid-cols-[1fr_1fr_140px_auto]">
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Foto's
          <span className="-mt-1 text-xs font-normal text-coffee/55">Kies een of meerdere beelden die in de galerij moeten verschijnen.</span>
          <input type="file" accept="image/*" multiple onChange={(event) => setFiles(Array.from(event.target.files || []))} className="text-sm" />
          {files.length > 0 && <span className="-mt-1 text-xs font-normal text-coffee/55">{files.length} bestand(en) gekozen.</span>}
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Titel
          <span className="-mt-1 text-xs font-normal text-coffee/55">Alleen gebruikt als je precies 1 foto uploadt. Bij meerdere foto's wordt de bestandsnaam gebruikt.</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Sortering
          <span className="-mt-1 text-xs font-normal text-coffee/55">Lager staat eerder.</span>
          <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
        </label>
        <AdminButton type="submit" disabled={uploading || !files.length} className="self-end">
          <Plus size={14} /> {uploading ? "Uploaden..." : "Upload"}
        </AdminButton>
        {message && <p className="rounded-lg bg-linen px-4 py-3 text-sm text-coffee md:col-span-4">{message}</p>}
      </form>
      <div className="mt-6">
        <DataTable
          loading={false}
          rows={photos}
          getRowKey={(row) => row.id}
          emptyLabel="Nog geen foto's."
          columns={[
            { key: "preview", label: "Preview", render: (row) => <img src={row.image_url} alt="" className="h-14 w-14 rounded-md object-cover" /> },
            { key: "title", label: "Titel" },
            { key: "is_favorite", label: "Favoriet", render: (row) => (row.is_favorite ? "Ja" : "Nee") },
            { key: "client_note", label: "Notitie" },
            { key: "actions", label: "", render: (row) => <button type="button" onClick={() => remove(row)} className="grid h-8 w-8 place-items-center rounded-full border border-red-300 text-red-700"><Trash2 size={14} /></button> },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
