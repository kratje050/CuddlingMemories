import { createClient } from "@supabase/supabase-js";
import admin from "firebase-admin";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

const readEnv = (name: string) => globalThis.Netlify?.env?.get(name) || "";

function getSupabaseAdmin() {
  const url = readEnv("VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Supabase is nog niet ingesteld op de server.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

let firebaseApp: admin.app.App | null = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;

  const raw = readEnv("FCM_SERVICE_ACCOUNT_JSON");
  if (!raw) {
    throw new Error("FCM_SERVICE_ACCOUNT_JSON ontbreekt bij de Netlify-omgevingsvariabelen.");
  }

  const serviceAccount = JSON.parse(raw);
  firebaseApp = admin.apps.length
    ? admin.app()
    : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return firebaseApp;
}

// Interne endpoint — nooit rechtstreeks vanuit de Android-app of de website
// aangeroepen. De enige twee aanroepers zijn:
// 1. de Postgres-trigger fn_notify_admins() (via pg_net, bij een nieuwe
//    boeking/wachtlijst-aanmelding/cadeaubon-aanvraag/mini-shoot-boeking),
// 2. de testpush-knop in de app (met een ingelogde admin-sessie).
// Omdat pg_net geen ingelogde gebruiker heeft, wordt de aanroep beveiligd
// met een gedeeld geheim (x-internal-secret) i.p.v. een sessie-check — zie
// cuddling-memories-admin/supabase/android-app-migration.sql voor hoe dat
// geheim in Supabase Vault gezet wordt.
export default async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  }

  const expectedSecret = readEnv("INTERNAL_WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-internal-secret") || "";
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return json(401, { ok: false, message: "Ongeldig of ontbrekend geheim." });
  }

  try {
    const payload = await req.json();
    const title = String(payload?.title || "Cuddling Memories").slice(0, 200);
    const body = String(payload?.body || "").slice(0, 500);
    const type = String(payload?.type || "general").slice(0, 50);

    const supabase = getSupabaseAdmin();
    const { data: tokens, error } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("is_active", true)
      .eq("platform", "android")
      .not("token", "is", null);

    if (error) throw error;

    const tokenList = (tokens || []).map((row) => row.token).filter(Boolean) as string[];
    if (tokenList.length === 0) {
      return json(200, { ok: true, sent: 0, message: "Geen actieve push-tokens geregistreerd." });
    }

    const app = getFirebaseApp();
    const response = await admin.messaging(app).sendEachForMulticast({
      tokens: tokenList,
      notification: { title, body },
      data: { type },
      android: { priority: "high" },
    });

    const invalidTokens = response.responses
      .map((result, index) => (result.success ? null : tokenList[index]))
      .filter((token): token is string => Boolean(token));

    if (invalidTokens.length > 0) {
      await supabase.from("push_tokens").update({ is_active: false }).in("token", invalidTokens);
    }

    return json(200, { ok: true, sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    console.error("Pushmelding versturen is mislukt:", error);
    return json(500, {
      ok: false,
      message: error instanceof Error ? error.message : "Pushmelding versturen is niet gelukt.",
    });
  }
};

export const config = {
  path: "/api/send-push-notification",
};
