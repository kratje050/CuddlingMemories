import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CalendarPlus,
  CalendarRange,
  Image,
  FolderHeart,
  Tag,
  Star,
  HelpCircle,
  Camera,
  FileText,
  Search,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/bookings", label: "Boekingen", icon: CalendarCheck },
  { to: "/admin/beschikbaarheid", label: "Beschikbaarheid", icon: CalendarClock },
  { to: "/admin/geblokkeerde-dagen", label: "Geblokkeerde dagen", icon: CalendarX },
  { to: "/admin/tijdslots", label: "Tijdslots", icon: CalendarPlus },
  { to: "/admin/maandplanning", label: "Maandplanning", icon: CalendarRange },
  { to: "/admin/albums", label: "Albums", icon: FolderHeart },
  { to: "/admin/portfolio", label: "Foto's", icon: Image },
  { to: "/admin/packages", label: "Pakketten", icon: Tag },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/faq", label: "FAQ", icon: HelpCircle },
  { to: "/admin/model-gezocht", label: "Model gezocht", icon: Camera },
  { to: "/admin/pages", label: "Pagina's", icon: FileText },
  { to: "/admin/seo", label: "SEO", icon: Search },
  { to: "/admin/settings", label: "Instellingen", icon: Settings },
];

export default function AdminSidebar({ onNavigate }) {
  return (
    <nav className="grid gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              isActive ? "bg-cocoa text-card" : "text-coffee/80 hover:bg-linen"
            }`
          }
        >
          <Icon size={18} strokeWidth={1.7} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
