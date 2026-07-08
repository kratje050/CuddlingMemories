import { Link } from "react-router-dom";

const base =
  "inline-flex min-h-11 items-center justify-center rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition duration-300 focus:outline-none focus:ring-2 focus:ring-cocoa/30 focus:ring-offset-2 focus:ring-offset-cream";

const variants = {
  primary: "bg-cocoa text-card shadow-glow hover:-translate-y-0.5 hover:bg-coffee",
  secondary: "border border-cocoa/70 bg-card/45 text-coffee hover:-translate-y-0.5 hover:bg-card",
  ghost: "text-coffee hover:text-cocoa",
};

export default function Button({ to, href, children, variant = "primary", className = "", ...props }) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

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
