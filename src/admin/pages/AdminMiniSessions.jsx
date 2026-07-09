import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminButton from "../components/AdminButton.jsx";
import AdminLayout from "../components/AdminLayout.jsx";
import DataTable from "../components/DataTable.jsx";
import { formatDate } from "../../lib/formatDate.js";
import { supabase } from "../../lib/supabaseClient.js";

export default function AdminMiniSessions() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("mini_sessions").select("*").order("date", { ascending: false }).then(({ data }) => setRows(data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display-title text-3xl font-semibold text-coffee">Mini-shoot dagen</h1>
          <p className="mt-1 text-sm text-coffee/65">Beheer speciale dagen zoals kerst, moederdag, lente, herfst, studio en buiten mini-shoots.</p>
        </div>
        <AdminButton type="button" onClick={() => navigate("/admin/mini-shoots/new")}>
          <Plus size={14} /> Nieuwe mini-shoot
        </AdminButton>
      </div>
      <div className="mt-6">
        <DataTable
          loading={loading}
          rows={rows}
          getRowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/admin/mini-shoots/${row.id}`)}
          emptyLabel="Nog geen mini-shoot dagen."
          columns={[
            { key: "title", label: "Titel" },
            { key: "date", label: "Datum", render: (row) => formatDate(row.date) },
            { key: "price", label: "Prijs", render: (row) => `EUR ${Number(row.price || 0).toFixed(2)}` },
            { key: "status", label: "Status" },
            { key: "is_published", label: "Online", render: (row) => (row.is_published ? "Ja" : "Nee") },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
