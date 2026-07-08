export default function BarList({ items, valueSuffix = "" }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  if (items.length === 0) {
    return <p className="text-sm text-coffee/60">Nog geen data.</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm text-coffee/85">
            <span>{item.label}</span>
            <span className="font-semibold">
              {item.value}
              {valueSuffix}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-linen">
            <div className="h-2 rounded-full bg-cocoa" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
