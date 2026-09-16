@echo off
REM Stop all OpenWhispr dev processes (electron / node / vite / conhost / cmd
REM wrappers from npm run dev, plus anything bound to the Vite dev port 5183).
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-dev.ps1"
endlocal