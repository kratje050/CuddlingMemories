import assert from "node:assert/strict";
import { commitFilesToGitHub } from "../netlify/functions/_shared/public-image.ts";

process.env.GITHUB_PUBLIC_IMAGES_TOKEN = "test-token-not-real";
process.env.GITHUB_PUBLIC_IMAGES_OWNER = "test-owner";
process.env.GITHUB_PUBLIC_IMAGES_REPO = "test-repo";
process.env.GITHUB_PUBLIC_IMAGES_BRANCH = "preview";

const originalFetch = globalThis.fetch;
const calls: Array<{ url: string; method: string }> = [];
let blobNumber = 0;

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method || "GET";
  calls.push({ url, method });
  if (url.endsWith("/git/ref/heads/preview")) return Response.json({ object: { sha: "parent" } });
  if (url.endsWith("/git/commits/parent")) return Response.json({ tree: { sha: "base-tree" } });
  if (url.endsWith("/git/blobs")) return Response.json({ sha: `blob-${++blobNumber}` });
  if (url.endsWith("/git/trees")) return Response.json({ sha: "new-tree" });
  if (url.endsWith("/git/commits")) return Response.json({ sha: "new-commit" });
  if (url.endsWith("/git/refs/heads/preview")) return Response.json({ object: { sha: "new-commit" } });
  return new Response("unexpected", { status: 500 });
}) as typeof fetch;

const result = await commitFilesToGitHub([
  { path: "public/images/test-480.webp", content: Buffer.from("480") },
  { path: "public/images/test-960.webp", content: Buffer.from("960") },
  { path: "public/images/test-1600.webp", content: Buffer.from("1600") },
], "test commit");

assert.equal(result.sha, "new-commit");
assert.equal(calls.filter((call) => call.url.endsWith("/git/blobs")).length, 3);
assert.equal(calls.filter((call) => call.url.endsWith("/git/trees")).length, 1);
assert.equal(calls.filter((call) => call.method === "PATCH" && call.url.endsWith("/git/refs/heads/preview")).length, 1);

const failedCalls: Array<{ url: string; method: string }> = [];
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = String(input);
  const method = init?.method || "GET";
  failedCalls.push({ url, method });
  if (url.endsWith("/git/ref/heads/preview")) return Response.json({ object: { sha: "parent" } });
  if (url.endsWith("/git/commits/parent")) return Response.json({ tree: { sha: "base-tree" } });
  if (url.endsWith("/git/blobs")) return new Response("blob mislukt", { status: 500 });
  return new Response("unexpected", { status: 500 });
}) as typeof fetch;

await assert.rejects(commitFilesToGitHub([{ path: "public/images/fail.webp", content: Buffer.from("x") }], "fail"));
assert.equal(failedCalls.some((call) => call.method === "PATCH"), false, "Een mislukte blob-upload mag de branch-reference niet aanpassen.");

globalThis.fetch = originalFetch;
console.log("GitHub-publicatie: atomaire commit en veilige foutafhandeling gecontroleerd met mocks.");
