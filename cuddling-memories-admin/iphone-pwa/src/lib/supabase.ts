import { createWebSupabaseClient } from "@shared/index";

const url = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createWebSupabaseClient(url, anonKey);
