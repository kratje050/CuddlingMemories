export default function PackageStep({ packages, value, onSelect }) {
  if (packages.length === 0) {
    return (
      <p className="rounded-lg bg-linen p-6 text-sm text-coffee/75">
        Voor deze shoot is er geen apart pakket nodig. We stemmen de details samen af — klik hieronder om verder te
        gaan naar de kalender.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {packages.map((pkg) => (
        <button
          key={pkg.id}
          type="button"
          onClick={() => onSelect(pkg.id)}
          className={`rounded-lg border p-4 text-left transition ${
            value === pkg.id
              ? "border-cocoa bg-cocoa text-card shadow-glow"
              : "border-cocoa/20 bg-card text-coffee hover:border-cocoa/50 hover:bg-linen/60"
          }`}
        >
          <p className="text-sm font-semibold">{pkg.title}</p>
          <p className={`mt-1 text-xs ${value === pkg.id ? "text-card/85" : "text-coffee/65"}`}>
            €{Number(pkg.price).toFixed(2)}
            {pkg.description ? ` · ${pkg.description}` : ""}
          </p>
        </button>
      ))}
    </div>
  );
}
