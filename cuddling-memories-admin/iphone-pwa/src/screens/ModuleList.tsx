import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState, ErrorBox, PageHeader } from "../components/ui";
import {
  createAdminRow,
  createSecureToken,
  deleteAdminRow,
  deleteGalleryPhoto,
  formatAdminValue,
  listPortfolioAlbums,
  listGalleryPhotos,
  listAdminRows,
  uploadPortfolioPhotos,
  uploadGalleryPhotos,
  updateAdminRow,
  type AdminRow,
  type GalleryPhoto,
  type PortfolioAlbum,
} from "../lib/mobileAdminApi";

type FieldType = "text" | "number" | "textarea" | "checkbox" | "select" | "date" | "datetime-local";

type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
  help?: string;
};

type ModuleConfig = {
  title: string;
  subtitle: string;
  table?: string;
  orderBy?: string;
  ascending?: boolean;
  primaryFields: string[];
  secondaryFields: string[];
  badgeField?: string;
  emptyTitle: string;
  emptyText: string;
  createLabel?: string;
  fields?: FieldConfig[];
  defaults?: () => AdminRow;
  allowDelete?: boolean;
};

const shootTypes = [
  "Portretshoot",
  "Cakesmash",
  "Zwangerschapsshoot",
  "Gezinsshoot",
  "Newbornshoot",
  "Motherhood",
  "Buiten shoot",
  "Model staan met 50% korting",
  "Anders",
];

const galleryStatuses = ["Concept", "Gepubliceerd", "Wacht op keuze klant", "Keuze ontvangen", "Extra beelden aangevraagd", "Afgerond", "Verlopen", "Verborgen"];

const configs: Record<string, ModuleConfig> = {
  availability: {
    title: "Beschikbaarheid",
    subtitle: "Geblokkeerde periodes beheren.",
    table: "blocked_periods",
    orderBy: "start_datetime",
    ascending: true,
    primaryFields: ["title", "reason"],
    secondaryFields: ["start_datetime", "end_datetime"],
    badgeField: "all_day",
    emptyTitle: "Geen blokkades",
    emptyText: "Er staan geen geblokkeerde periodes in de lijst.",
    createLabel: "Nieuwe blokkade",
    allowDelete: true,
    defaults: () => ({ title: "", reason: "", all_day: true }),
    fields: [
      { name: "title", label: "Titel", required: true, help: "Bijvoorbeeld vakantie, volgeboekt of niet beschikbaar." },
      { name: "reason", label: "Reden", type: "textarea" },
      { name: "start_datetime", label: "Start", type: "datetime-local", required: true },
      { name: "end_datetime", label: "Einde", type: "datetime-local", required: true },
      { name: "all_day", label: "Hele dag", type: "checkbox" },
    ],
  },
  "month-planning": {
    title: "Maandplanning",
    subtitle: "Gebruik de kalender-tab voor de actuele maandstatussen.",
    primaryFields: [],
    secondaryFields: [],
    emptyTitle: "Open kalender",
    emptyText: "De maandplanning staat onder de tab Kalender.",
  },
  packages: {
    title: "Pakketten",
    subtitle: "Shoots, prijzen en inbegrepen beelden aanpassen.",
    table: "packages",
    orderBy: "sort_order",
    ascending: true,
    primaryFields: ["title"],
    secondaryFields: ["shoot_type", "price", "included_images"],
    badgeField: "price_unit",
    emptyTitle: "Geen pakketten",
    emptyText: "Er zijn nog geen pakketten gevonden.",
    createLabel: "Nieuw pakket",
    allowDelete: true,
    defaults: () => ({ price_unit: "shoot", button_text: "Boek deze shoot", is_published: true, is_featured: false, sort_order: 10 }),
    fields: [
      { name: "title", label: "Naam pakket", required: true },
      { name: "slug", label: "Slug", help: "Mag leeg blijven; dan wordt hij automatisch uit de pakketnaam gemaakt." },
      { name: "price", label: "Prijs", type: "number", required: true },
      { name: "price_unit", label: "Eenheid", type: "select", options: ["shoot", "item", "km"], required: true },
      { name: "shoot_type", label: "Gekoppelde shoot", type: "select", options: shootTypes },
      { name: "included_images", label: "Aantal beelden", type: "number" },
      { name: "description", label: "Omschrijving", type: "textarea" },
      { name: "extra_info", label: "Extra info", type: "textarea" },
      { name: "button_text", label: "Knoptekst" },
      { name: "sort_order", label: "Sortering", type: "number" },
      { name: "is_featured", label: "Uitgelicht", type: "checkbox" },
      { name: "is_published", label: "Gepubliceerd", type: "checkbox" },
    ],
  },
  clients: {
    title: "Klanten",
    subtitle: "Klantgegevens en galerijen bij elkaar.",
    table: "client_galleries",
    orderBy: "created_at",
    primaryFields: ["client_name", "title"],
    secondaryFields: ["client_email", "status", "expires_at"],
    badgeField: "status",
    emptyTitle: "Geen klanten",
    emptyText: "Nog geen klantgalerijen gevonden.",
    createLabel: "Nieuwe klantgalerij",
    allowDelete: true,
    defaults: () => galleryDefaults(),
    fields: galleryFields(),
  },
  waitlist: {
    title: "Wachtlijst",
    subtitle: "Aanmeldingen volgen en aanpassen.",
    table: "waitlist_entries",
    primaryFields: ["name", "customer_name"],
    secondaryFields: ["customer_email", "shoot_type", "preferred_month"],
    badgeField: "status",
    emptyTitle: "Geen wachtlijst",
    emptyText: "Er staan nog geen aanmeldingen op de wachtlijst.",
    createLabel: "Wachtlijst toevoegen",
    allowDelete: true,
    defaults: () => ({ status: "Nieuw" }),
    fields: [
      { name: "customer_name", label: "Naam", required: true },
      { name: "customer_email", label: "E-mailadres", required: true },
      { name: "shoot_type", label: "Shoot", type: "select", options: shootTypes },
      { name: "preferred_month", label: "Gewenste maand" },
      { name: "status", label: "Status", type: "select", options: ["Nieuw", "Bekeken", "Benaderd", "Wacht op reactie", "Omgezet naar boeking", "Niet meer nodig", "Gearchiveerd"] },
      { name: "message", label: "Bericht", type: "textarea" },
      { name: "internal_note", label: "Interne notitie", type: "textarea" },
    ],
  },
  "mini-sessions": {
    title: "Mini-shoots",
    subtitle: "Mini-shoot dagen beheren.",
    table: "mini_sessions",
    orderBy: "date",
    ascending: false,
    primaryFields: ["title"],
    secondaryFields: ["date", "location", "price"],
    badgeField: "status",
    emptyTitle: "Geen mini-shoots",
    emptyText: "Er zijn nog geen mini-shoot dagen gevonden.",
    createLabel: "Nieuwe mini-shoot",
    allowDelete: true,
    defaults: () => ({ status: "Concept", is_published: false, duration_minutes: 20, included_images: 0 }),
    fields: [
      { name: "title", label: "Titel", required: true },
      { name: "slug", label: "Slug", required: true },
      { name: "date", label: "Datum", type: "date", required: true },
      { name: "location", label: "Locatie" },
      { name: "price", label: "Prijs", type: "number" },
      { name: "included_images", label: "Inbegrepen beelden", type: "number" },
      { name: "status", label: "Status", type: "select", options: ["Concept", "Gepubliceerd", "Vol", "Gesloten", "Afgerond", "Verborgen"] },
      { name: "description", label: "Omschrijving", type: "textarea" },
      { name: "duration_minutes", label: "Duur in minuten", type: "number" },
      { name: "is_published", label: "Gepubliceerd", type: "checkbox" },
    ],
  },
  giftcards: {
    title: "Cadeaubonnen",
    subtitle: "Aanvragen en status aanpassen.",
    table: "giftcards",
    primaryFields: ["recipient_name", "purchaser_name"],
    secondaryFields: ["purchaser_email", "amount", "expires_at"],
    badgeField: "status",
    emptyTitle: "Geen cadeaubonnen",
    emptyText: "Er zijn nog geen cadeaubonnen gevonden.",
    createLabel: "Cadeaubon toevoegen",
    allowDelete: true,
    defaults: () => ({ status: "Nieuw", delivery_method: "Digitaal", giftcard_type: "Vrij bedrag" }),
    fields: [
      { name: "purchaser_name", label: "Naam aanvrager", required: true },
      { name: "purchaser_email", label: "E-mail aanvrager", required: true },
      { name: "recipient_name", label: "Naam ontvanger" },
      { name: "giftcard_type", label: "Soort", type: "select", options: ["Vrij bedrag", "Pakket"] },
      { name: "amount", label: "Bedrag", type: "number" },
      { name: "delivery_method", label: "Leverwijze", type: "select", options: ["Digitaal", "Post", "Afhalen"] },
      { name: "code", label: "Code" },
      { name: "status", label: "Status", type: "select", options: ["Nieuw", "Wacht op betaling", "Betaald", "Verzonden", "Gebruikt", "Verlopen", "Geannuleerd"] },
      { name: "expires_at", label: "Vervaldatum", type: "date" },
      { name: "personal_message", label: "Boodschap", type: "textarea" },
      { name: "internal_note", label: "Interne notitie", type: "textarea" },
    ],
  },
  galleries: {
    title: "Galerijen",
    subtitle: "Klantgalerijen aanmaken en aanpassen.",
    table: "client_galleries",
    primaryFields: ["title", "client_name"],
    secondaryFields: ["client_email", "included_images", "expires_at"],
    badgeField: "status",
    emptyTitle: "Geen galerijen",
    emptyText: "Er zijn nog geen klantgalerijen gevonden.",
    createLabel: "Nieuwe galerij",
    allowDelete: true,
    defaults: () => galleryDefaults(),
    fields: galleryFields(),
  },
  "portfolio-photos": {
    title: "Portfolio foto's",
    subtitle: "Meerdere portfoliofoto's tegelijk uploaden.",
    table: "portfolio_photos",
    orderBy: "sort_order",
    ascending: true,
    primaryFields: ["title", "alt_text"],
    secondaryFields: ["category", "sort_order"],
    badgeField: "is_featured",
    emptyTitle: "Geen portfoliofoto's",
    emptyText: "Er zijn nog geen portfoliofoto's gevonden.",
    allowDelete: true,
  },
  settings: {
    title: "Instellingen",
    subtitle: "Basisinstellingen voor website en app aanpassen.",
    table: "site_settings",
    primaryFields: ["site_name", "default_seo_title"],
    secondaryFields: ["admin_notification_email", "email_from", "updated_at"],
    emptyTitle: "Geen instellingen",
    emptyText: "Er zijn nog geen instellingen gevonden.",
    fields: [
      { name: "site_name", label: "Sitenaam" },
      { name: "admin_notification_email", label: "Admin e-mail" },
      { name: "email_from", label: "Afzender e-mail" },
      { name: "default_seo_title", label: "Standaard SEO titel", type: "textarea" },
      { name: "default_seo_description", label: "Standaard SEO omschrijving", type: "textarea" },
    ],
  },
};

export default function ModuleList({ moduleId }: { moduleId: string }) {
  const config = configs[moduleId] || configs.settings;
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(Boolean(config.table));
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<AdminRow>({});
  const [saving, setSaving] = useState(false);

  const canEdit = Boolean(config.table && config.fields?.length);
  const title = useMemo(() => (isNew ? config.createLabel || `Nieuw ${config.title.toLowerCase()}` : getPrimaryText(editing || {}, config.primaryFields)), [config, editing, isNew]);

  async function load() {
    if (!config.table) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setRows(await listAdminRows(config.table, config.orderBy, config.ascending));
    } catch {
      setRows([]);
      setError(`${config.title} kon niet worden geladen.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setEditing(null);
    setIsNew(false);
    load();
  }, [moduleId]);

  function startNew() {
    setError("");
    setIsNew(true);
    setEditing(null);
    setForm(config.defaults?.() || {});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(row: AdminRow) {
    setError("");
    setIsNew(false);
    setEditing(row);
    setForm({ ...row });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeEditor() {
    setEditing(null);
    setIsNew(false);
    setForm({});
  }

  function updateField(field: FieldConfig, value: string | boolean) {
    setForm((current) => ({ ...current, [field.name]: value }));
  }

  async function save() {
    if (!config.table) return;
    setSaving(true);
    setError("");
    try {
      let payload = sanitizePayload(form, config.fields || []);
      if (moduleId === "packages") {
        payload = {
          ...payload,
          slug: payload.slug || slugify(payload.title),
          price_unit: payload.price_unit || "shoot",
          button_text: payload.button_text || "Boek deze shoot",
          sort_order: payload.sort_order ?? 0,
          is_published: Boolean(payload.is_published),
        };
      }
      let saved: AdminRow | null = null;
      if (isNew) {
        saved = await createAdminRow(config.table, payload);
      } else if (editing?.id) {
        saved = await updateAdminRow(config.table, String(editing.id), payload);
      }
      await load();
      if (saved && (moduleId === "galleries" || moduleId === "clients")) {
        setIsNew(false);
        setEditing(saved);
        setForm({ ...saved });
      } else {
        closeEditor();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan is niet gelukt.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: AdminRow) {
    if (!config.table || !row.id || !window.confirm("Weet je zeker dat je dit wilt verwijderen?")) return;
    setError("");
    try {
      await deleteAdminRow(config.table, String(row.id));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verwijderen is niet gelukt.");
    }
  }

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <PageHeader title={config.title} subtitle={config.subtitle} />
        {canEdit && config.createLabel ? (
          <button onClick={startNew} className="mt-1 rounded-full bg-cocoa px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-card">
            Nieuw
          </button>
        ) : null}
      </div>
      {moduleId === "month-planning" ? (
        <Link to="/calendar">
          <Card>
            <p className="font-semibold text-coffee">Bekijk maandplanning</p>
            <p className="mt-2 text-sm leading-6 text-coffee/65">Open de kalender-tab voor de actuele beschikbaarheid per maand.</p>
          </Card>
        </Link>
      ) : null}
      {moduleId === "portfolio-photos" ? <PortfolioPhotoUploader onUploaded={load} /> : null}
      {error ? <ErrorBox message={error} /> : null}
      {(editing || isNew) && canEdit ? (
        <Card className="mb-4">
          <p className="text-lg font-semibold text-coffee">{title}</p>
          <div className="mt-4 grid gap-4">
            {(config.fields || []).map((field) => (
              <Field key={field.name} field={field} value={form[field.name]} onChange={(value) => updateField(field, value)} />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={closeEditor} className="rounded-full border border-cocoa/25 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-coffee">
              Annuleren
            </button>
            <Button onClick={save} disabled={saving}>{saving ? "Opslaan..." : "Opslaan"}</Button>
          </div>
          {(moduleId === "galleries" || moduleId === "clients") && editing?.id && !isNew ? (
            <GalleryPhotoUploader galleryId={String(editing.id)} />
          ) : null}
        </Card>
      ) : null}
      <div className="grid gap-3">
        {loading ? <EmptyState title="Laden..." text={`${config.title} wordt opgehaald.`} /> : null}
        {!loading && !rows.length ? <EmptyState title={config.emptyTitle} text={config.emptyText} /> : null}
        {rows.map((row, index) => (
          <Card key={String(row.id || index)}>
            <button type="button" onClick={() => canEdit && startEdit(row)} className="w-full text-left">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-coffee">{getPrimaryText(row, config.primaryFields)}</p>
                  <div className="mt-2 grid gap-1">
                    {config.secondaryFields.map((field) => {
                      const value = formatAdminValue(row[field]);
                      return value ? <p key={field} className="text-sm text-coffee/60">{fieldLabel(field)}: {value}</p> : null;
                    })}
                  </div>
                </div>
                {config.badgeField && formatAdminValue(row[config.badgeField]) ? <Badge>{formatAdminValue(row[config.badgeField])}</Badge> : null}
              </div>
            </button>
            {config.allowDelete && row.id ? (
              <button onClick={() => remove(row)} className="mt-4 w-full rounded-full border border-red-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-red-700">
                Verwijderen
              </button>
            ) : null}
          </Card>
        ))}
      </div>
    </>
  );
}

function PortfolioPhotoUploader({ onUploaded }: { onUploaded: () => Promise<void> }) {
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    listPortfolioAlbums()
      .then(setAlbums)
      .catch((err) => setMessage(err instanceof Error ? err.message : "Albums konden niet worden geladen."));
  }, []);

  async function upload() {
    setUploading(true);
    setMessage("");
    try {
      const uploaded = await uploadPortfolioPhotos({
        albumId,
        category,
        title,
        altText,
        sortOrder: Number(sortOrder || 0),
        files,
      });
      setFiles([]);
      setTitle("");
      setSortOrder((current) => String(Number(current || 0) + uploaded));
      setMessage(`${uploaded} portfoliofoto${uploaded === 1 ? "" : "'s"} geupload.`);
      await onUploaded();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Uploaden is niet gelukt.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="mb-4">
      <p className="text-lg font-semibold text-coffee">Foto's uploaden</p>
      <p className="mt-1 text-sm leading-6 text-coffee/60">Kies een album en selecteer daarna een of meerdere foto's tegelijk.</p>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Album *
          <select
            value={albumId}
            onChange={(event) => {
              const selectedId = event.target.value;
              const album = albums.find((item) => item.id === selectedId);
              setAlbumId(selectedId);
              setCategory(album?.category || "");
            }}
            className="w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee outline-none focus:border-cocoa"
          >
            <option value="">Kies een album</option>
            {albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Categorie
          <input value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee outline-none focus:border-cocoa" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Titel
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee outline-none focus:border-cocoa" />
          <span className="text-xs font-normal text-coffee/55">Bij meerdere foto's wordt de bestandsnaam gebruikt.</span>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Alt-tekst *
          <input value={altText} onChange={(event) => setAltText(event.target.value)} className="w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee outline-none focus:border-cocoa" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Sortering
          <input type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee outline-none focus:border-cocoa" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-coffee">
          Foto's *
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
            className="w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee"
          />
          {files.length > 0 ? <span className="text-xs font-normal text-coffee/55">{files.length} bestand(en) gekozen.</span> : null}
        </label>
      </div>
      <Button onClick={upload} disabled={uploading || !files.length} className="mt-4 w-full">
        {uploading ? "Uploaden..." : "Foto's uploaden"}
      </Button>
      {message ? <p className="mt-3 rounded-xl bg-linen px-4 py-3 text-sm text-coffee">{message}</p> : null}
    </Card>
  );
}

function GalleryPhotoUploader({ galleryId }: { galleryId: string }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPhotos() {
    try {
      setPhotos(await listGalleryPhotos(galleryId));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Foto's konden niet worden geladen.");
    }
  }

  useEffect(() => {
    loadPhotos();
  }, [galleryId]);

  async function upload() {
    if (!files.length) return;
    setUploading(true);
    setMessage("");
    try {
      const uploaded = await uploadGalleryPhotos(galleryId, files, photos.length);
      setFiles([]);
      setMessage(`${uploaded} foto${uploaded === 1 ? "" : "'s"} geupload.`);
      await loadPhotos();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Uploaden is niet gelukt.");
    } finally {
      setUploading(false);
    }
  }

  async function remove(photo: GalleryPhoto) {
    if (!window.confirm("Deze foto verwijderen?")) return;
    try {
      await deleteGalleryPhoto(photo.id);
      await loadPhotos();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Foto verwijderen is niet gelukt.");
    }
  }

  return (
    <div className="mt-6 border-t border-cocoa/15 pt-5">
      <p className="text-lg font-semibold text-coffee">Foto's</p>
      <p className="mt-1 text-sm leading-6 text-coffee/60">Kies een of meerdere foto's tegelijk uit je fotobibliotheek.</p>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-coffee">
        Foto's uploaden
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files || []))}
          className="w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee"
        />
        {files.length > 0 ? <span className="text-xs font-normal text-coffee/55">{files.length} bestand(en) gekozen.</span> : null}
      </label>
      <Button onClick={upload} disabled={uploading || !files.length} className="mt-3 w-full">
        {uploading ? "Uploaden..." : "Foto's uploaden"}
      </Button>
      {message ? <p className="mt-3 rounded-xl bg-linen px-4 py-3 text-sm text-coffee">{message}</p> : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="overflow-hidden rounded-2xl border border-cocoa/15 bg-cream">
            <img src={photo.image_url} alt={photo.title || ""} className="aspect-square w-full object-cover" />
            <div className="p-3">
              <p className="truncate text-xs font-semibold text-coffee">{photo.title || photo.filename || "Foto"}</p>
              <button onClick={() => remove(photo)} className="mt-2 w-full rounded-full border border-red-200 px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-red-700">
                Verwijder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ field, value, onChange }: { field: FieldConfig; value: unknown; onChange: (value: string | boolean) => void }) {
  const inputClass = "w-full rounded-xl border border-cocoa/20 bg-cream px-4 py-3 text-sm text-coffee outline-none focus:border-cocoa";
  const normalized = normalizeInputValue(field, value);

  return (
    <label className="grid gap-2 text-sm font-semibold text-coffee">
      {field.label}{field.required ? " *" : ""}
      {field.type === "textarea" ? (
        <textarea className={`${inputClass} min-h-28 resize-none`} value={normalized} onChange={(event) => onChange(event.target.value)} />
      ) : field.type === "checkbox" ? (
        <span className="flex items-center gap-3 rounded-xl border border-cocoa/15 bg-cream px-4 py-3">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-cocoa" />
          <span className="text-sm font-normal text-coffee/70">Ja</span>
        </span>
      ) : field.type === "select" ? (
        <select className={inputClass} value={normalized} onChange={(event) => onChange(event.target.value)}>
          <option value="">Kies...</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : (
        <input className={inputClass} type={field.type || "text"} value={normalized} onChange={(event) => onChange(event.target.value)} />
      )}
      {field.help ? <span className="text-xs font-normal leading-5 text-coffee/55">{field.help}</span> : null}
    </label>
  );
}

function normalizeInputValue(field: FieldConfig, value: unknown) {
  if (value === null || value === undefined) return "";
  if (field.type === "datetime-local" && typeof value === "string") return value.slice(0, 16);
  if (field.type === "date" && typeof value === "string") return value.slice(0, 10);
  return String(value);
}

function sanitizePayload(form: AdminRow, fields: FieldConfig[]) {
  const payload: AdminRow = {};
  for (const field of fields) {
    const raw = form[field.name];
    if (field.type === "checkbox") {
      payload[field.name] = Boolean(raw);
      continue;
    }
    if (field.type === "number") {
      payload[field.name] = raw === "" || raw === null || raw === undefined ? null : Number(raw);
      continue;
    }
    payload[field.name] = raw === "" ? null : raw;
  }
  return payload;
}

function slugify(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function galleryDefaults() {
  return {
    title: "",
    client_name: "",
    client_email: "",
    included_images: 7,
    secure_token: createSecureToken(),
    status: "Concept",
    is_published: false,
  };
}

function galleryFields(): FieldConfig[] {
  return [
    { name: "title", label: "Galerijtitel", required: true },
    { name: "client_name", label: "Klantnaam", required: true },
    { name: "client_email", label: "E-mailadres klant", required: true },
    { name: "included_images", label: "Inbegrepen beelden", type: "number" },
    { name: "status", label: "Status", type: "select", options: galleryStatuses },
    { name: "expires_at", label: "Vervaldatum", type: "date" },
    { name: "secure_token", label: "Veilige token", required: true, help: "Deze lange code vormt de klantlink. Alleen wijzigen als je een nieuwe link wilt." },
    { name: "is_published", label: "Gepubliceerd", type: "checkbox" },
    { name: "internal_note", label: "Interne notitie", type: "textarea" },
  ];
}

function getPrimaryText(row: AdminRow, fields: string[]) {
  for (const field of fields) {
    const value = formatAdminValue(row[field]);
    if (value) return value;
  }
  return "Item";
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    client_email: "E-mail",
    customer_email: "E-mail",
    included_images: "Beelden",
    expires_at: "Vervalt",
    shoot_type: "Shoot",
    price: "Prijs",
    preferred_month: "Gewenste maand",
    purchaser_email: "E-mail",
    start_datetime: "Start",
    end_datetime: "Einde",
  };
  return labels[field] || field.replace(/_/g, " ");
}
