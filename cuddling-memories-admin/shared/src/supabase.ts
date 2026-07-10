import { createClient } from "@supabase/supabase-js";

export function createWebSupabaseClient(url: string, anonKey: string) {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function createExpoSupabaseClient(url: string, anonKey: string, storage: unknown) {
  return createClient(url, anonKey, {
    auth: {
      storage: storage as any,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
