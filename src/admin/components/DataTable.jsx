export default function DataTable({ columns, rows, loading, emptyLabel = "Nog geen gegevens.", getRowKey, onRowClick }) {
  if (loading) {
    return <p className="rounded-lg bg-card p-6 text-sm text-coffee/70 shadow-soft warm-border">Laden...</p>;
  }

  if (!rows || rows.length === 0) {
    return <p className="rounded-lg bg-card p-6 text-sm text-coffee/70 shadow-soft warm-border">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-card shadow-soft warm-border">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-cocoa/15 text-coffee/60">
            {columns.map((col) => (
              <th key={col.key} className="fine-label px-4 py-3 text-[0.62rem]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-cocoa/10 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-linen/60" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-coffee/85">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
