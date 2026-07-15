import { createClient } from "@supabase/supabase-js";

export const readEnv = (name: string) => (globalThis as any).Netlify?.env?.get(name) || process.env[name] || "";

export const json = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

export class PublicImageHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getSupabaseAdmin() {
  const url = readEnv("VITE_SUPABASE_URL");
  const serviceKey = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Supabase is niet volledig ingesteld voor de publicatieworkflow.");
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function requireAdmin(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new PublicImageHttpError(401, "Log opnieuw in als beheerder.");
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new PublicImageHttpError(401, "Je beheerderssessie is verlopen.");
  const { data: profile } = await supabase.from("admin_profiles").select("id").eq("user_id", data.user.id).maybeSingle();
  if (!profile) throw new PublicImageHttpError(403, "Alleen beheerders mogen openbare afbeeldingen publiceren.");
  return { supabase, user: data.user };
}

type GitHubFile = { path: string; content: Buffer };

async function githubRequest(path: string, init: RequestInit = {}) {
  const token = readEnv("GITHUB_PUBLIC_IMAGES_TOKEN");
  const owner = readEnv("GITHUB_PUBLIC_IMAGES_OWNER");
  const repo = readEnv("GITHUB_PUBLIC_IMAGES_REPO");
  if (!token || !owner || !repo) throw new Error("De beveiligde GitHub-instellingen ontbreken in Netlify.");
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "cuddling-memories-netlify",
      ...init.headers,
    },
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`GitHub gaf fout ${response.status}: ${details.slice(0, 300)}`);
  }
  return response.json();
}

export async function commitFilesToGitHub(files: GitHubFile[], message: string) {
  const branch = readEnv("GITHUB_PUBLIC_IMAGES_BRANCH") || "main";
  const branchPath = branch.split("/").map(encodeURIComponent).join("/");
  const reference = await githubRequest(`/git/ref/heads/${branchPath}`);
  const parentSha = reference.object.sha;
  const parentCommit = await githubRequest(`/git/commits/${parentSha}`);
  const blobs = await Promise.all(files.map(async (file) => {
    const blob = await githubRequest("/git/blobs", {
      method: "POST",
      body: JSON.stringify({ content: file.content.toString("base64"), encoding: "base64" }),
    });
    return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
  }));
  const tree = await githubRequest("/git/trees", {
    method: "POST",
    body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree: blobs }),
  });
  const commit = await githubRequest("/git/commits", {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
  });
  await githubRequest(`/git/refs/heads/${branchPath}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return { sha: commit.sha, branch };
}

export async function triggerNetlifyBuild() {
  const hook = readEnv("NETLIFY_PUBLIC_IMAGES_BUILD_HOOK");
  if (!hook) return false;
  const response = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (!response.ok) throw new Error(`De Netlify build-hook gaf fout ${response.status}.`);
  return true;
}

async function pathsAreLive(baseUrl: string, paths: string[]) {
  for (const path of paths) {
    const url = new URL(path, `${baseUrl.replace(/\/$/, "")}/`);
    url.searchParams.set("publish_check", Date.now().toString());
    const response = await fetch(url, { method: "HEAD", headers: { "Cache-Control": "no-cache" } });
    if (!response.ok || !String(response.headers.get("content-type") || "").startsWith("image/")) return false;
  }
  return true;
}

export async function finalizePublicImageJob(jobId: string) {
  const supabase = getSupabaseAdmin();
  const { data: job, error } = await supabase.from("public_image_publish_jobs").select("*").eq("id", jobId).maybeSingle();
  if (error) throw error;
  if (!job) throw new Error("Publicatietaak niet gevonden.");
  if (job.status === "ready" || job.status === "failed") return job;
  if (job.status !== "deploying") return job;
  const publicPaths = Array.isArray(job.public_paths) ? job.public_paths : [];
  if (!publicPaths.length || !(await pathsAreLive(job.public_base_url, publicPaths))) return job;

  const payload = job.target_payload || {};
  let targetRecordId = job.target_record_id;
  if (job.target_type === "portfolio_photo") {
    const albumIds = Array.isArray(payload.album_ids) && payload.album_ids.length
      ? [...new Set(payload.album_ids.map((id: unknown) => String(id || "")).filter(Boolean))]
      : [String(payload.album_id || "")].filter(Boolean);
    const photoPayload = {
      album_id: albumIds[0] || payload.album_id,
      title: payload.title || null,
      alt_text: payload.alt_text,
      category: payload.category || null,
      is_featured: Boolean(payload.is_featured),
      sort_order: Number(payload.sort_order) || 0,
      image_url: job.primary_path,
      thumbnail_url: payload.thumbnail_path || job.primary_path,
      image_srcset: job.srcset,
      image_width: job.image_width,
      image_height: job.image_height,
      image_variants: job.variants,
      image_source: "netlify",
    };
    if (targetRecordId) {
      const { error: updateError } = await supabase.from("portfolio_photos").update(photoPayload).eq("id", targetRecordId);
      if (updateError) throw updateError;
    } else {
      const { data: inserted, error: insertError } = await supabase.from("portfolio_photos").insert(photoPayload).select("id").single();
      if (insertError) throw insertError;
      targetRecordId = inserted.id;
    }

    if (albumIds.length) {
      const { error: deleteLinksError } = await supabase.from("portfolio_photo_albums").delete().eq("photo_id", targetRecordId);
      if (deleteLinksError) throw deleteLinksError;
      const { error: insertLinksError } = await supabase.from("portfolio_photo_albums").insert(
        albumIds.map((albumId) => ({ photo_id: targetRecordId, album_id: albumId }))
      );
      if (insertLinksError) throw insertLinksError;
    }
  } else if (job.target_type === "page_section") {
    const field = payload.target_field === "image_url" ? "image_url" : "content";
    if (!targetRecordId) throw new Error("De pagina-sectie voor deze publicatie ontbreekt.");
    const { error: updateError } = await supabase.from("page_sections").update({ [field]: job.primary_path }).eq("id", targetRecordId);
    if (updateError) throw updateError;
  } else {
    throw new Error("Onbekend publicatiedoel.");
  }

  const { error: assetError } = await supabase.from("public_image_assets").upsert({
    publish_job_id: job.id,
    target_type: job.target_type,
    target_record_id: targetRecordId,
    primary_path: job.primary_path,
    srcset: job.srcset,
    variants: job.variants,
    width: job.image_width,
    height: job.image_height,
    alt_text: payload.alt_text || null,
    category: payload.category || null,
    github_commit_sha: job.github_commit_sha,
  }, { onConflict: "publish_job_id" });
  if (assetError) throw assetError;

  const { data: completed, error: completeError } = await supabase.from("public_image_publish_jobs").update({
    status: "ready",
    target_record_id: targetRecordId,
    completed_at: new Date().toISOString(),
    error_message: null,
  }).eq("id", job.id).select("*").single();
  if (completeError) throw completeError;
  return completed;
}

export async function markJobFailed(jobId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "De publicatie is mislukt.";
  const supabase = getSupabaseAdmin();
  await supabase.from("public_image_publish_jobs").update({ status: "failed", error_message: message.slice(0, 1000) }).eq("id", jobId);
  return message;
}
