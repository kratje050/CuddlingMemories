import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readEnv } from "./public-image.ts";

export type R2Variant = {
  key: string;
  width: number;
  height: number;
  bytes: number;
};

export function isR2GalleryEnabled() {
  return readEnv("CLIENT_GALLERY_STORAGE_PROVIDER").toLowerCase() === "r2" && hasR2Credentials();
}

export function hasR2Credentials() {
  return Boolean(
    readEnv("R2_ACCOUNT_ID") &&
    readEnv("R2_ACCESS_KEY_ID") &&
    readEnv("R2_SECRET_ACCESS_KEY") &&
    readEnv("R2_BUCKET_NAME")
  );
}

export function getR2Bucket() {
  const bucket = readEnv("R2_BUCKET_NAME");
  if (!bucket) throw new Error("R2_BUCKET_NAME ontbreekt in Netlify.");
  return bucket;
}

export function getR2Client() {
  const accountId = readEnv("R2_ACCOUNT_ID");
  const accessKeyId = readEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = readEnv("R2_SECRET_ACCESS_KEY");
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("De beveiligde R2-instellingen zijn niet volledig ingevuld in Netlify.");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function assertR2Key(key: string, allowedPrefixes: string[]) {
  const normalized = String(key || "").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("\\")) {
    throw new Error("Ongeldig R2-objectpad.");
  }
  if (!allowedPrefixes.some((prefix) => normalized.startsWith(prefix))) {
    throw new Error("Dit R2-object valt buiten de toegestane map.");
  }
  return normalized;
}

export async function createR2ReadUrl(key: string, expiresIn = 600) {
  const safeKey = assertR2Key(key, ["galleries/", "temporary/"]);
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: getR2Bucket(), Key: safeKey }),
    { expiresIn: Math.max(60, Math.min(expiresIn, 900)) }
  );
}

export async function bodyToBuffer(body: any) {
  if (!body) throw new Error("Het tijdelijke R2-bestand is leeg.");
  if (typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

export function safeFilePart(value: string, fallback = "foto") {
  return String(value || fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || fallback;
}
