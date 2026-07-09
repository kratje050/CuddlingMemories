import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminButton from "../components/AdminButton.jsx";
import AdminLayout from "../components/AdminLayout.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import { formatDate } from "../../lib/formatDate.js";
import { supabase } from "../../lib/supabaseClient.js";

export default function AdminGalleries() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteRow, setDeleteRow] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    return supabase
      .from("client_galleries")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    const { error } = await supabase.from("client_galleries").delete().eq("id", deleteRow.id);
    setDeleting(false);
    if (error) return;
    setDeleteRow(null);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-title text-3xl font-semibold text-coffee">Klantgalerijen</h1>
          <p className="mt-1 text-sm text-coffee/65">Maak beveiligde galerijen aan, upload foto's en bekijk klantkeuzes.</p>
        </div>
        <AdminButton type="button" onClick={() => navigate("/admin/galleries/new")}>
          <Plus size={14} /> Nieuwe galerij
        </AdminButton>
      </div>
      <div className="mt-6">
        <DataTable
          loading={loading}
          rows={rows}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/admin/galleries/${row.id}`)}
          emptyLabel="Nog geen klantgalerijen."
          columns={[
            { key: "title", label: "Galerij" },
            { key: "client_name", label: "Klant" },
            { key: "status", label: "Status" },
            { key: "included_images", label: "Inbegrepen" },
            { key: "expires_at", label: "Vervalt", render: (row) => (row.expires_at ? formatDate(row.expires_at) : "-") },
            {
              key: "actions",
              label: "",
              render: (row) => (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setDeleteRow(row);
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full border border-red-300 text-red-700 transition hover:bg-red-50"
                  aria-label={`Verwijder galerij ${row.title}`}
                  title="Galerij verwijderen"
                >
                  <Trash2 size={15} />
                </button>
              ),
            },
          ]}
        />
      </div>
      <ConfirmDialog
        open={Boolean(deleteRow)}
        title="Galerij verwijderen?"
        description={`De galerij "${deleteRow?.title}" en alle klantkeuzes/fotoregels worden verwijderd. De geuploade bestanden kunnen in Storage blijven staan.`}
        confirmLabel={deleting ? "Verwijderen..." : "Verwijderen"}
        onCancel={() => setDeleteRow(null)}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
}
