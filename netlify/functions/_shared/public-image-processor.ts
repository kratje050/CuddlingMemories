import { createHash } from "node:crypto";
import sharp from "sharp";

export const publicImageWidths = [480, 960, 1600];

export const slugifyPublicImagePart = (value: unknown, fallback = "afbeelding") => String(value || fallback)
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || fallback;

export async function processPublicImage(input: Buffer, options: {
  title?: string;
  originalName?: string;
  category?: string;
  pageSlug?: string;
  targetType: "portfolio_photo" | "page_section";
}) {
  const image = sharp(input, { failOn: "error", limitInputPixels: 50_000_000 }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || !["jpeg", "png", "webp"].includes(metadata.format || "")) {
    throw new Error("Het afbeeldingsbestand kon niet veilig worden gelezen.");
  }
  const hash = createHash("sha256").update(input).digest("hex").slice(0, 12);
  const category = slugifyPublicImagePart(options.category || options.pageSlug || "algemeen");
  const originalStem = String(options.originalName || "").replace(/\.[^.]+$/, "");
  const baseName = `${slugifyPublicImagePart(options.title || originalStem)}-${hash}`;
  const directory = options.targetType === "portfolio_photo"
    ? `public/images/portfolio/${category}`
    : `public/images/pages/${slugifyPublicImagePart(options.pageSlug || "website")}`;
  const generated = [];
  for (const requestedWidth of publicImageWidths) {
    const { data, info } = await image.clone()
      .resize({ width: requestedWidth, withoutEnlargement: true })
      .webp({ quality: 80, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    const repoPath = `${directory}/${baseName}-${requestedWidth}.webp`;
    generated.push({
      repoPath,
      publicPath: `/${repoPath.replace(/^public\//, "")}`,
      width: info.width,
      height: info.height,
      bytes: data.length,
      content: data,
    });
  }
  const primary = generated.find((item) => item.repoPath.endsWith("-960.webp")) || generated[generated.length - 1];
  return {
    baseName,
    generated,
    primary,
    srcset: generated.map((item) => `${item.publicPath} ${item.width}w`).join(", "),
  };
}
