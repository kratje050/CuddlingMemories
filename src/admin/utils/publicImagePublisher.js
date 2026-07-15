import { supabase } from "../../lib/supabaseClient.js";

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Log opnieuw in als beheerder.");
  return { Authorization: `Bearer ${token}` };
}

export async function publishPublicImage(file, metadata) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("metadata", JSON.stringify(metadata));
  const response = await fetch("/api/public-image-publish", { method: "POST", headers: await authHeaders(), body: formData });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "De openbare afbeelding kon niet worden gepubliceerd.");
  return result.job;
}

export async function getPublicImageJob(jobId) {
  const response = await fetch(`/api/public-image-publish?id=${encodeURIComponent(jobId)}`, { headers: await authHeaders() });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || "De publicatiestatus kon niet worden opgehaald.");
  return result.job;
}

export async function waitForPublicImage(jobId, onStatus, { timeoutMs = 12 * 60 * 1000, intervalMs = 5000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const job = await getPublicImageJob(jobId);
    onStatus?.(job);
    if (job.status === "ready") return job;
    if (job.status === "failed") throw new Error(job.error_message || "De publicatie is mislukt.");
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("De website-update duurt langer dan verwacht. De achtergrondtaak blijft controleren; vernieuw deze pagina later.");
}
