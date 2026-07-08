import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Button from "./Button.jsx";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/pakketten", label: "Pakketten" },
  { to: "/over-demy", label: "Over Demy" },
  { to: "/werkwijze", label: "Werkwijze" },
  { to: "/model-gezocht", label: "Model gezocht" },
  { to: "/contact", label: "Contact" },
];

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-3" aria-label="Cuddling Memories home">
      <span>
        <span className="script-line block text-3xl leading-none text-coffee md:text-4xl">Cuddling Memories</span>
        <span className="fine-label block text-[0.62rem] text-cocoa">Fotografie</span>
      </span>
      <Heart className="text-cocoa transition group-hover:scale-110" size={20} strokeWidth={1.5} />
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5">
      <nav className="mx-auto flex max-w-[1500px] items-center justify-between rounded-lg bg-card/82 px-4 py-3 shadow-soft backdrop-blur-xl warm-border md:px-7">
        <Logo />
        <div className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="nav-link fine-label text-[0.7rem] font-semibold text-coffee/85 transition hover:text-cocoa"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden lg:block">
          <Button to="/contact">Boek een shoot</Button>
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
