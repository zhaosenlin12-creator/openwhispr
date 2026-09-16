@echo off
REM Stop all OpenWhispr dev processes (electron, node, vite).
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process electron,node -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*openwhispr*' } | Stop-Process -Force; Write-Host 'OpenWhispr stopped.'"