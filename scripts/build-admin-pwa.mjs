import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const adminDir = resolve(rootDir, "cuddling-memories-admin");
const pwaDist = resolve(adminDir, "iphone-pwa", "dist");
const targetDir = resolve(rootDir, "dist", "admin-app");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function loadRootEnv() {
  const envPath = resolve(rootDir, ".env");
  if (!existsSync(envPath)) return {};

  return readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .reduce((env, line) => {
      const separator = line.indexOf("=");
      if (separator === -1) return env;

      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !(key in process.env)) env[key] = value;
      return env;
    }, {});
}

const build = spawnSync(npmCommand, ["run", "iphone:build"], {
  cwd: adminDir,
  env: { ...process.env, ...loadRootEnv() },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (build.error) {
  console.error(build.error.message);
}

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });
cpSync(pwaDist, targetDir, { recursive: true });

console.log("iPhone PWA copied to dist/admin-app");
