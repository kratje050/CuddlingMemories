import assert from "node:assert/strict";
import sharp from "sharp";
import { processPublicImage } from "../netlify/functions/_shared/public-image-processor.ts";

const input = await sharp({
  create: { width: 2000, height: 1200, channels: 3, background: { r: 218, g: 190, b: 172 } },
}).jpeg({ quality: 90 }).withMetadata({ orientation: 6 }).toBuffer();

const first = await processPublicImage(input, {
  targetType: "portfolio_photo",
  title: "Test foto zwangerschap",
  originalName: "bron.jpg",
  category: "Zwangerschap",
});
const second = await processPublicImage(input, {
  targetType: "portfolio_photo",
  title: "Test foto zwangerschap",
  originalName: "bron.jpg",
  category: "Zwangerschap",
});

assert.equal(first.generated.length, 3);
assert.deepEqual(first.generated.map((item) => item.width), [480, 960, 1200]);
assert.equal(first.baseName, second.baseName, "De contenthash moet deterministisch zijn.");
assert.match(first.primary.publicPath, /^\/images\/portfolio\/zwangerschap\/.+-960\.webp$/);
assert.match(first.srcset, /480w/);
assert.match(first.srcset, /960w/);
assert.match(first.srcset, /1200w/);

for (const variant of first.generated) {
  const metadata = await sharp(variant.content).metadata();
  assert.equal(metadata.format, "webp");
  assert.equal(metadata.exif, undefined, "EXIF moet verwijderd zijn.");
  assert.equal(metadata.orientation, undefined, "Oriëntatiemetadata moet verwijderd zijn.");
}

await assert.rejects(
  processPublicImage(Buffer.from("geen afbeelding"), { targetType: "page_section", pageSlug: "home" }),
);

console.log("Public image processing: 3 WebP-varianten, contenthash en metadata-verwijdering gecontroleerd.");
