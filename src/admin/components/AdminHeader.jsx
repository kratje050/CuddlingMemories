import { LogOut, Menu } from "lucide-react";
import { useAdminAuth } from "../hooks/useAdminAuth.js";

export default function AdminHeader({ onToggleSidebar }) {
  const { user, signOut } = useAdminAuth();

  return (
    <header className="flex items-center justify-between border-b border-cocoa/15 bg-card px-5 py-4">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="grid h-10 w-10 place-items-center rounded-full border border-cocoa/25 text-coffee lg:hidden"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>
      <div className="hidden lg:block">
        <p className="script-line text-2xl text-coffee">Cuddling Memories</p>
        <p className="fine-label text-[0.6rem] text-cocoa">Admin</p>
      </div>
      <div className="flex items-center gap-4">
        <p className="hidden text-sm text-coffee/75 sm:block">{user?.email}</p>
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 rounded-full border border-cocoa/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-coffee transition hover:bg-linen"
        >
          <LogOut size={15} /> Uitloggen
        </button>
      </div>
    </header>
  );
}
