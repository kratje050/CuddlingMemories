import assert from "node:assert/strict";
import { assertR2Key, safeFilePart } from "../netlify/functions/_shared/r2.ts";
import {
  assertSupabaseGalleryPath,
  getGalleryStorageProvider,
  safeGalleryFilePart,
  validateGalleryUpload,
} from "../netlify/functions/_shared/gallery-storage.ts";

assert.equal(safeFilePart("Familie De Vries (zomer).JPG"), "familie-de-vries-zomer-jpg");
assert.equal(assertR2Key("galleries/abc/photo-960.webp", ["galleries/"]), "galleries/abc/photo-960.webp");
assert.throws(() => assertR2Key("../secrets.txt", ["galleries/"]), /Ongeldig R2-objectpad/);
assert.throws(() => assertR2Key("portfolio/openbaar.webp", ["galleries/"]), /buiten de toegestane map/);

assert.equal(safeGalleryFilePart("Familie De Vries (zomer).JPG"), "familie-de-vries-zomer-jpg");
assert.equal(
  assertSupabaseGalleryPath("temporary/admin/upload/foto.jpg", ["temporary/admin/"]),
  "temporary/admin/upload/foto.jpg",
);
assert.throws(() => assertSupabaseGalleryPath("../secrets.txt", ["temporary/"]), /Ongeldig galerijbestandspad/);
assert.equal(validateGalleryUpload("image/jpeg", 1024), "image/jpeg");
assert.throws(() => validateGalleryUpload("application/pdf", 1024), /Alleen JPG/);

const previousProvider = process.env.CLIENT_GALLERY_STORAGE_PROVIDER;
process.env.CLIENT_GALLERY_STORAGE_PROVIDER = "supabase-optimized";
assert.equal(getGalleryStorageProvider(), "supabase-optimized");
process.env.CLIENT_GALLERY_STORAGE_PROVIDER = "r2";
delete process.env.R2_ACCOUNT_ID;
delete process.env.R2_ACCESS_KEY_ID;
delete process.env.R2_SECRET_ACCESS_KEY;
delete process.env.R2_BUCKET_NAME;
assert.equal(getGalleryStorageProvider(), "supabase");
delete process.env.CLIENT_GALLERY_STORAGE_PROVIDER;
assert.equal(
  getGalleryStorageProvider(new Request("https://gallery-opt-preview--cuddling-memories-fotografie.netlify.app/api/gallery-upload-provider")),
  "supabase-optimized",
);
assert.equal(
  getGalleryStorageProvider(new Request("https://cuddling-memories-fotografie.netlify.app/api/gallery-upload-provider")),
  "supabase",
);
if (previousProvider === undefined) delete process.env.CLIENT_GALLERY_STORAGE_PROVIDER;
else process.env.CLIENT_GALLERY_STORAGE_PROVIDER = previousProvider;

console.log("Galerijopslag-helpertests geslaagd.");
