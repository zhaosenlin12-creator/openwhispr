@echo off
REM Fast start: no Vite, no predev:main, no npm. Just Electron + the prebuilt
REM renderer. Assumes build:renderer was run at least once (produces src\dist\)
REM and bootstrap-windows.js was run (whisper binaries in resources\bin\).
setlocal
cd /d "%~dp0"
if not exist "src\dist\index.html" (
  echo [start-fast] src\dist\index.html not found - running one-time renderer build...
  call npm run build:renderer
  if errorlevel 1 exit /b 1
)
set NODE_ENV=production
"node_modules\electron\dist\electron.exe" .
endlocal