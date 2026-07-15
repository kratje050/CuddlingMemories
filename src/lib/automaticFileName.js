export function createAutomaticFileName(file, context, index = 0) {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const prefix = slugify(context || "fotografie").slice(0, 54) || "fotografie";
  const extension = getExtension(file);
  const unique = crypto.randomUUID().slice(0, 8);
  return `cuddling-memories-${prefix}-${date}-${String(index + 1).padStart(2, "0")}-${unique}.${extension}`;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getExtension(file) {
  const fromName = String(file?.name || "").split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  if (file?.type === "image/png") return "png";
  if (file?.type === "image/webp") return "webp";
  return "jpg";
}

