// One-shot Windows packager using @electron/packager (no electron-builder,
// no npm-prefix dependency). Produces dist\OpenWhispr-win32-x64\OpenWhispr.exe
// (renamed from electron.exe, with our app bundle alongside).
const packager = require("electron-packager");

(async () => {
  const out = await packager({
    dir: ".",
    name: "OpenWhispr",
    platform: "win32",
    arch: "x64",
    out: "dist",
    overwrite: true,
    icon: "src/assets/icon.ico",
    appCopyright: "(c) 2026 OpenWhispr Team",
    win32metadata: {
      ProductName: "OpenWhispr",
      InternalName: "OpenWhispr",
      FileDescription: "Voice-to-text dictation with local Whisper"
    },
    // Skip our dev artifacts / git / build outputs from the asar-bundle dir,
    // but DO include resources/ (the sidecar binaries live there).
    ignore: [
      /^\/dist($|\/)/,
      /^\/\.git($|\/)/,
      /^\/node_modules\/electron($|\/)/,
      /^\/scripts($|\/)/,
      /^\/test($|\/)/
    ],
    asar: true
  });
  console.log("OK:", out);
})().catch((e) => {
  console.error("FAIL:", e && e.stack || e);
  process.exit(1);
});