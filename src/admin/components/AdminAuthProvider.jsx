import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient.js";
import { AdminAuthContext } from "../hooks/useAdminAuth.js";

export default function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = async (session) => {
      const currentUser = session?.user ?? null;
      if (!active) return;
      setUser(currentUser);

      if (!currentUser) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("admin_profiles")
        .select("id")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!active) return;
      setIsAdmin(Boolean(data));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      applySession(session);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = { user, isAdmin, loading, signIn, signOut };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}
