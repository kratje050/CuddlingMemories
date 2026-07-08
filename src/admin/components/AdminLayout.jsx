import { useState } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminHeader from "./AdminHeader.jsx";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream text-coffee lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-cocoa/15 bg-card px-4 py-6 lg:block">
        <AdminSidebar />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-coffee/40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <aside
            className="h-full w-72 max-w-[80%] bg-card px-4 py-6 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-col">
        <AdminHeader onToggleSidebar={() => setSidebarOpen((value) => !value)} />
        <main className="flex-1 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
