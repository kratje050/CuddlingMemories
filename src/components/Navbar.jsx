import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "./Button.jsx";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/pakketten", label: "Pakketten" },
  { to: "/over-demy", label: "Over mij" },
  { to: "/werkwijze", label: "Werkwijze" },
  { to: "/mini-shoots", label: "Mini-shoots" },
  { to: "/cadeaubon", label: "Cadeaubon" },
  { to: "/model-gezocht", label: "Model gezocht" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

function Logo() {
  const settings = useSiteSettings();

  return (
    <Link to="/" className="group flex shrink-0 items-center gap-3 min-[1450px]:w-[11.5rem]" aria-label={`${settings.logo_text} home`}>
      <span className="min-w-0">
        <span className="script-line block text-3xl leading-none text-coffee min-[1450px]:max-w-[11rem] min-[1450px]:text-4xl min-[1450px]:leading-[0.86]">{settings.logo_text}</span>
        <span className="fine-label block text-[0.62rem] text-cocoa">{settings.subtitle}</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5">
      <nav className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 rounded-lg bg-card px-4 py-3 shadow-[0_14px_45px_rgba(78,59,47,0.16)] warm-border md:px-5 2xl:px-7">
        <Logo />
        <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 min-[1450px]:flex 2xl:gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `fine-label relative whitespace-nowrap py-2 text-[0.62rem] font-semibold transition 2xl:text-[0.68rem] ${
                isActive ? "text-cocoa after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-cocoa" : "text-coffee hover:text-cocoa"
              }`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="ml-2 hidden shrink-0 min-[1450px]:block 2xl:ml-3">
          <Button to="/boek-een-shoot" className="px-4 2xl:px-6">
            Boek een shoot
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-full border border-cocoa/25 bg-card text-coffee min-[1450px]:hidden"
          aria-label={open ? "Sluit menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div className="mx-auto mt-2 max-h-[calc(100vh-7rem)] max-w-[1500px] overflow-y-auto rounded-lg bg-card p-4 shadow-soft warm-border min-[1450px]:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-4 py-3 text-sm font-semibold text-coffee transition hover:bg-linen"
              >
                {item.label}
              </NavLink>
            ))}
            <Button to="/boek-een-shoot" onClick={() => setOpen(false)} className="mt-2 w-full">
              Boek een shoot
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
