import { createContext, useContext } from "react";

export const AdminAuthContext = createContext(null);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth moet binnen AdminAuthProvider gebruikt worden.");
  }
  return context;
}
