import { createClient } from "@supabase/supabase-js";

const galleryId = process.argv[2];
if (!galleryId) {
  throw new Error("Geef een galerij-ID mee.");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(`Supabase-servervariabelen ontbreken (url: ${Boolean(supabaseUrl)}, sleutel: ${Boolean(serviceRoleKey)}).`);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: photo, error } = await supabase
  .from("gallery_photos")
  .select("id,storage_provider,image_url,object_key,thumbnail_key,medium_key,image_width,image_height,image_variants")
  .eq("gallery_id", galleryId)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (error) throw error;
if (!photo) throw new Error("Geen testfoto gevonden.");

const keys = [photo.thumbnail_key, photo.medium_key, photo.object_key].filter(Boolean);
const objectChecks = [];
for (const key of keys) {
  const parent = key.split("/").slice(0, -1).join("/");
  const filename = key.split("/").at(-1);
  const { data, error: listError } = await supabase.storage
    .from("client-galleries")
    .list(parent, { search: filename, limit: 10 });
  if (listError) throw listError;
  const stored = (data || []).find((item) => item.name === filename);
  objectChecks.push({
    variant: filename?.match(/-(480|960|1600)\.webp$/)?.[1] || "onbekend",
    exists: Boolean(stored),
    contentType: stored?.metadata?.mimetype || stored?.metadata?.contentType || null,
    bytes: stored?.metadata?.size || null,
  });
}

const variants = Array.isArray(photo.image_variants) ? photo.image_variants : [];
console.log(JSON.stringify({
  storageProvider: photo.storage_provider,
  protectedPath: String(photo.image_url || "").startsWith("supabase://"),
  dimensions: { width: photo.image_width, height: photo.image_height },
  variants: variants.map((variant) => ({
    width: variant.width,
    height: variant.height,
    bytes: variant.bytes,
    webp: String(variant.key || "").endsWith(".webp"),
  })),
  objects: objectChecks,
}, null, 2));
