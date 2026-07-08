import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "VITE_SUPABASE_URL en/of VITE_SUPABASE_ANON_KEY ontbreken. Zie .env.example."
  );
}

// Val terug op een geldig ogende placeholder-URL zodat createClient() niet synchroon
// crasht (en daarmee de hele site plat legt) wanneer de env vars nog ontbreken.
// Elke echte aanroep faalt dan gewoon netjes en wordt opgevangen door de
// fallback-/loading-states op elke pagina.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
