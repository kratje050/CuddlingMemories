import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa">Cuddling Memories</p>
      <h1 className="mt-1 text-3xl font-semibold leading-tight text-coffee">{title}</h1>
      {subtitle && <p className="mt-2 text-sm leading-6 text-coffee/65">{subtitle}</p>}
    </header>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-cocoa/15 bg-card p-4 shadow-soft ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "active" | "warning" }) {
  const toneClass =
    tone === "active"
      ? "border-cocoa bg-cocoa text-card"
      : tone === "warning"
        ? "border-clay/40 bg-linen text-coffee"
        : "border-cocoa/15 bg-cream text-coffee";

  return <span className={`rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${toneClass}`}>{children}</span>;
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Card className="text-center">
      <p className="font-semibold text-coffee">{title}</p>
      <p className="mt-2 text-sm leading-6 text-coffee/60">{text}</p>
    </Card>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{message}</p>;
}

export function Button({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-full bg-cocoa px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-card disabled:opacity-60 ${props.className || ""}`}
    >
      {children}
    </button>
  );
}
