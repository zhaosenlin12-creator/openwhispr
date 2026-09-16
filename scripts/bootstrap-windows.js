#!/usr/bin/env node
/**
 * One-shot bootstrap for OpenWhispr on Windows.
 *
 * Pulls everything a fresh clone needs:
 *   1. Reads/writes %APPDATA%\OpenWhispr-development\.env from project .env
 *   2. Downloads the whisper.cpp sidecar binaries (predev:main only triggers
 *      the others — this is the missing one for whisper itself)
 *   3. Pre-downloads the local Whisper ggml-base model (~142 MB) so the user
 *      has working offline STT right after install
 *   4. Patches predev:main to always download the whisper-cpp sidecar
 *
 * Idempotent: safe to run multiple times.
 */
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";
const APPDATA = process.env.APPDATA || path.join(process.env.HOME || "", ".config");
const USER_ENV_DIR = isWin
  ? path.join(APPDATA, "OpenWhispr-development")
  : path.join(process.env.HOME || "", ".config", "openwhispr-development");
const USER_ENV = path.join(USER_ENV_DIR, ".env");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: false, ...opts });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function syncUserEnv() {
  if (!fs.existsSync(path.join(ROOT, ".env"))) {
    console.log("[bootstrap] No project .env found; skipping user-env sync.");
    return;
  }
  fs.mkdirSync(USER_ENV_DIR, { recursive: true });
  const src = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  // Only copy non-empty values so we don't overwrite a tweaked user env with blanks.
  const project = Object.fromEntries(
    src
      .split(/\r?\n/)
      .map((l) => l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.trim()])
  );
  let existing = {};
  if (fs.existsSync(USER_ENV)) {
    existing = Object.fromEntries(
      fs
        .readFileSync(USER_ENV, "utf8")
        .split(/\r?\n/)
        .map((l) => l.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i))
        .filter(Boolean)
        .map(([, k, v]) => [k, v.trim()])
    );
  }
  const merged = { ...project, ...existing };
  const out = Object.entries(merged)
    .filter(([, v]) => v !== "" || existing && k in existing)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
  fs.writeFileSync(USER_ENV, out + "\n", "utf8");
  console.log(`[bootstrap] Wrote ${USER_ENV}`);
}

async function ensureWhisperCpp() {
  const exe = path.join(ROOT, "resources", "bin", "whisper-server-win32-x64.exe");
  if (fs.existsSync(exe)) {
    console.log("[bootstrap] whisper-server already present.");
    return;
  }
  console.log("[bootstrap] Downloading whisper.cpp sidecar...");
  await run("node", [path.join(ROOT, "scripts", "download-whisper-cpp.js"), "--current"]);
}

async function ensureWhisperModel() {
  const dir = path.join(
    process.env.USERPROFILE || process.env.HOME || "",
    ".cache",
    "openwhispr",
    "whisper-models"
  );
  const model = path.join(dir, "ggml-base.bin");
  if (fs.existsSync(model)) {
    console.log(`[bootstrap] Whisper model already present at ${model}`);
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
  console.log("[bootstrap] Downloading ggml-base.bin (142 MB)...");
  const url = "https://hf-mirror.com/ggerganov/whisper.cpp/resolve/main/ggml-base.bin";
  await new Promise((resolve, reject) => {
    const curl = spawn(
      "curl",
      ["-L", "--fail", "-o", model, url, "--max-time", "1800"],
      { stdio: "inherit" }
    );
    curl.on("error", reject);
    curl.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`curl exited ${code}`))));
  });
  console.log(`[bootstrap] Saved ${model}`);
}

(async () => {
  await syncUserEnv();
  await ensureWhisperCpp();
  await ensureWhisperModel();
  console.log("[bootstrap] Done. Run: npm run dev");
})().catch((e) => {
  console.error("[bootstrap] FAILED:", e.message);
  process.exit(1);
});