# One-shot Windows build that produces dist\win-unpacked\OpenWhispr.exe
# (the portable build the user double-clicks). Bypasses the broken
# diarization-models step in upstream prebuild:win (uses bzip2, not
# available on Windows) and bypasses the npm prebuild:win chain which
# uses `|| true` syntax that cmd.exe does not understand.
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($msg) { Write-Host "[build] $msg" -ForegroundColor Cyan }

Step "1/4 compile native modules (Windows ones only)"
node scripts/build-windows-key-listener.js
node scripts/build-windows-fast-paste.js
node scripts/build-text-monitor.js
node scripts/build-media-remote.js
node scripts/build-mediaremote-adapter.js

Step "2/4 verify all required binaries are present"
$required = @(
  "resources\bin\whisper-server-win32-x64.exe",
  "resources\bin\windows-key-listener.exe",
  "resources\bin\windows-fast-paste.exe",
  "resources\bin\windows-text-monitor.exe"
)
$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing) {
  Write-Host "[build] missing: $($missing -join ', ')" -ForegroundColor Yellow
  Write-Host "[build] downloading via bootstrap-windows.js ..."
  node scripts/bootstrap-windows.js
}

Step "3/4 build renderer (vite production bundle)"
npm run build:renderer

Step "4/4 electron-builder --win (portable + nsis)"
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
& node_modules\.bin\electron-builder.cmd --win --x64 --config.npmRebuild=false

if ($LASTEXITCODE -ne 0) { throw "electron-builder failed ($LASTEXITCODE)" }

$exe = "dist\win-unpacked\OpenWhispr.exe"
if (Test-Path $exe) {
  $size = [math]::Round((Get-Item $exe).Length / 1MB, 1)
  Write-Host ""
  Write-Host "[build] DONE: $exe ($size MB)" -ForegroundColor Green
} else {
  Write-Host "[build] DONE (but $exe not found - check dist\)" -ForegroundColor Yellow
}