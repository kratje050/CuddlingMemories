import { getCurrentAdmin } from "@shared/index";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabase";

type AuthState = {
  loading: boolean;
  session: unknown;
  user: { id: string; email?: string | null } | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<unknown>(null);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    const result = await getCurrentAdmin(supabase as any);
    setUser(result.user);
    setIsAdmin(Boolean(result.profile));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const { data } = supabase.auth.onAuthStateChange(() => refresh());
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await refresh();
    const result = await getCurrentAdmin(supabase as any);
    if (!result.profile) throw new Error("Dit account heeft geen admin-toegang.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    await refresh();
  }

  const value = useMemo(() => ({ loading, session, user, isAdmin, signIn, signOut }), [loading, session, user, isAdmin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
