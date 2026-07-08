const labels = ["Shoot", "Pakket", "Datum", "Tijd", "Gegevens", "Overzicht"];

export default function StepIndicator({ current }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-coffee/60 sm:gap-3 sm:text-xs">
      {labels.map((label, index) => {
        const isActive = index === current;
        const isDone = index < current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full border transition ${
                isActive
                  ? "border-cocoa bg-cocoa text-card"
                  : isDone
                    ? "border-cocoa/60 bg-linen text-cocoa"
                    : "border-cocoa/25 bg-card text-coffee/50"
              }`}
            >
              {index + 1}
            </span>
            <span className={isActive ? "text-coffee" : ""}>{label}</span>
            {index < labels.length - 1 && <span className="mx-1 h-px w-4 bg-cocoa/20 sm:w-6" />}
          </li>
        );
      })}
    </ol>
  );
}
