import type { Context, Config } from "@netlify/functions";
import { commitFilesToGitHub, finalizePublicImageJob, json, markJobFailed, PublicImageHttpError, readEnv, requireAdmin, triggerNetlifyBuild } from "./_shared/public-image.ts";
import { processPublicImage } from "./_shared/public-image-processor.ts";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export default async (req: Request, context: Context) => {
  if (!(["GET", "POST"].includes(req.method))) return json(405, { ok: false, message: "Alleen GET en POST zijn toegestaan." });
  try {
    const { supabase, user } = await requireAdmin(req);
    if (req.method === "GET") {
      const id = new URL(req.url).searchParams.get("id") || "";
      if (!id) return json(400, { ok: false, message: "Publicatietaak ontbreekt." });
      let job = await finalizePublicImageJob(id);
      const { data } = await supabase.from("public_image_publish_jobs").select("*").eq("id", id).eq("admin_user_id", user.id).maybeSingle();
      if (!data) return json(404, { ok: false, message: "Publicatietaak niet gevonden." });
      job = data;
      return json(200, { ok: true, job: publicJob(job) });
    }

    const maxBytes = Math.min(Number(readEnv("PUBLIC_IMAGE_MAX_BYTES")) || 5_000_000, 5_500_000);
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength && contentLength > maxBytes + 200_000) return json(413, { ok: false, message: `De foto is te groot. Maximaal ${Math.floor(maxBytes / 1_000_000)} MB.` });
    const formData = await req.formData();
    const file = formData.get("file");
    const rawMetadata = String(formData.get("metadata") || "{}");
    if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") return json(400, { ok: false, message: "Kies een afbeelding." });
    if (!allowedMimeTypes.has(file.type)) return json(400, { ok: false, message: "Alleen JPG, PNG en WebP zijn toegestaan." });
    if (file.size > maxBytes) return json(413, { ok: false, message: `De foto is te groot. Maximaal ${Math.floor(maxBytes / 1_000_000)} MB.` });

    let metadata: Record<string, any>;
    try { metadata = JSON.parse(rawMetadata); } catch { return json(400, { ok: false, message: "De afbeeldingsgegevens zijn ongeldig." }); }
    if (!(metadata.target_type === "portfolio_photo" || metadata.target_type === "page_section")) return json(400, { ok: false, message: "Ongeldig publicatiedoel." });
    if (!String(metadata.alt_text || "").trim()) return json(400, { ok: false, message: "Alt-tekst is verplicht." });
    const albumIds = Array.isArray(metadata.album_ids)
      ? [...new Set(metadata.album_ids.map((id: unknown) => String(id || "")).filter(Boolean))]
      : [String(metadata.album_id || "")].filter(Boolean);
    if (metadata.target_type === "portfolio_photo" && !albumIds.length) return json(400, { ok: false, message: "Kies minimaal een portfolio-album." });
    if (metadata.target_type === "portfolio_photo") {
      const { data: validAlbums, error: albumError } = await supabase
        .from("portfolio_albums")
        .select("id")
        .in("id", albumIds);
      if (albumError || (validAlbums || []).length !== albumIds.length) {
        return json(400, { ok: false, message: "Een of meer gekozen portfolio-albums bestaan niet meer." });
      }
    }
    if (metadata.target_type === "page_section" && !metadata.target_record_id) return json(400, { ok: false, message: "De pagina-sectie ontbreekt." });

    const input = Buffer.from(await file.arrayBuffer());
    const { generated, primary, srcset, baseName } = await processPublicImage(input, {
      targetType: metadata.target_type,
      title: metadata.title,
      originalName: file.name,
      category: metadata.category,
      pageSlug: metadata.page_slug,
    });
    const publicBaseUrl = readEnv("PUBLIC_IMAGE_BASE_URL") || new URL(req.url).origin;
    const targetPayload = {
      album_id: albumIds[0] || null,
      album_ids: albumIds,
      title: String(metadata.title || "").slice(0, 180),
      alt_text: String(metadata.alt_text || "").trim().slice(0, 300),
      category: String(metadata.category || "").slice(0, 300) || null,
      is_featured: metadata.is_featured === true,
      sort_order: Number(metadata.sort_order) || 0,
      target_field: metadata.target_field === "image_url" ? "image_url" : "content",
      thumbnail_path: generated[0].publicPath,
    };
    const { data: job, error: jobError } = await supabase.from("public_image_publish_jobs").insert({
      admin_user_id: user.id,
      target_type: metadata.target_type,
      target_record_id: metadata.target_record_id || null,
      target_payload: targetPayload,
      status: "processing",
      public_base_url: publicBaseUrl,
      primary_path: primary.publicPath,
      public_paths: generated.map((item) => item.publicPath),
      repo_paths: generated.map((item) => item.repoPath),
      srcset,
      variants: generated.map(({ publicPath, width, height, bytes }) => ({ path: publicPath, width, height, bytes })),
      image_width: primary.width,
      image_height: primary.height,
    }).select("*").single();
    if (jobError) throw jobError;

    try {
      const commit = await commitFilesToGitHub(generated.map(({ repoPath, content }) => ({ path: repoPath, content })), `Publiceer openbare afbeelding: ${baseName}`);
      const { error: updateError } = await supabase.from("public_image_publish_jobs").update({ status: "deploying", github_commit_sha: commit.sha, github_branch: commit.branch }).eq("id", job.id);
      if (updateError) throw updateError;
      await triggerNetlifyBuild();
      const secret = readEnv("PUBLIC_IMAGE_FINALIZE_SECRET");
      if (secret) context.waitUntil(fetch(new URL("/api/public-image-finalize", req.url), { method: "POST", headers: { "Content-Type": "application/json", "X-Public-Image-Secret": secret }, body: JSON.stringify({ job_id: job.id }) }).catch(() => undefined));
      return json(202, { ok: true, job: publicJob({ ...job, status: "deploying", github_commit_sha: commit.sha, github_branch: commit.branch }) });
    } catch (publishError) {
      const message = await markJobFailed(job.id, publishError);
      return json(502, { ok: false, message, job_id: job.id });
    }
  } catch (error) {
    console.error("Openbare afbeelding publiceren mislukt:", error instanceof Error ? error.message : error);
    const status = error instanceof PublicImageHttpError ? error.status : 500;
    return json(status, { ok: false, message: error instanceof Error ? error.message : "Publiceren is niet gelukt." });
  }
};

function publicJob(job: any) {
  return { id: job.id, status: job.status, error_message: job.error_message, primary_path: job.primary_path, srcset: job.srcset, github_commit_sha: job.github_commit_sha, target_record_id: job.target_record_id };
}

export const config: Config = { path: "/api/public-image-publish", method: ["GET", "POST"] };
