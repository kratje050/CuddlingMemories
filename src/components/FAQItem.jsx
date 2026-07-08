import { ChevronDown } from "lucide-react";
import { useState } from "react";

export default function FAQItem({ item, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg bg-card shadow-soft warm-border">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-coffee"
        aria-expanded={open}
      >
        <span>{item.question}</span>
        <ChevronDown className={`shrink-0 transition ${open ? "rotate-180" : ""}`} size={18} />
      </button>
      {open && <p className="px-5 pb-5 text-sm leading-7 text-coffee/75">{item.answer}</p>}
    </div>
  );
}
