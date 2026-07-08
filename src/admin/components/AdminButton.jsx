const base =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-cocoa text-card hover:bg-coffee",
  secondary: "border border-cocoa/30 text-coffee hover:bg-linen",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "text-coffee hover:text-cocoa",
};

export default function AdminButton({ variant = "primary", className = "", children, href, ...props }) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
