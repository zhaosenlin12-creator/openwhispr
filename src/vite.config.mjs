import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DEV_SERVER_PORT = 5183;

const parseDevServerPort = (rawPort) => {
  const normalizedPort = rawPort || String(DEFAULT_DEV_SERVER_PORT);
  const parsedPort = Number(normalizedPort);

  if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return DEFAULT_DEV_SERVER_PORT;
  }

  return parsedPort;
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, "..");
  const env = loadEnv(mode, envDir, "");
  const rawPort = env.VITE_DEV_SERVER_PORT || env.OPENWHISPR_DEV_SERVER_PORT;
  const devServerPort = parseDevServerPort(rawPort);

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "write-runtime-env",
        writeBundle() {
          const runtimeEnv = {
            VITE_OPENWHISPR_API_URL: env.VITE_OPENWHISPR_API_URL || "",
            VITE_AUTH_URL: env.VITE_AUTH_URL || "",
          };
          fs.writeFileSync(
            path.resolve(__dirname, "dist", "runtime-env.json"),
            JSON.stringify(runtimeEnv)
          );
        },
      },
    ],
    base: "./", // Use relative paths for file:// protocol in Electron
    envDir, // Load .env from project root
    define: {
      // Inject user-supplied .env base URLs and MiniMax API key into the renderer
      // at compile time. Without these, the renderer falls back to OpenAI hardcoded
      // endpoint because the browser context has no Node-style process.env.
      "process.env.OPENAI_BASE_URL": JSON.stringify(env.OPENAI_BASE_URL || ""),
      "process.env.OPENWHISPR_OPENAI_BASE_URL": JSON.stringify(env.OPENWHISPR_OPENAI_BASE_URL || ""),
      "process.env.WHISPER_BASE_URL": JSON.stringify(env.WHISPER_BASE_URL || ""),
      "process.env.OPENWHISPR_TRANSCRIPTION_BASE_URL": JSON.stringify(env.OPENWHISPR_TRANSCRIPTION_BASE_URL || ""),
      "process.env.OPENAI_API_KEY": JSON.stringify(env.OPENAI_API_KEY || ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      port: devServerPort,
      strictPort: true,
      host: "127.0.0.1",
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      rolldownOptions: {
        external: [
          "electron",
          "fs",
          "path",
          "child_process",
          "https",
          "http",
          "crypto",
          "os",
          "stream",
          "util",
          "zlib",
          "tar",
          "unzipper",
          "@aws-sdk/client-s3",
        ],
        output: {
          manualChunks(id) {
            if (
              id.includes("@radix-ui/react-dialog") ||
              id.includes("@radix-ui/react-dropdown-menu") ||
              id.includes("@radix-ui/react-select") ||
              id.includes("@radix-ui/react-tabs")
            ) {
              return "vendor-radix";
            }
          },
        },
      },
    },
  };
});
