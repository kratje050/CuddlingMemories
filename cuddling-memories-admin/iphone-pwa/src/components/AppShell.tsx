import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: "H" },
  { to: "/calendar", label: "Kalender", icon: "K" },
  { to: "/bookings", label: "Boekingen", icon: "B" },
  { to: "/notifications", label: "Meldingen", icon: "M" },
  { to: "/more", label: "Meer", icon: "+" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <main className="safe-bottom mx-auto min-h-screen w-full max-w-md px-4 pt-6">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-cocoa/15 bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-soft backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center rounded-xl px-2 py-2 text-[0.65rem] font-semibold ${isActive ? "bg-linen text-coffee" : "text-cocoa"}`
              }
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[0.65rem]">{icon}</span>
              <span className="mt-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
