import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { createExpoSupabaseClient, getCurrentAdmin } from "@shared/index";
import { styles } from "../styles";

type AuthContextValue = {
  supabase: ReturnType<typeof createExpoSupabaseClient>;
  session: unknown;
  user: { id: string; email?: string | null } | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";
const hasSupabaseConfig =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) &&
  !supabaseUrl.includes("placeholder");

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createExpoSupabaseClient(supabaseUrl, supabaseAnonKey, AsyncStorage), []);
  const [session, setSession] = useState<unknown>(null);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState<string | null>(null);

  async function refreshAdmin() {
    if (!hasSupabaseConfig) {
      setStartupError("Supabase instellingen ontbreken in de Android build.");
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      const result = await getCurrentAdmin(supabase as any);
      setUser(result.user);
      setIsAdmin(Boolean(result.profile));
      setStartupError(null);
    } catch (error) {
      setSession(null);
      setUser(null);
      setIsAdmin(false);
      setStartupError(error instanceof Error ? error.message : "Admin gegevens konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAdmin();
    const { data } = supabase.auth.onAuthStateChange(() => refreshAdmin());
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function signIn(email: string, password: string) {
    if (startupError) throw new Error(startupError);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    await refreshAdmin();
    if (!isAdmin) {
      const result = await getCurrentAdmin(supabase as any);
      if (!result.profile) throw new Error("Dit account heeft geen admin-toegang.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  }

  if (startupError) {
    return (
      <View style={styles.centerPadded}>
        <Text style={styles.title}>App is niet goed ingesteld</Text>
        <Text style={styles.body}>
          De Android app mist de Supabase instellingen of kan de database niet bereiken.
        </Text>
        <Text style={styles.error}>{startupError}</Text>
      </View>
    );
  }

  return <AuthContext.Provider value={{ supabase, session, user, isAdmin, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
