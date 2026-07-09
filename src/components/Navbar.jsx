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
  { to: "/contact", label: "Contact" },
];

function Logo() {
  const settings = useSiteSettings();

  return (
    <Link to="/" className="group flex items-center gap-3" aria-label={`${settings.logo_text} home`}>
      <span>
        <span className="script-line block text-3xl leading-none text-coffee md:text-4xl">{settings.logo_text}</span>
        <span className="fine-label block text-[0.62rem] text-cocoa">{settings.subtitle}</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5">
      <nav className="mx-auto flex max-w-[1500px] items-center justify-between gap-3 rounded-lg bg-card/94 px-4 py-3 shadow-soft backdrop-blur-xl warm-border md:px-5 2xl:px-7">
        <Logo />
        <div className="hidden flex-1 items-center justify-center gap-3 xl:gap-5 2xl:gap-7 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="nav-link fine-label whitespace-nowrap text-[0.66rem] font-semibold text-coffee/85 transition hover:text-cocoa xl:text-[0.7rem]"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden shrink-0 lg:block">
          <Button to="/contact" className="px-5 2xl:px-7">
            Boek een shoot
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-11 w-11 place-items-center rounded-full border border-cocoa/25 bg-card text-coffee lg:hidden"
          aria-label={open ? "Sluit menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <div className="mx-auto mt-2 max-w-[1500px] rounded-lg bg-card p-4 shadow-soft warm-border lg:hidden">
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
            <Button to="/contact" onClick={() => setOpen(false)} className="mt-2 w-full">
              Boek een shoot
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
