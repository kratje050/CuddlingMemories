import assert from "node:assert/strict";
import { assertR2Key, safeFilePart } from "../netlify/functions/_shared/r2.ts";

assert.equal(safeFilePart("Familie De Vries (zomer).JPG"), "familie-de-vries-zomer-jpg");
assert.equal(assertR2Key("galleries/abc/photo-960.webp", ["galleries/"]), "galleries/abc/photo-960.webp");
assert.throws(() => assertR2Key("../secrets.txt", ["galleries/"]), /Ongeldig R2-objectpad/);
assert.throws(() => assertR2Key("portfolio/openbaar.webp", ["galleries/"]), /buiten de toegestane map/);

console.log("R2 helper tests geslaagd.");
