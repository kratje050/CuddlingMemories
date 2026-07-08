import AdminButton from "./AdminButton.jsx";

export default function ConfirmDialog({ open, title, description, confirmLabel = "Verwijderen", onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-coffee/40 px-4">
      <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-soft warm-border">
        <h3 className="display-title text-xl font-semibold text-coffee">{title}</h3>
        {description && <p className="mt-2 text-sm leading-6 text-coffee/75">{description}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <AdminButton variant="secondary" onClick={onCancel}>
            Annuleren
          </AdminButton>
          <AdminButton variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
