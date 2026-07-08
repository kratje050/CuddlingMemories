import { Facebook, Heart, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

const links = [
  ["Home", "/"],
  ["Portfolio", "/portfolio"],
  ["Pakketten", "/pakketten"],
  ["Over Demy", "/over-demy"],
  ["Werkwijze", "/werkwijze"],
  ["Model gezocht", "/model-gezocht"],
  ["Contact", "/contact"],
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-linen/80">
      <div className="container-soft grid gap-10 py-10 md:grid-cols-[1.3fr_1fr_0.8fr_1.1fr]">
        <div>
          <div className="script-line text-3xl text-coffee">Cuddling Memories</div>
          <p className="fine-label mt-1 text-[0.62rem] text-cocoa">Fotografie</p>
        </div>
        <p className="max-w-xs text-sm leading-7 text-coffee/75">
          Liefdevolle, pure en tijdloze fotografie voor momenten die steeds waardevoller worden.
        </p>
        <div>
          <h3 className="fine-label text-[0.7rem] font-semibold text-coffee">Pagina's</h3>
          <div className="mt-4 grid gap-2 text-sm text-coffee/75">
            {links.map(([label, to]) => (
              <Link key={to} to={to} className="transition hover:text-cocoa">
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="fine-label text-[0.7rem] font-semibold text-coffee">Volg mij</h3>
          <div className="mt-4 flex gap-3">
            <a
              href="https://www.instagram.com/cuddlingmemories/"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full border border-cocoa/30 text-cocoa transition hover:bg-card"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61590264604841"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-10 w-10 place-items-center rounded-full border border-cocoa/30 text-cocoa transition hover:bg-card"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </a>
          </div>
          <p className="mt-7 flex items-center gap-2 text-xs leading-6 text-coffee/70">
            © {year} Cuddling Memories Fotografie. Alle rechten voorbehouden.
            <Heart size={14} className="text-cocoa" />
          </p>
          <Link to="/privacybeleid" className="mt-2 block text-xs text-coffee/60 underline-offset-2 hover:underline">
            Privacybeleid
          </Link>
        </div>
      </div>
    </footer>
  );
}
