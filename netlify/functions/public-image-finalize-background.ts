import type { Config } from "@netlify/functions";
import { finalizePublicImageJob, json, markJobFailed, readEnv } from "./_shared/public-image.ts";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default async (req: Request) => {
  if (req.method !== "POST") return json(405, { ok: false, message: "Alleen POST is toegestaan." });
  if (!readEnv("PUBLIC_IMAGE_FINALIZE_SECRET") || req.headers.get("x-public-image-secret") !== readEnv("PUBLIC_IMAGE_FINALIZE_SECRET")) {
    return json(401, { ok: false, message: "Niet toegestaan." });
  }
  const body = await req.json().catch(() => ({}));
  const jobId = String(body.job_id || "");
  if (!jobId) return json(400, { ok: false, message: "Publicatietaak ontbreekt." });
  try {
    for (let attempt = 0; attempt < 48; attempt += 1) {
      const job = await finalizePublicImageJob(jobId);
      if (job.status === "ready" || job.status === "failed") return json(200, { ok: true });
      await wait(15_000);
    }
    return json(202, { ok: true, message: "De deploy wordt later opnieuw gecontroleerd vanuit het adminpaneel." });
  } catch (error) {
    await markJobFailed(jobId, error);
    return json(500, { ok: false, message: error instanceof Error ? error.message : "Afronden is mislukt." });
  }
};

export const config: Config = { path: "/api/public-image-finalize", method: ["POST"] };
