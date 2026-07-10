import { Plus } from "lucide-react";
import { useState } from "react";

export default function FAQItem({ item, defaultOpen = false, index = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  const number = String(index + 1).padStart(2, "0");

  return (
    <div
      className={`rounded-lg shadow-soft warm-border transition duration-300 ${
        open ? "bg-card" : "bg-card/70 hover:bg-card"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-4 px-5 py-5 text-left text-coffee"
        aria-expanded={open}
      >
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cocoa/20 bg-linen/60 text-[0.68rem] font-semibold fine-label text-cocoa sm:flex">
          {number}
        </span>
        <span className="flex-1 text-base font-semibold leading-snug">{item.question}</span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cocoa/20 bg-card text-cocoa">
          <Plus className={`transition duration-300 ${open ? "rotate-45" : ""}`} size={18} />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="border-t border-cocoa/10 px-5 pb-6 pt-5 text-sm leading-7 text-coffee/75 sm:pl-[5.75rem]">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}
