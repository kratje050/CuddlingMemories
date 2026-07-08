export default function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="rounded-lg bg-card p-5 shadow-soft warm-border">
      <div className="flex items-center justify-between">
        <p className="fine-label text-[0.62rem] text-cocoa">{label}</p>
        {Icon && <Icon size={18} className="text-cocoa" />}
      </div>
      <p className="display-title mt-3 text-3xl font-semibold text-coffee">{value}</p>
      {hint && <p className="mt-1 text-xs text-coffee/60">{hint}</p>}
    </div>
  );
}
