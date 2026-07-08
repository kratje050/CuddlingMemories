import { createElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth.js";

export default function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return createElement(
      "div",
      { className: "grid min-h-screen place-items-center bg-cream text-coffee" },
      createElement("p", { className: "fine-label text-xs text-cocoa" }, "Laden...")
    );
  }

  if (!user || !isAdmin) {
    return createElement(Navigate, { to: "/admin/login", state: { from: location }, replace: true });
  }

  return children;
}
