export default function ShootTypeStep({ options, value, onSelect }) {
  if (options.length === 0) {
    return (
      <p className="rounded-lg bg-linen p-6 text-sm text-coffee/75">
        Er zijn op dit moment geen shoots beschikbaar om online te boeken. Neem gerust rechtstreeks contact op.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={`rounded-lg border p-4 text-left text-sm font-semibold transition ${
            value === option
              ? "border-cocoa bg-cocoa text-card shadow-glow"
              : "border-cocoa/20 bg-card text-coffee hover:border-cocoa/50 hover:bg-linen/60"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
