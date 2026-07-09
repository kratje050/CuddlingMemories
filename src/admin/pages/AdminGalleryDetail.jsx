import { CheckCircle, ClipboardList, Copy, Image, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminButton from "../components/AdminButton.jsx";
import AdminLayout from "../components/AdminLayout.jsx";
import DataTable from "../components/DataTable.jsx";
import { galleryUrl, createSecureToken } from "../../lib/galleryTokens.js";
import { formatDate } from "../../lib/formatDate.js";
import { supabase } from "../../lib/supabaseClient.js";

const statuses = ["Concept", "Gepubliceerd", "Wacht op keuze klant", "Keuze ontvangen", "Extra beelden aangevraagd", "Afgerond", "Verlopen", "Verborgen"];

const emptyForm = {
  title: "",
  client_name: "",
  client_email: "",
  secure_token: "",
  status: "Concept",
  included_images: 7,
  is_published: false,
  expires_at: "",
  internal_note: "",
};

export default function AdminGalleryDetail() {
  const { id } = useParams();
  const isNew = !id || id === "new" || id === "undefined";
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const publicLink = useMemo(() => (form.secure_token ? galleryUrl(form.secure_token) : ""), [form.secure_token]);
  const selectedPhotos = useMemo(() => photos.filter((photo) => photo.is_favorite), [photos]);
  const extraPhotos = useMemo(() => selectedPhotos.filter((photo) => photo.is_extra_requested), [selectedPhotos]);
  const selectedList = useMemo(
    () =>
      selectedPhotos
        .map((photo, index) => `${index + 1}. ${photo.title || photo.filename || "Foto"}${photo.is_extra_requested ? " (extra)" : ""}${photo.client_note ? ` - ${photo.client_note}` : ""}`)
        .join("\n"),
    [selectedPhotos]
  );

  useEffect(() => {
    if (isNew) {
      setForm({ ...emptyForm, secure_token: createSecureToken() });
      return;
    }
    if (!id) return;
    supabase.from("client_galleries").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (data) setForm({ ...emptyForm, ...data, expires_at: data.expires_at || "" });
    });
    supabase.from("gallery_photos").select("*").eq("gallery_id", id).order("sort_order", { ascending: true }).then(({ data }) => setPhotos(data || []));
  }, [id, isNew]);

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = {
      ...form,
      included_images: Number(form.included_images || 0),
      expires_at: form.expires_at || null,
      is_published: Boolean(form.is_published),
    };
    const query = isNew
      ? supabase.from("client_galleries").insert(payload).select("id").single()
      : supabase.from("client_galleries").update(payload).eq("id", id).select("id").single();
    const { data, error } = await query;
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Galerij opgeslagen.");
    if (isNew) navigate(`/admin/galleries/${data.id}`);
  };

  const markFinished = async () => {
    setSaving(true);
    setMessage("");
    const { error } = await supabase.from("client_galleries").update({ status: "Afgerond" }).eq("id", id);
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    update("status", "Afgerond");
    setMessage("Galerij is gemarkeerd als afgerond.");
  };

  const copySelection = async () => {
    await navigator.clipboard.writeText(selectedList || "Nog geen favorieten gekozen.");
    setMessage("Gekozen foto's gekopieerd.");
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-title text-3xl font-semibold text-coffee">{isNew ? "Nieuwe galerij" : "Galerij bewerken"}</h1>
          <p className="mt-1 text-sm text-coffee/65">De veilige link gebruikt een lange token en geen simpele ID.</p>
        </div>
        {!isNew && <AdminButton type="button" onClick={() => navigate(`/admin/galleries/${id}/photos`)}><Image size={14} /> Foto's beheren</AdminButton>}
      </div>

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-lg bg-card p-5 shadow-soft warm-border md:grid-cols-2">
        <Field label="Galerijtitel" help="Naam die boven de klantgalerij staat." value={form.title} onChange={(value) => update("title", value)} required />
        <Field label="Klantnaam" help="Naam van de klant of het gezin." value={form.client_name} onChange={(value) => update("client_name", value)} required />
        <Field label="E-mailadres klant" help="Hier kan later de galerijmail naartoe." value={form.client_email} onChange={(value) => update("client_email", value)} required />
        <Field label="Inbegrepen beelden" type="number" help="Aantal foto's dat standaard in het pakket zit." value={form.included_images} onChange={(value) => update("included_images", value)} />
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Status
          <span className="-mt-1 text-xs font-normal text-coffee/55">Bepaalt waar de galerij in het proces staat.</span>
          <select value={form.status} onChange={(event) => update("status", event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa">
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <Field label="Vervaldatum" type="date" help="Na deze datum is de galerij niet meer zichtbaar voor de klant." value={form.expires_at || ""} onChange={(value) => update("expires_at", value)} />
        <Field label="Veilige token" help="Lange geheime code in de klantlink. Alleen opnieuw maken als je een nieuwe link wilt." value={form.secure_token} onChange={(value) => update("secure_token", value)} required />
        <label className="flex items-center gap-3 text-sm font-semibold text-coffee">
          <input type="checkbox" checked={Boolean(form.is_published)} onChange={(event) => update("is_published", event.target.checked)} className="h-4 w-4 accent-cocoa" />
          Gepubliceerd
          <span className="text-xs font-normal text-coffee/55">Alleen gepubliceerde galerijen zijn via de klantlink zichtbaar.</span>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee md:col-span-2">
          Interne notitie
          <span className="-mt-1 text-xs font-normal text-coffee/55">Alleen zichtbaar in admin.</span>
          <textarea rows={4} value={form.internal_note || ""} onChange={(event) => update("internal_note", event.target.value)} className="resize-none rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
        </label>
        {publicLink && (
          <div className="rounded-lg bg-linen p-4 text-sm text-coffee/75 md:col-span-2">
            <p className="font-semibold text-coffee">Klantlink</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a href={publicLink} target="_blank" rel="noopener noreferrer" className="break-all underline-offset-2 hover:underline">{publicLink}</a>
              <AdminButton type="button" variant="secondary" onClick={() => navigator.clipboard.writeText(publicLink)}>
                <Copy size={14} /> Kopieer
              </AdminButton>
            </div>
          </div>
        )}
        {message && <p className="rounded-lg bg-linen px-4 py-3 text-sm text-coffee md:col-span-2">{message}</p>}
        <AdminButton type="submit" disabled={saving} className="justify-self-start md:col-span-2">
          <Save size={14} /> {saving ? "Opslaan..." : "Opslaan"}
        </AdminButton>
      </form>

      {!isNew && (
        <div className="mt-8">
          <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="fine-label text-[0.62rem] font-semibold text-cocoa">Keuze verwerken</p>
                <h2 className="display-title mt-1 text-2xl font-semibold text-coffee">Klantkeuzes</h2>
                <p className="mt-1 text-sm text-coffee/65">
                  {selectedPhotos.length} gekozen beeld(en), waarvan {extraPhotos.length} extra.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <AdminButton type="button" variant="secondary" onClick={copySelection} disabled={!selectedPhotos.length}>
                  <ClipboardList size={14} /> Keuze kopieren
                </AdminButton>
                <AdminButton type="button" onClick={markFinished} disabled={saving || form.status === "Afgerond"}>
                  <CheckCircle size={14} /> Galerij afronden
                </AdminButton>
              </div>
            </div>
          </div>
          <div className="mt-3">
            <DataTable
              loading={false}
              rows={photos}
              getRowKey={(row) => row.id}
              emptyLabel="Nog geen foto's in deze galerij."
              columns={[
                { key: "title", label: "Foto" },
                { key: "is_favorite", label: "Favoriet", render: (row) => (row.is_favorite ? "Ja" : "Nee") },
                { key: "is_extra_requested", label: "Extra", render: (row) => (row.is_extra_requested ? "Ja" : "Nee") },
                { key: "client_note", label: "Notitie" },
                { key: "updated_at", label: "Gewijzigd", render: (row) => formatDate(row.updated_at) },
              ]}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({ label, help, type = "text", value, onChange, required }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-coffee">
      {label}
      {help && <span className="-mt-1 text-xs font-normal text-coffee/55">{help}</span>}
      <input type={type} required={required} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-cocoa/20 bg-cream px-3 py-2 text-sm outline-none focus:border-cocoa" />
    </label>
  );
}
