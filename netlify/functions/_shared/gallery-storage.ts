import { readEnv } from "./public-image.ts";

export const GALLERY_BUCKET = "client-galleries";
export const GALLERY_MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const GALLERY_ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type GalleryStorageProvider = "supabase" | "supabase-optimized" | "r2";

function hasR2Configuration() {
  return Boolean(
    readEnv("R2_ACCOUNT_ID") &&
    readEnv("R2_ACCESS_KEY_ID") &&
    readEnv("R2_SECRET_ACCESS_KEY") &&
    readEnv("R2_BUCKET_NAME")
  );
}

export function getGalleryStorageProvider(req?: Request): GalleryStorageProvider {
  const configured = readEnv("CLIENT_GALLERY_STORAGE_PROVIDER").trim().toLowerCase();
  if (configured === "supabase-optimized") return "supabase-optimized";
  if (configured === "r2" && hasR2Configuration()) return "r2";
  const deployContext = readEnv("CONTEXT").trim().toLowerCase();
  if (!configured && ["deploy-preview", "branch-deploy"].includes(deployContext)) {
    return "supabase-optimized";
  }
  const requestHost = req ? new URL(req.url).hostname.toLowerCase() : "";
  if (!configured && requestHost.endsWith("--cuddling-memories-fotografie.netlify.app")) {
    return "supabase-optimized";
  }
  return "supabase";
}

export function validateGalleryUpload(contentType: string, size: number) {
  const normalizedType = String(contentType || "").toLowerCase();
  if (!GALLERY_ALLOWED_TYPES.has(normalizedType)) {
    throw new Error("Alleen JPG, PNG en WebP zijn toegestaan.");
  }
  if (!Number.isFinite(size) || size <= 0 || size > GALLERY_MAX_UPLOAD_BYTES) {
    throw new Error("Een foto mag maximaal 20 MB groot zijn.");
  }
  return normalizedType;
}

export function assertSupabaseGalleryPath(path: string, allowedPrefixes: string[]) {
  const normalized = String(path || "").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\\")) {
    throw new Error("Ongeldig galerijbestandspad.");
  }
  if (!allowedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error("Dit galerijbestand valt buiten de toegestane map.");
  }
  return normalized;
}

export function safeGalleryFilePart(value: string, fallback = "foto") {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || fallback;
}
